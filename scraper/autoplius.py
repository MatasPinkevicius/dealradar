from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from scraper.parser import parse_listing_cards
from scraper.utils import logger, polite_delay

BASE_URL = "https://autoplius.lt/skelbimai/naudoti-automobiliai"

BRAND_IDS = {
    # Tier 1 - Most popular
    'Volkswagen': 43,
    'BMW': 97,
    'Audi': 99,
    'Opel': 60,
    'Mercedes-Benz': 67,
    'Ford': 85,
    'Toyota': 44,
    'Renault': 54,
    'Peugeot': 59,
    'Volvo': 42,
    # Tier 2 - Popular
    'Skoda': 48,
    'Citroen': 92,
    'Honda': 84,
    'Nissan': 62,
    'Hyundai': 82,
    'Kia': 77,
    'Mazda': 68,
    'Mitsubishi': 63,
    'Seat': 49,
    'Subaru': 46,
    # Tier 3 - Less common but worth getting
    'Chevrolet': 94,
    'Suzuki': 45,
    'Jeep': 78,
    'Land Rover': 73,
    'Lexus': 72,
    'Fiat': 86,
    'Dacia': 110,
    'SsangYong': 40,
    'Alfa Romeo': 103,
    'Mini': 64,
    'Porsche': 56,
    'Lada': 76,
    'Smart': 47,
    'Infiniti': 81,
    'Tesla': 19524,
}


def get_page_html(page, url: str) -> str | None:
    try:
        logger.info(f"Loading: {url}")
        page.goto(url, timeout=60000, wait_until="domcontentloaded")
        page.wait_for_selector(".announcement-item", timeout=30000)
        return page.content()
    except PlaywrightTimeout:
        logger.warning(f"Timeout loading page: {url}")
        return None
    except Exception as e:
        logger.warning(f"Error loading page {url}: {e}")
        return None


def build_url(page_num: int = 1) -> str:
    if page_num == 1:
        return BASE_URL
    return f"{BASE_URL}?page_nr={page_num}"


def build_brand_url(make_id: int, page_num: int = 1) -> str:
    if page_num == 1:
        return f"{BASE_URL}?make_id={make_id}"
    return f"{BASE_URL}?make_id={make_id}&page_nr={page_num}"


def scrape_all_listings(max_pages: int = 100) -> list[dict]:
    """Scrape general listings page by page. Max 200 pages on autoplius.lt"""
    all_listings = []

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

        for page_num in range(1, max_pages + 1):
            url = build_url(page_num)
            html = get_page_html(page, url)

            if not html:
                logger.warning(f"Failed to load page {page_num}, stopping.")
                break

            listings = parse_listing_cards(html)

            if not listings:
                logger.info(f"No listings on page {page_num}, reached end.")
                break

            all_listings.extend(listings)
            logger.info(f"Page {page_num}: got {len(listings)} listings. Total so far: {len(all_listings)}")

            if page_num < max_pages:
                polite_delay()

        browser.close()

    logger.info(f"Scraping complete. Total listings collected: {len(all_listings)}")
    return all_listings


def scrape_brand_listings(make_id: int, brand_name: str, max_pages: int = 200) -> list[dict]:
    """Scrape listings for a specific brand. Max 200 pages per brand."""
    all_listings = []

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

        for page_num in range(1, max_pages + 1):
            url = build_brand_url(make_id, page_num)
            html = get_page_html(page, url)

            if not html:
                logger.warning(f"Failed to load page {page_num} for {brand_name}")
                break

            listings = parse_listing_cards(html)

            if not listings:
                logger.info(f"{brand_name} finished at page {page_num}")
                break

            all_listings.extend(listings)
            logger.info(f"{brand_name} page {page_num}: {len(listings)} listings. Total: {len(all_listings)}")

            if page_num < max_pages:
                polite_delay()

        browser.close()

    return all_listings


def scrape_top_brands(pages_per_brand: int = 200) -> list[dict]:
    """Scrape all top brands up to 200 pages each."""
    all_listings = []
    total_brands = len(BRAND_IDS)
    for i, (brand_name, make_id) in enumerate(BRAND_IDS.items()):
        logger.info(f"Scraping {brand_name} ({i+1}/{total_brands})...")
        listings = scrape_brand_listings(make_id, brand_name, max_pages=pages_per_brand)
        all_listings.extend(listings)
        logger.info(f"{brand_name} done: {len(listings)} listings. Grand total: {len(all_listings)}")
        polite_delay()
    return all_listings