import os
import psycopg2
import psycopg2.extras
from collections import defaultdict
from dotenv import load_dotenv

load_dotenv()

MIN_COMPARABLES = 5


def get_connection():
    url = os.getenv("DATABASE_URL")
    return psycopg2.connect(url)


def get_mileage_bucket(mileage_km):
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


def median(values):
    sorted_vals = sorted(values)
    n = len(sorted_vals)
    mid = n // 2
    if n % 2 == 0:
        return (sorted_vals[mid - 1] + sorted_vals[mid]) / 2
    return float(sorted_vals[mid])


def calculate_deal_score(price: float, estimated_price: float) -> float:
    if not price or not estimated_price or estimated_price == 0:
        return None
    pct_diff = (estimated_price - price) / estimated_price * 100
    # Need 50%+ below market for score of 100
    # At market price = 50
    # 50%+ above market = 0
    score = 50 + (pct_diff * (50 / 50))
    return round(max(0, min(100, score)), 1)


def run_scoring():
    """
    Score all listings using a single connection and in-memory comparables.
    """
    conn = get_connection()

    try:
        with conn.cursor() as cur:
            print("Loading all listings into memory...")
            cur.execute("""
                SELECT id, brand, model, year, mileage_km,
                       fuel_type, transmission, price_eur
                FROM listings
                WHERE is_active = TRUE
                  AND price_eur IS NOT NULL
                  AND price_eur > 0
                ORDER BY id
            """)
            all_listings = [
                {
                    "id": r[0],
                    "brand": r[1],
                    "model": r[2],
                    "year": r[3],
                    "mileage_km": r[4],
                    "fuel_type": r[5],
                    "transmission": r[6],
                    "price_eur": float(r[7]),
                }
                for r in cur.fetchall()
            ]
            print(f"Loaded {len(all_listings)} listings. Scoring...")

            by_brand_model = defaultdict(list)
            for l in all_listings:
                if l["brand"] and l["model"]:
                    key = (l["brand"].lower(), l["model"].lower())
                    by_brand_model[key].append(l)

            scored = 0
            skipped = 0
            updates = []

            for i, listing in enumerate(all_listings):
                brand = listing.get("brand")
                model = listing.get("model")
                year = listing.get("year")
                mileage = listing.get("mileage_km")
                price = listing.get("price_eur")

                if not brand or not model or not year:
                    skipped += 1
                    continue

                key = (brand.lower(), model.lower())
                candidates = by_brand_model[key]

                mileage_min, mileage_max = get_mileage_bucket(mileage)

                comparables = [
                    c for c in candidates
                    if c["id"] != listing["id"]
                    and c["price_eur"] > 0
                    and (c["mileage_km"] is None or mileage_min <= c["mileage_km"] <= mileage_max)
                    and c["year"] is not None
                    and abs(c["year"] - year) <= 5
                ]

                if len(comparables) < MIN_COMPARABLES:
                    skipped += 1
                    continue

                prices = [c["price_eur"] for c in comparables]
                estimated_price = median(prices)

                if estimated_price > price * 3:
                    skipped += 1
                    continue

                price_vs_median = round((price - estimated_price) / estimated_price * 100, 2)
                deal_score = calculate_deal_score(price, estimated_price)

                updates.append((
                    deal_score,
                    round(estimated_price, 2),
                    price_vs_median,
                    len(comparables),
                    listing["id"],
                ))
                scored += 1

                if (i + 1) % 500 == 0:
                    print(f"  Progress: {i+1}/{len(all_listings)}...")

            print(f"Saving {len(updates)} scores to database...")
            with conn.cursor() as cur:
                cur.execute("UPDATE listings SET deal_score = NULL, estimated_price = NULL, price_vs_median = NULL, comparable_count = NULL")
                psycopg2.extras.execute_batch(cur, """
                    UPDATE listings
                    SET deal_score = %s,
                        estimated_price = %s,
                        price_vs_median = %s,
                        comparable_count = %s
                    WHERE id = %s
                """, updates, page_size=500)
            conn.commit()

            print(f"Done. Scored: {scored}, Skipped: {skipped}")

    finally:
        conn.close()