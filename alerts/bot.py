import os
import asyncio
from dotenv import load_dotenv
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import telegram as tg
from telegram.ext import Application, CommandHandler, ContextTypes
import psycopg2

load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")


def get_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))


def save_subscriber(chat_id: int, username: str, first_name: str):
    """Save or update a subscriber in the database."""
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO telegram_subscribers (chat_id, username, first_name)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (chat_id) DO UPDATE
                    SET is_active = TRUE,
                        username = EXCLUDED.username,
                        first_name = EXCLUDED.first_name
                """, (chat_id, username, first_name))
    finally:
        conn.close()


def remove_subscriber(chat_id: int):
    """Mark subscriber as inactive."""
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE telegram_subscribers SET is_active = FALSE WHERE chat_id = %s",
                    (chat_id,)
                )
    finally:
        conn.close()


async def start(update: tg.Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command."""
    user = update.effective_user
    save_subscriber(user.id, user.username, user.first_name)

    await update.message.reply_text(
        f"Sveiki, {user.first_name}! 👋\n\n"
        f"📡 *DealRadar* — automatinis naudotų automobilių rinkos analizatorius.\n\n"
        f"Gausite pranešimus apie geriausius pasiūlymus autoplius.lt svetainėje.\n\n"
        f"Komandos:\n"
        f"/start — Prenumeruoti įspėjimus\n"
        f"/stop — Atšaukti prenumeratą\n"
        f"/deals — Peržiūrėti geriausius pasiūlymus\n\n"
        f"🌐 dealradar.lt",
        parse_mode="Markdown"
    )


async def stop(update: tg.Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /stop command."""
    user = update.effective_user
    remove_subscriber(user.id)

    await update.message.reply_text(
        "Prenumerata atšaukta. Nebegausite pranešimų.\n"
        "Norėdami vėl prenumeruoti, parašykite /start"
    )


async def deals(update: tg.Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /deals command - show top 5 current deals."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT brand, model, year, mileage_km, price_eur,
                       estimated_price, price_vs_median, deal_score, url
                FROM listings
                WHERE deal_score >= 75
                  AND is_active = TRUE
                  AND body_type IN (
                    'Sedanas', 'Universalas', 'Hečbekas',
                    'Visureigis / Krosoveris', 'Vienatūris',
                    'Kupė (Coupe)', 'Kabrioletas', 'Pikapas'
                  )
                ORDER BY deal_score DESC
                LIMIT 5
            """)
            listings = cur.fetchall()
    finally:
        conn.close()

    if not listings:
        await update.message.reply_text("Šiuo metu nėra gerų pasiūlymų. Bandykite vėliau.")
        return

    message = "🏆 *Top 5 pasiūlymai šiuo metu:*\n\n"
    for l in listings:
        brand, model, year, mileage, price, estimated, pct, score, url = l
        mileage_str = f"{mileage:,} km" if mileage else "N/A"
        message += (
            f"🚗 *{brand} {model} {year}*\n"
            f"💰 €{price:,.0f} (rinka: €{estimated:,.0f})\n"
            f"📉 {pct:.1f}% žemiau rinkos\n"
            f"⭐ Balas: {score:.0f}/100\n"
            f"🛣 {mileage_str}\n"
            f"🔗 [Žiūrėti]({url})\n\n"
        )

    await update.message.reply_text(message, parse_mode="Markdown")


def run_bot():
    """Start the bot."""
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("stop", stop))
    app.add_handler(CommandHandler("deals", deals))

    print("Bot started. Press Ctrl+C to stop.")
    app.run_polling(allowed_updates=tg.Update.ALL_TYPES)


if __name__ == "__main__":
    run_bot()