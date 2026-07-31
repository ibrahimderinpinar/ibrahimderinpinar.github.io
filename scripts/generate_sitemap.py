#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape

BASE_URL = "https://www.derinpinar.av.tr"
REPO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_FILE = REPO_ROOT / "sitemap.xml"

CANONICAL_TAG_RE = re.compile(r"<link\b[^>]*>", re.IGNORECASE)
HREF_RE = re.compile(r'href=["\']([^"\']+)["\']', re.IGNORECASE)


def list_published_html_files() -> list[Path]:
    files = sorted(
        path
        for path in REPO_ROOT.rglob("*.html")
        if path.is_file()
        and "(" not in path.name
        and ")" not in path.name
        and not any(part.startswith(".") for part in path.relative_to(REPO_ROOT).parts)
    )
    return files


def read_canonical_url(path: Path) -> str | None:
    content = path.read_text(encoding="utf-8", errors="ignore")
    for match in CANONICAL_TAG_RE.finditer(content):
        tag = match.group(0)
        if "rel=\"canonical\"" not in tag.lower() and "rel='canonical'" not in tag.lower():
            continue
        href_match = HREF_RE.search(tag)
        if href_match:
            return href_match.group(1).strip()
    return None


def get_loc(path: Path) -> str:
    canonical = read_canonical_url(path)
    if canonical:
        return canonical
    if path.name == "index.html":
        return f"{BASE_URL}/"
    relative_path = path.relative_to(REPO_ROOT).as_posix()
    return f"{BASE_URL}/{relative_path}"


def get_priority_and_changefreq(path: Path) -> tuple[str, str]:
    name = path.name
    if name == "index.html":
        return "1.0", "weekly"
    if name == "makaleler.html":
        return "0.9", "weekly"
    return "0.8", "monthly"


def get_lastmod(path: Path) -> str:
    try:
        completed = subprocess.run(
            ["git", "log", "-1", "--format=%cs", "--", str(path.relative_to(REPO_ROOT))],
            cwd=REPO_ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        lastmod = completed.stdout.strip()
        if lastmod:
            return lastmod
    except Exception:
        pass
    return date.today().isoformat()


def build_xml() -> str:
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">',
        "",
    ]

    for html_file in list_published_html_files():
        loc = get_loc(html_file)
        priority, changefreq = get_priority_and_changefreq(html_file)
        lastmod = get_lastmod(html_file)

        lines.extend(
            [
                "  <url>",
                f"    <loc>{escape(loc)}</loc>",
                f"    <lastmod>{lastmod}</lastmod>",
                f"    <changefreq>{changefreq}</changefreq>",
                f"    <priority>{priority}</priority>",
                "  </url>",
                "",
            ]
        )

    lines.append("</urlset>")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    OUTPUT_FILE.write_text(build_xml(), encoding="utf-8")


if __name__ == "__main__":
    main()
