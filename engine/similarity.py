import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    url = os.getenv("DATABASE_URL")
    return psycopg2.connect(url)


def get_mileage_bucket(mileage_km: int) -> tuple[int, int]:
    """
    Group mileage into buckets so we only compare cars
    in the same condition bracket.

    0-50k     = low mileage
    50k-150k  = medium mileage
    150k-250k = high mileage
    250k-350k = very high mileage
    350k+     = extreme mileage
    """
    if mileage_km is None:
        return (0, 999999)
    elif mileage_km < 50000:
        return (0, 50000)
    elif mileage_km < 150000:
        return (50000, 150000)
    elif mileage_km < 250000:
        return (150000, 250000)
    elif mileage_km < 350000:
        return (250000, 350000)
    else:
        return (350000, 999999)


def find_comparables(listing: dict, min_count: int = 5) -> list[dict]:
    """
    Find similar listings to compare against.

    Hard constraints (never relaxed):
    - Same brand + model
    - Same mileage bucket
    - Year always within ±5 years maximum

    Soft constraints (relaxed progressively):
    - Fuel type (dropped in attempt 2)
    - Year ±3 relaxed to ±5 in attempt 3
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:

            brand = listing.get("brand")
            model = listing.get("model")
            year = listing.get("year")
            mileage = listing.get("mileage_km")
            fuel = listing.get("fuel_type")
            listing_id = listing.get("id")

            if not brand or not model or not year:
                return []

            # Mileage bucket is a hard constraint — never compare across brackets
            mileage_min, mileage_max = get_mileage_bucket(mileage)

            base_params = {
                "brand": brand,
                "model": model,
                "id": listing_id,
                "mileage_min": mileage_min,
                "mileage_max": mileage_max,
            }

            # --- Attempt 1: Same bucket + year ±3 + same fuel ---
            if fuel:
                params = {
                    **base_params,
                    "year_min": year - 3,
                    "year_max": year + 3,
                    "fuel": fuel,
                }
                cur.execute("""
                    SELECT id, price_eur, year, mileage_km, fuel_type, transmission
                    FROM listings
                    WHERE brand = %(brand)s
                      AND model = %(model)s
                      AND price_eur IS NOT NULL
                      AND price_eur > 0
                      AND id != %(id)s
                      AND is_active = TRUE
                      AND mileage_km BETWEEN %(mileage_min)s AND %(mileage_max)s
                      AND year BETWEEN %(year_min)s AND %(year_max)s
                      AND fuel_type = %(fuel)s
                    ORDER BY price_eur
                """, params)
                rows = cur.fetchall()
                if len(rows) >= min_count:
                    return _rows_to_list(rows)

            # --- Attempt 2: Same bucket + year ±3, any fuel ---
            params = {
                **base_params,
                "year_min": year - 3,
                "year_max": year + 3,
            }
            cur.execute("""
                SELECT id, price_eur, year, mileage_km, fuel_type, transmission
                FROM listings
                WHERE brand = %(brand)s
                  AND model = %(model)s
                  AND price_eur IS NOT NULL
                  AND price_eur > 0
                  AND id != %(id)s
                  AND is_active = TRUE
                  AND mileage_km BETWEEN %(mileage_min)s AND %(mileage_max)s
                  AND year BETWEEN %(year_min)s AND %(year_max)s
                ORDER BY price_eur
            """, params)
            rows = cur.fetchall()
            if len(rows) >= min_count:
                return _rows_to_list(rows)

            # --- Attempt 3: Same bucket + year ±5, any fuel ---
            params = {
                **base_params,
                "year_min": year - 5,
                "year_max": year + 5,
            }
            cur.execute("""
                SELECT id, price_eur, year, mileage_km, fuel_type, transmission
                FROM listings
                WHERE brand = %(brand)s
                  AND model = %(model)s
                  AND price_eur IS NOT NULL
                  AND price_eur > 0
                  AND id != %(id)s
                  AND is_active = TRUE
                  AND mileage_km BETWEEN %(mileage_min)s AND %(mileage_max)s
                  AND year BETWEEN %(year_min)s AND %(year_max)s
                ORDER BY price_eur
            """, params)
            rows = cur.fetchall()
            if len(rows) >= min_count:
                return _rows_to_list(rows)

            # Not enough comparables found — return empty
            # Better to skip scoring than score with bad comparables
            return []

    finally:
        conn.close()


def _rows_to_list(rows) -> list[dict]:
    """Convert database rows to list of dicts."""
    return [
        {
            "id": r[0],
            "price_eur": float(r[1]),
            "year": r[2],
            "mileage_km": r[3],
            "fuel_type": r[4],
            "transmission": r[5],
        }
        for r in rows
    ]