from pathlib import Path
import os

BASE_DIR = Path(__file__).parent

SITE_URL = os.getenv("SITE_URL", "https://derinpinar.av.tr/")
DATE_RANGE_DAYS = int(os.getenv("DATE_RANGE_DAYS", "90"))

REPORTS_DIR = BASE_DIR / "reports"
DATA_DIR = BASE_DIR / "data"
CREDENTIALS_DIR = BASE_DIR / "credentials"

REPORTS_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)
CREDENTIALS_DIR.mkdir(exist_ok=True)
