from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from scraper.parser import parse_listing_cards
from scraper.utils import logger, polite_delay

BASE_URL = "https://autoplius.lt/skelbimai/used-cars"


def get_page_html(page, url: str) -> str | None:
    """
    Load a URL with Playwright and return the page HTML.
    Returns None if the page fails to load.
    """
    try:
        logger.info(f"Loading: {url}")
        page.goto(url, timeout=30000, wait_until="domcontentloaded")
        page.wait_for_selector(".announcement-item", timeout=15000)
        return page.content()

    except PlaywrightTimeout:
        logger.warning(f"Timeout loading page: {url}")
        return None
    except Exception as e:
        logger.warning(f"Error loading page {url}: {e}")
        return None


def build_url(page_num: int = 1) -> str:
    """Build the URL for a given page number."""
    if page_num == 1:
        return BASE_URL
    return f"{BASE_URL}?page_nr={page_num}"


def scrape_all_listings(max_pages: int = 50) -> list[dict]:
    """
    Main scraping function.
    Goes page by page up to max_pages.
    Stops early if a page returns no listings (end of results).
    Default 50 pages = ~1000 listings.
    """
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

            # If we get zero listings, we've gone past the last page
            if not listings:
                logger.info(f"No listings on page {page_num}, reached end.")
                break

            all_listings.extend(listings)
            logger.info(f"Page {page_num}: got {len(listings)} listings. Total so far: {len(all_listings)}")

            # Don't delay after the last page
            if page_num < max_pages:
                polite_delay()

        browser.close()

    logger.info(f"Scraping complete. Total listings collected: {len(all_listings)}")
    return all_listings