import os
import psycopg2
from dotenv import load_dotenv
from alerts.telegram import send_message, format_deal_alert
import time

load_dotenv()


def get_connection():
    url = os.getenv("DATABASE_URL")
    return psycopg2.connect(url)


def send_top_deals(min_score: float = 75, limit: int = 10):
    """
    Find the best deals and send them via Telegram.
    Only sends listings that haven't been alerted yet.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, brand, model, year, mileage_km, price_eur,
                       estimated_price, price_vs_median, deal_score,
                       location, url, fuel_type, transmission
                FROM listings
                WHERE deal_score >= %s
                  AND is_active = TRUE
                  AND alerted = FALSE
                ORDER BY deal_score DESC
                LIMIT %s
            """, (min_score, limit))

            rows = cur.fetchall()
            listings = [
                {
                    "id": r[0], "brand": r[1], "model": r[2],
                    "year": r[3], "mileage_km": r[4], "price_eur": r[5],
                    "estimated_price": r[6], "price_vs_median": r[7],
                    "deal_score": r[8], "location": r[9], "url": r[10],
                    "fuel_type": r[11], "transmission": r[12],
                }
                for r in rows
            ]

        if not listings:
            print("No new deals to alert.")
            return

        print(f"Sending {len(listings)} deal alerts...")

        alerted_ids = []
        for listing in listings:
            message = format_deal_alert(listing)
            success = send_message(message)
            if success:
                alerted_ids.append(listing["id"])
                print(f"Sent alert for {listing['brand']} {listing['model']} (score: {listing['deal_score']})")
                time.sleep(1)  # Don't spam Telegram

        # Mark as alerted so we don't send them again
        if alerted_ids:
            with conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE listings SET alerted = TRUE WHERE id = ANY(%s)",
                        (alerted_ids,)
                    )
            print(f"Marked {len(alerted_ids)} listings as alerted.")

    finally:
        conn.close()