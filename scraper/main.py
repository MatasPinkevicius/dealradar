import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.autoplius import scrape_all_listings, scrape_top_brands
from scraper.db import start_scrape_run, finish_scrape_run, upsert_listings_batch, mark_stale_listings_inactive
from scraper.utils import logger
from engine.scorer import run_scoring
from alerts.dispatcher import send_top_deals

BATCH_SIZE = 50


def run_scrape(max_pages: int = 100):
    """Regular scrape - newest listings."""
    logger.info("=== Starting scrape run ===")
    run_id = start_scrape_run()

    try:
        listings = scrape_all_listings(max_pages=max_pages)

        if not listings:
            logger.warning("No listings collected. Check scraper.")
            finish_scrape_run(run_id, 0, 0, status="failed")
            return

        total_new = 0
        total_saved = 0

        for i in range(0, len(listings), BATCH_SIZE):
            batch = listings[i:i + BATCH_SIZE]
            saved, new = upsert_listings_batch(batch, run_id)
            total_saved += saved
            total_new += new
            logger.info(f"Progress: {total_saved}/{len(listings)} saved...")

        finish_scrape_run(run_id, total_saved, total_new)
        logger.info(f"=== Scrape complete: {total_saved} found, {total_new} new ===")

        # Mark stale listings as inactive
        mark_stale_listings_inactive(days=7)

        if total_new > 0:
            logger.info("Running scoring engine...")
            run_scoring()
            logger.info(f"Sending alerts for {total_new} new listings...")
            send_top_deals(min_score=75, limit=5)
        else:
            logger.info("No new listings found — skipping scoring and alerts")

    except Exception as e:
        logger.error(f"Scrape run failed: {e}")
        finish_scrape_run(run_id, 0, 0, status="failed")
        raise


def run_brand_scrape(pages_per_brand: int = 20):
    """Targeted brand scrape for better score accuracy."""
    logger.info("=== Starting brand scrape ===")
    run_id = start_scrape_run()

    try:
        listings = scrape_top_brands(pages_per_brand=pages_per_brand)

        if not listings:
            logger.warning("No listings collected.")
            finish_scrape_run(run_id, 0, 0, status="failed")
            return

        total_new = 0
        total_saved = 0

        for i in range(0, len(listings), BATCH_SIZE):
            batch = listings[i:i + BATCH_SIZE]
            saved, new = upsert_listings_batch(batch, run_id)
            total_saved += saved
            total_new += new
            logger.info(f"Progress: {total_saved}/{len(listings)} saved...")

        finish_scrape_run(run_id, total_saved, total_new)
        logger.info(f"=== Brand scrape complete: {total_saved} found, {total_new} new ===")

        if total_new > 0:
            logger.info("Running scoring engine...")
            run_scoring()

    except Exception as e:
        logger.error(f"Brand scrape failed: {e}")
        finish_scrape_run(run_id, 0, 0, status="failed")
        raise


if __name__ == "__main__":
    run_scrape(max_pages=100)