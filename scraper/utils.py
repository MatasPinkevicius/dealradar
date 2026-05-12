import logging
import time
import random

# Set up logging so we can see what the scraper is doing in the terminal
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def polite_delay(min_seconds: float = 5.0, max_seconds: float = 10.0):
    """
    Wait a random amount of time between requests.
    This is important — it prevents us from hammering the server
    and getting our IP blocked.
    """
    delay = random.uniform(min_seconds, max_seconds)
    logger.info(f"Waiting {delay:.1f}s before next request...")
    time.sleep(delay)


def safe_int(value: str) -> int | None:
    """Convert a string to int, return None if it fails."""
    try:
        # Remove spaces and non-numeric characters like "km" or "€"
        cleaned = "".join(filter(str.isdigit, str(value)))
        return int(cleaned) if cleaned else None
    except (ValueError, TypeError):
        return None


def safe_float(value: str) -> float | None:
    """Convert a string to float, return None if it fails."""
    try:
        cleaned = "".join(c for c in str(value) if c.isdigit() or c == ".")
        return float(cleaned) if cleaned else None
    except (ValueError, TypeError):
        return None