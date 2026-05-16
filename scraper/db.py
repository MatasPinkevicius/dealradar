import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from scraper.utils import logger

load_dotenv()


def get_connection():
    url = os.getenv("DATABASE_URL")
    if not url:
        raise ValueError("DATABASE_URL not set in .env file")
    return psycopg2.connect(url)


def start_scrape_run() -> int:
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO scrape_runs (status) VALUES ('running') RETURNING id"
                )
                run_id = cur.fetchone()[0]
                logger.info(f"Started scrape run #{run_id}")
                return run_id
    finally:
        conn.close()


def finish_scrape_run(run_id: int, listings_found: int, listings_new: int, status: str = "success"):
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE scrape_runs
                    SET finished_at = NOW(),
                        listings_found = %s,
                        listings_new = %s,
                        status = %s
                    WHERE id = %s
                    """,
                    (listings_found, listings_new, status, run_id),
                )
                logger.info(f"Finished scrape run #{run_id} — found {listings_found}, new {listings_new}")
    finally:
        conn.close()


def upsert_listings_batch(listings: list[dict], run_id: int) -> tuple[int, int]:
    if not listings:
        return 0, 0

    conn = get_connection()
    new_count = 0

    try:
        with conn:
            with conn.cursor() as cur:
                for listing in listings:
                    cur.execute(
                        "SELECT id, price_eur FROM listings WHERE external_id = %s",
                        (listing["external_id"],),
                    )
                    existing = cur.fetchone()

                    if existing:
                        existing_id, old_price = existing
                        new_price = listing.get("price_eur")

                        if new_price and old_price and float(new_price) != float(old_price):
                            cur.execute(
                                "INSERT INTO price_history (listing_id, price_eur) VALUES (%s, %s)",
                                (existing_id, new_price),
                            )
                            logger.info(f"Price change: {listing['external_id']} {old_price} → {new_price}")

                        cur.execute(
                            """
                            UPDATE listings
                            SET last_seen_at = NOW(),
                                price_eur = %s,
                                is_active = TRUE,
                                scrape_run_id = %s
                            WHERE external_id = %s
                            """,
                            (new_price, run_id, listing["external_id"]),
                        )
                    else:
                        cur.execute(
                            """
                            INSERT INTO listings (
                                external_id, url, brand, model, year, mileage_km,
                                engine_cc, fuel_type, transmission, drivetrain,
                                body_type, color, price_eur, title, description,
                                image_url, location, posted_at, scrape_run_id
                            ) VALUES (
                                %(external_id)s, %(url)s, %(brand)s, %(model)s, %(year)s, %(mileage_km)s,
                                %(engine_cc)s, %(fuel_type)s, %(transmission)s, %(drivetrain)s,
                                %(body_type)s, %(color)s, %(price_eur)s, %(title)s, %(description)s,
                                %(image_url)s, %(location)s, %(posted_at)s, %(scrape_run_id)s
                            )
                            """,
                            {**listing, "scrape_run_id": run_id},
                        )
                        new_count += 1

        logger.info(f"Batch saved {len(listings)} listings ({new_count} new)")
        return len(listings), new_count

    finally:
        conn.close()


def mark_stale_listings_inactive(days: int = 7):
    """
    Mark listings as inactive if not seen in X days.
    Keeps them in DB for scoring but hides from dashboard.
    """
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE listings SET is_active = FALSE WHERE is_active = TRUE AND last_seen_at < NOW() - INTERVAL '%s days'" % days
                )
                count = cur.rowcount
                logger.info(f"Marked {count} listings as inactive (not seen in {days} days)")
                return count
    finally:
        conn.close()