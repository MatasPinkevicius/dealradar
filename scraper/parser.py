import re
from bs4 import BeautifulSoup
from scraper.utils import logger, safe_int, safe_float


def parse_listing_card(card) -> dict | None:
    """
    Parse a single listing card from the search results page.
    Returns a dict or None if invalid/rental listing.
    """
    try:
        listing = {}

        # --- Skip rental listings ---
        if card.find(class_="rent-price"):
            return None

        # --- URL and external ID ---
        url = card.get("href", "")
        if not url:
            return None
        if not url.startswith("http"):
            url = "https://autoplius.lt" + url
        listing["url"] = url

        # Extract ID from data-id attribute on the bookmark button
        bookmark = card.find(class_="announcement-bookmark-button")
        if bookmark and bookmark.get("data-id"):
            listing["external_id"] = bookmark["data-id"]
        else:
            # Fallback: extract from URL
            id_match = re.search(r"-(\d{6,})\.html", url)
            if not id_match:
                return None
            listing["external_id"] = id_match.group(1)

        # --- Image ---
        # Some images are lazy-loaded and use data-src instead of src
        img = card.find("img", class_="lazy-img")
        if not img:
            img = card.find("img", class_="js-gallery-main-photo")
        if img:
            listing["image_url"] = img.get("data-src") or img.get("src") or None
        else:
            listing["image_url"] = None

        # --- Title (brand + model) ---
        title_el = card.find(class_="announcement-title")
        title = title_el.get_text(strip=True) if title_el else None
        listing["title"] = title

        # Parse brand and model from title e.g. "Audi A6"
        if title:
            parts = title.split()
            listing["brand"] = parts[0] if len(parts) >= 1 else None
            listing["model"] = parts[1] if len(parts) >= 2 else None
        else:
            listing["brand"] = None
            listing["model"] = None

        # --- Year and body type from title-parameters ---
        # e.g. "2008-12" and "Universalas"
        listing["year"] = None
        listing["body_type"] = None

        title_params = card.find(class_="announcement-title-parameters")
        if title_params:
            spans = title_params.find_all("span")
            for span in spans:
                text = span.get_text(strip=True)
                # Year looks like "2008" or "2008-12"
                year_match = re.match(r"^(19|20)(\d{2})", text)
                if year_match:
                    listing["year"] = int(year_match.group(0)[:4])
                elif text:
                    listing["body_type"] = text

        # --- Price ---
        listing["price_eur"] = None
        pricing = card.find(class_="announcement-pricing-info")
        if pricing:
            strong = pricing.find("strong")
            if strong:
                price = safe_int(strong.get_text(strip=True))
                # Skip clearly invalid prices (over 1 million or zero)
                if price and 100 < price < 1_000_000:
                    listing["price_eur"] = price

        # --- Parameters block ---
        # e.g. Dyzelinas | Automatinė | 2.7 l., 132 kW | 452 000 km | Šilalė
        listing["fuel_type"] = None
        listing["transmission"] = None
        listing["engine_cc"] = None
        listing["mileage_km"] = None
        listing["location"] = None
        listing["drivetrain"] = None
        listing["color"] = None
        listing["description"] = None
        listing["posted_at"] = None

        params_block = card.find(class_="announcement-parameters-block")
        if params_block:
            spans = params_block.find_all("span")
            param_texts = [s.get_text(strip=True) for s in spans]

            for text in param_texts:
                text_lower = text.lower()

                # Fuel type
                if any(f in text_lower for f in ["dyzelinas", "benzinas", "elektra", "hibridas", "dujos", "plug-in"]):
                    listing["fuel_type"] = text

                # Transmission
                elif any(t in text_lower for t in ["mechaninė", "automatinė", "robotizuota", "variacinė"]):
                    listing["transmission"] = text

                # Engine: "2.7 l., 132 kW" — extract litres, convert to cc
                elif "l.," in text_lower or ("l." in text_lower and "kw" in text_lower):
                    litre_match = re.search(r"(\d+[\.,]\d+)\s*l", text)
                    if litre_match:
                        litres = float(litre_match.group(1).replace(",", "."))
                        if litres >= 20:
                            listing["engine_cc"] = None
                        else:
                            listing["engine_cc"] = int(litres * 1000)

                # Mileage: contains "km"
                elif "km" in text_lower:
                    km = safe_int(text)
                    if km is not None and km >= 2_000_000:
                        km = None
                    listing["mileage_km"] = km

                # Location: last span that doesn't match anything above
                # (Lithuanian cities won't match fuel/transmission/engine/km patterns)
                elif text and not any(c.isdigit() for c in text):
                    listing["location"] = text

        return listing

    except Exception as e:
        logger.warning(f"Failed to parse listing card: {e}")
        return None


def parse_listing_cards(html: str) -> list[dict]:
    """Parse all listing cards from a search results page."""
    soup = BeautifulSoup(html, "html.parser")
    cards = soup.find_all("a", class_="announcement-item")
    logger.info(f"Found {len(cards)} listing cards on page")

    results = []
    for card in cards:
        parsed = parse_listing_card(card)
        if parsed:
            results.append(parsed)

    logger.info(f"Successfully parsed {len(results)} listings (skipped rentals)")
    return results


def get_total_pages(html: str) -> int:
    """
    Find total number of pages for pagination.
    Returns 1 if pagination not found.
    """
    soup = BeautifulSoup(html, "html.parser")

    # autoplius.lt uses page-navigation-container
    nav = soup.find(class_="page-navigation-container")
    if nav:
        page_numbers = []
        for link in nav.find_all("a"):
            num = safe_int(link.get_text(strip=True))
            if num:
                page_numbers.append(num)
        if page_numbers:
            total = max(page_numbers)
            logger.info(f"Total pages found: {total}")
            return total

    logger.info("No pagination found, assuming 1 page")
    return 1