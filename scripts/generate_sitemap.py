#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
from datetime import date
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
from xml.sax.saxutils import escape

BASE_URL = "https://derinpinar.av.tr"
CANONICAL_HOST = "derinpinar.av.tr"
REPO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_FILE = REPO_ROOT / "sitemap.xml"

CANONICAL_TAG_RE = re.compile(r"<link\b[^>]*>", re.IGNORECASE)
HREF_RE = re.compile(r'href=["\']([^"\']+)["\']', re.IGNORECASE)


def list_published_html_files() -> list[Path]:
    return sorted(
        path
        for path in REPO_ROOT.rglob("*.html")
        if path.is_file()
        and "(" not in path.name
        and ")" not in path.name
        and not any(part.startswith(".") for part in path.relative_to(REPO_ROOT).parts)
    )


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


def expected_path(path: Path) -> str:
    relative = path.relative_to(REPO_ROOT).as_posix()
    if relative == "index.html":
        return "/"
    if relative.endswith("/index.html"):
        return "/" + relative[: -len("index.html")]
    return "/" + relative


def validate_and_normalize_canonical(path: Path, canonical: str) -> str:
    parsed = urlsplit(canonical)
    if parsed.scheme != "https":
        raise ValueError(f"{path}: canonical HTTPS olmalı: {canonical}")
    if parsed.hostname != CANONICAL_HOST:
        raise ValueError(f"{path}: canonical host '{CANONICAL_HOST}' olmalı: {canonical}")
    if parsed.query or parsed.fragment:
        raise ValueError(f"{path}: canonical query/fragment içermemeli: {canonical}")

    wanted_path = expected_path(path)
    canonical_path = parsed.path or "/"
    if canonical_path != wanted_path:
        raise ValueError(
            f"{path}: canonical yolu dosyayla eşleşmiyor. Beklenen {wanted_path}, bulunan {canonical_path}"
        )

    return urlunsplit(("https", CANONICAL_HOST, canonical_path, "", ""))


def get_loc(path: Path) -> str:
    canonical = read_canonical_url(path)
    if canonical:
        return validate_and_normalize_canonical(path, canonical)
    return f"{BASE_URL}{expected_path(path)}"


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
    except (OSError, subprocess.SubprocessError):
        pass
    return date.today().isoformat()


def build_xml() -> str:
    seen: set[str] = set()
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        "",
    ]

    for html_file in list_published_html_files():
        loc = get_loc(html_file)
        if loc in seen:
            raise ValueError(f"Yinelenen sitemap URL'si: {loc}")
        seen.add(loc)

        lines.extend(
            [
                "  <url>",
                f"    <loc>{escape(loc)}</loc>",
                f"    <lastmod>{get_lastmod(html_file)}</lastmod>",
                "  </url>",
                "",
            ]
        )

    lines.append("</urlset>")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    OUTPUT_FILE.write_text(build_xml(), encoding="utf-8")
    print(f"Sitemap oluşturuldu: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
