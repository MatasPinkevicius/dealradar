import os
import httpx
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")


def send_message(text: str) -> bool:
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("Telegram credentials not set in .env")
        return False

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"

    try:
        response = httpx.post(url, json={
            "chat_id": TELEGRAM_CHAT_ID,
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": False,
        }, timeout=10)

        if response.status_code == 200:
            return True
        else:
            print(f"Telegram error: {response.text}")
            return False

    except Exception as e:
        print(f"Failed to send Telegram message: {e}")
        return False


def format_deal_alert(listing: dict) -> str:
    brand = listing.get('brand', '')
    model = listing.get('model', '')
    year = listing.get('year', '')
    mileage = listing.get('mileage_km')
    price = listing.get('price_eur')
    estimated = listing.get('estimated_price')
    pct = listing.get('price_vs_median')
    score = listing.get('deal_score')
    location = listing.get('location', 'N/A')
    url = listing.get('url', '')
    fuel = listing.get('fuel_type', '')
    transmission = listing.get('transmission', '')

    mileage_str = f"{mileage:,} km" if mileage else "N/A"
    pct_str = f"{pct:.1f}%" if pct else "N/A"

    message = (
        f"🚗 <b>{brand} {model} {year}</b>\n"
        f"💰 <b>€{price:,.0f}</b> (est. market: €{estimated:,.0f})\n"
        f"📉 <b>{pct_str} below market</b>\n"
        f"⭐ Deal score: <b>{score:.0f}/100</b>\n"
        f"📍 {location}\n"
        f"🛣 {mileage_str} · {fuel} · {transmission}\n"
        f"🔗 <a href='{url}'>View listing</a>"
    )

    return message


def test_connection():
    return send_message("✅ DealRadar bot is connected and working!")