import os
import math
import psycopg2
import psycopg2.extras
from collections import defaultdict
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    url = os.getenv("DATABASE_URL")
    return psycopg2.connect(url)


def median(values):
    sorted_vals = sorted(values)
    n = len(sorted_vals)
    mid = n // 2
    if n % 2 == 0:
        return (sorted_vals[mid - 1] + sorted_vals[mid]) / 2
    return float(sorted_vals[mid])


def get_year_range(year: int) -> int:
    """Dynamic year matching based on vehicle age."""
    age = datetime.now().year - year
    if age < 8:
        return 2
    elif age < 15:
        return 3
    else:
        return 5


def get_mileage_bucket(mileage_km):
    if mileage_km is None:
        return (0, 999999)
    elif mileage_km < 30000:
        return (0, 30000)
    elif mileage_km < 60000:
        return (30000, 60000)
    elif mileage_km < 100000:
        return (60000, 100000)
    elif mileage_km < 150000:
        return (100000, 150000)
    elif mileage_km < 220000:
        return (150000, 220000)
    elif mileage_km < 300000:
        return (220000, 300000)
    else:
        return (300000, 999999)


def calculate_price_score(price: float, estimated_price: float) -> float:
    """Non-linear price score using tanh. 50 = at market, 100 = far below."""
    if not price or not estimated_price or estimated_price == 0:
        return None
    pct_diff = (estimated_price - price) / estimated_price * 100
    score = 50 + 50 * math.tanh(pct_diff / 25)
    return round(max(0, min(100, score)), 1)


def calculate_confidence_score(comparable_count: int, using_autoplius: bool) -> float:
    """Score based on how trustworthy the price estimate is."""
    if comparable_count >= 50:
        base = 100
    elif comparable_count >= 20:
        base = 85
    elif comparable_count >= 10:
        base = 70
    elif comparable_count >= 5:
        base = 55
    else:
        base = 35

    # Small boost if autoplius median is used as primary source
    if using_autoplius:
        base = min(100, base + 5)

    return float(base)


def calculate_ta_score(ta_date_str: str) -> float:
    """Score based on technical inspection validity. 18 months = max."""
    if not ta_date_str:
        return 50.0  # neutral

    try:
        now = datetime.now(timezone.utc)
        # ta_date format: "2027-07" or "2027"
        if len(ta_date_str) >= 7:
            ta_date = datetime.strptime(ta_date_str[:7], "%Y-%m").replace(tzinfo=timezone.utc)
        else:
            ta_date = datetime.strptime(ta_date_str[:4], "%Y").replace(tzinfo=timezone.utc)

        months_remaining = (ta_date.year - now.year) * 12 + (ta_date.month - now.month)

        if months_remaining >= 18:
            return 100.0
        elif months_remaining >= 12:
            return 85.0
        elif months_remaining >= 6:
            return 65.0
        elif months_remaining >= 1:
            return 30.0
        else:
            return 0.0  # expired

    except Exception:
        return 50.0  # neutral if parse fails


def calculate_liquidity_score(total_brand_model_listings: int) -> float:
    """Score based on how many similar cars exist — more = more liquid market."""
    if total_brand_model_listings >= 50:
        return 100.0
    elif total_brand_model_listings >= 20:
        return 85.0
    elif total_brand_model_listings >= 10:
        return 70.0
    elif total_brand_model_listings >= 5:
        return 55.0
    else:
        return 35.0


def run_scoring():
    """Score all listings using multi-factor scoring system."""
    conn = get_connection()

    try:
        with conn.cursor() as cur:
            print("Loading all listings into memory...")
            cur.execute("""
                SELECT id, brand, model, year, mileage_km,
                       price_eur, autoplius_median, ta_date
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
                    "price_eur": float(r[5]),
                    "autoplius_median": float(r[6]) if r[6] else None,
                    "ta_date": r[7],
                }
                for r in cur.fetchall()
            ]
            print(f"Loaded {len(all_listings)} listings. Scoring...")

            # Group by brand+model for comparables and liquidity
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
                autoplius_median = listing.get("autoplius_median")
                ta_date = listing.get("ta_date")

                if not brand or not model or not year or not price:
                    skipped += 1
                    continue

                key = (brand.lower(), model.lower())
                candidates = by_brand_model[key]

                # Total listings for liquidity score
                total_brand_model = len(candidates)

                # Find comparables with tighter matching
                year_range = get_year_range(year)
                mileage_min, mileage_max = get_mileage_bucket(mileage)

                comparables = [
                    c for c in candidates
                    if c["id"] != listing["id"]
                    and c["price_eur"] > 0
                    and (c["mileage_km"] is None or mileage_min <= c["mileage_km"] <= mileage_max)
                    and c["year"] is not None
                    and abs(c["year"] - year) <= year_range
                ]

                comparable_count = len(comparables)

                # --- Determine estimated price ---
                internal_median = None
                if comparable_count >= 5:
                    prices = [c["price_eur"] for c in comparables]
                    internal_median = median(prices)

                using_autoplius = False

                if comparable_count >= 200 and internal_median:
                    estimated_price = internal_median
                elif comparable_count >= 50 and internal_median and autoplius_median:
                    estimated_price = 0.2 * internal_median + 0.8 * autoplius_median
                    using_autoplius = True
                elif comparable_count >= 10 and internal_median and autoplius_median:
                    estimated_price = 0.1 * internal_median + 0.9 * autoplius_median
                    using_autoplius = True
                elif autoplius_median:
                    estimated_price = autoplius_median
                    using_autoplius = True
                elif internal_median:
                    estimated_price = internal_median
                else:
                    skipped += 1
                    continue

                # Sanity check — reduce confidence instead of skipping
                confidence_penalty = 1.0
                if estimated_price > price * 3:
                    confidence_penalty = 0.4

                # --- Calculate sub-scores ---
                price_score = calculate_price_score(price, estimated_price)
                if price_score is None:
                    skipped += 1
                    continue

                confidence_score = calculate_confidence_score(comparable_count, using_autoplius)
                confidence_score *= confidence_penalty

                ta_score = calculate_ta_score(ta_date)
                liquidity_score = calculate_liquidity_score(total_brand_model)

                # --- Final score ---
                final_score = (
                    price_score * 0.50 +
                    confidence_score * 0.25 +
                    ta_score * 0.15 +
                    liquidity_score * 0.10
                )
                final_score = round(max(0, min(100, final_score)), 1)

                # --- Hard caps ---
                if ta_date:
                    try:
                        now = datetime.now(timezone.utc)
                        if len(ta_date) >= 7:
                            ta_dt = datetime.strptime(ta_date[:7], "%Y-%m").replace(tzinfo=timezone.utc)
                        else:
                            ta_dt = datetime.strptime(ta_date[:4], "%Y").replace(tzinfo=timezone.utc)
                        months_remaining = (ta_dt.year - now.year) * 12 + (ta_dt.month - now.month)
                        if months_remaining < 1:
                            final_score = min(final_score, 60)
                    except Exception:
                        pass

                if comparable_count < 5 and not autoplius_median:
                    final_score = min(final_score, 65)

                # --- price_vs_median for display ---
                price_vs_median = round((price - estimated_price) / estimated_price * 100, 2)

                updates.append((
                    final_score,
                    round(estimated_price, 2),
                    price_vs_median,
                    comparable_count,
                    listing["id"],
                ))
                scored += 1

                if (i + 1) % 500 == 0:
                    print(f"  Progress: {i+1}/{len(all_listings)}...")

            print(f"Saving {len(updates)} scores to database...")
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE listings 
                    SET deal_score = NULL, 
                        estimated_price = NULL, 
                        price_vs_median = NULL, 
                        comparable_count = NULL
                """)
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