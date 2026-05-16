import re
import time
import random
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from bs4 import BeautifulSoup
import psycopg2
import os
from dotenv import load_dotenv
from scraper.utils import logger

load_dotenv()


def get_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))


def get_listings_to_scrape(limit: int = 200) -> list[dict]:
    """Get listings that need detail scraping."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, url, brand, model
                FROM listings
                WHERE is_active = TRUE
                  AND deal_score IS NOT NULL
                  AND description IS NULL
                  AND first_seen_at >= NOW() - INTERVAL '30 days'
                ORDER BY deal_score DESC
                LIMIT %s
            """, (limit,))
            return [
                {"id": r[0], "url": r[1], "brand": r[2], "model": r[3]}
                for r in cur.fetchall()
            ]
    finally:
        conn.close()


def parse_detail_page(html: str) -> dict:
    """Extract detailed info from a listing page."""
    soup = BeautifulSoup(html, "html.parser")
    data = {}

    # --- Check if listing is sold ---
    page_text = soup.get_text().lower()
    if any(word in page_text for word in ["parduota", "nebeparduodama", "skelbimas neaktyvus"]):
        data["is_sold"] = True
        return data

    # --- Description ---
    desc_el = soup.select_one(".announcement-description")
    if desc_el:
        data["description"] = desc_el.get_text(strip=True)[:2000]

    # --- Images ---
    images = []
    for img in soup.select("img.lazy-img, img.announcement-image, [class*='photo'] img"):
        src = img.get("data-src") or img.get("src")
        if src and "autoplius-img" in src and src not in images:
            images.append(src)
    if images:
        data["image_url"] = images[0]

    # --- Parse structured parameters ---
    params = {}

    # Method 1: parameter-row with child elements
    for item in soup.select(".parameter-row"):
        children = item.find_all(recursive=False)
        if len(children) >= 2:
            label = children[0].get_text(strip=True)
            value = children[1].get_text(strip=True)
            if label and value:
                params[label] = value

    # Method 2: list items with spans
    for item in soup.select(".announcement-parameters-list li"):
        spans = item.find_all("span")
        if len(spans) >= 2:
            label = spans[0].get_text(strip=True)
            value = spans[1].get_text(strip=True)
            if label and value:
                params[label] = value

    # Method 3: dt/dd pairs
    for dt in soup.select("dt"):
        dd = dt.find_next_sibling("dd")
        if dd:
            params[dt.get_text(strip=True)] = dd.get_text(strip=True)

    # --- Extract specific fields ---

    # TA date
    ta = params.get("Tech. apžiūra iki")
    if ta:
        data["ta_date"] = ta.strip()

    # First registration
    reg = params.get("Pirma registracija")
    if reg:
        data["first_registration"] = reg.strip()

    # Doors
    doors = params.get("Durų skaičius")
    if doors:
        data["doors"] = doors.strip()

    # Drivetrain
    drive = params.get("Varantieji ratai")
    if drive:
        data["drivetrain_detail"] = drive.strip()

    # Color
    color = params.get("Spalva")
    if color:
        data["color_detail"] = color.strip()

    # Seats
    seats = params.get("Sėdimų vietų skaičius")
    if seats:
        try:
            data["seats"] = int(seats.strip())
        except Exception:
            pass

    # Wheel size
    wheel = params.get("Ratlankių skersmuo")
    if wheel:
        data["wheel_size"] = wheel.strip()

    # Euro standard
    euro = params.get("Euro standartas")
    if euro:
        data["euro_standard"] = euro.strip()

    # Registration tax
    tax = params.get("Registracijos mokestis")
    if tax:
        tax_match = re.search(r"[\d.,]+", tax)
        if tax_match:
            try:
                data["registration_tax"] = float(tax_match.group().replace(",", "."))
            except Exception:
                pass

    # Power in kW from engine string like "1968 cm³, 140 AG (103kW)"
    engine_str = params.get("Variklis", "")
    if engine_str:
        kw_match = re.search(r"(\d+)\s*kW", engine_str)
        if kw_match:
            data["power_kw"] = int(kw_match.group(1))

    return data


def save_detail_data(listing_id: int, data: dict):
    """Update listing with detail data."""
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                if data.get("is_sold"):
                    cur.execute(
                        "UPDATE listings SET is_active = FALSE WHERE id = %s",
                        (listing_id,)
                    )
                    logger.info(f"Marked listing {listing_id} as sold")
                    return

                cur.execute("""
                    UPDATE listings
                    SET description = COALESCE(%s, description),
                        image_url = COALESCE(%s, image_url),
                        ta_date = %s,
                        first_registration = %s,
                        doors = %s,
                        drivetrain_detail = %s,
                        color_detail = %s,
                        seats = %s,
                        wheel_size = %s,
                        euro_standard = %s,
                        registration_tax = %s,
                        power_kw = %s
                    WHERE id = %s
                """, (
                    data.get("description"),
                    data.get("image_url"),
                    data.get("ta_date"),
                    data.get("first_registration"),
                    data.get("doors"),
                    data.get("drivetrain_detail"),
                    data.get("color_detail"),
                    data.get("seats"),
                    data.get("wheel_size"),
                    data.get("euro_standard"),
                    data.get("registration_tax"),
                    data.get("power_kw"),
                    listing_id,
                ))
    finally:
        conn.close()


def run_detail_scrape(batch_size: int = 200):
    """
    Scrape detail pages for listings missing description.
    Run in batches so you can stop/start safely.
    """
    listings = get_listings_to_scrape(limit=batch_size)
    logger.info(f"Detail scraping {len(listings)} listings...")

    if not listings:
        logger.info("No listings need detail scraping.")
        return

    success = 0
    sold = 0
    failed = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            locale="lt-LT",
        )
        page = context.new_page()

        for i, listing in enumerate(listings):
            try:
                logger.info(f"[{i+1}/{len(listings)}] {listing['brand']} {listing['model']} — {listing['url']}")
                page.goto(listing["url"], timeout=30000, wait_until="domcontentloaded")
                page.wait_for_timeout(2000)
                html = page.content()
                data = parse_detail_page(html)

                if data.get("is_sold"):
                    sold += 1
                else:
                    success += 1

                save_detail_data(listing["id"], data)
                time.sleep(random.uniform(3, 6))

            except PlaywrightTimeout:
                logger.warning(f"Timeout on listing {listing['id']}")
                failed += 1
            except Exception as e:
                logger.warning(f"Error on listing {listing['id']}: {e}")
                failed += 1

        browser.close()

    logger.info(f"Detail scrape done. Success: {success}, Sold: {sold}, Failed: {failed}")


if __name__ == "__main__":
    run_detail_scrape(batch_size=200)