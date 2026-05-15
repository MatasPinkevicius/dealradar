import os
import psycopg2
from dotenv import load_dotenv
from alerts.tg_sender import send_message, format_deal_alert
import time

load_dotenv()


def get_connection():
    url = os.getenv("DATABASE_URL")
    return psycopg2.connect(url)


def get_subscribers() -> list[int]:
    """Get all active subscriber chat IDs."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT chat_id FROM telegram_subscribers WHERE is_active = TRUE"
            )
            return [row[0] for row in cur.fetchall()]
    finally:
        conn.close()


def send_to_subscriber(chat_id: int, text: str) -> bool:
    """Send a message to a specific subscriber."""
    import httpx
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        response = httpx.post(url, json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": False,
        }, timeout=10)
        return response.status_code == 200
    except Exception as e:
        print(f"Failed to send to {chat_id}: {e}")
        return False


def send_top_deals(min_score: float = 75, limit: int = 5):
    """
    Find best new deals and send to all subscribers.
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
                  AND first_seen_at >= NOW() - INTERVAL '24 hours'
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

        subscribers = get_subscribers()

        # If no subscribers yet fall back to owner chat ID
        if not subscribers:
            owner_id = os.getenv("TELEGRAM_CHAT_ID")
            if owner_id:
                subscribers = [int(owner_id)]

        print(f"Sending {len(listings)} deals to {len(subscribers)} subscribers...")

        alerted_ids = []
        for listing in listings:
            message = format_deal_alert(listing)
            success_count = 0
            for chat_id in subscribers:
                if send_to_subscriber(chat_id, message):
                    success_count += 1
                time.sleep(0.1)

            if success_count > 0:
                alerted_ids.append(listing["id"])
                print(f"Sent: {listing['brand']} {listing['model']} to {success_count} subscribers")
            time.sleep(1)

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