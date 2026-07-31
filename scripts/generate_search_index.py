#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from html import unescape
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_FILE = REPO_ROOT / "search-index.json"

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


def strip_tags(html: str) -> str:
    html = re.sub(r"<script\b[^>]*>.*?</script>", " ", html, flags=re.IGNORECASE | re.DOTALL)
    html = re.sub(r"<style\b[^>]*>.*?</style>", " ", html, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<[^>]+>", " ", html)
    text = unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def read_canonical_url(content: str) -> str | None:
    for match in CANONICAL_TAG_RE.finditer(content):
        tag = match.group(0)
        if "rel=\"canonical\"" not in tag.lower() and "rel='canonical'" not in tag.lower():
            continue
        href_match = HREF_RE.search(tag)
        if href_match:
            return href_match.group(1).strip()
    return None


def extract_first(content: str, pattern: str) -> str:
    match = re.search(pattern, content, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        return ""
    return strip_tags(match.group(1))


def split_keywords(value: str) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def unique_keep_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for value in values:
        key = value.casefold()
        if not value or key in seen:
            continue
        seen.add(key)
        output.append(value)
    return output


def get_relative_url(path: Path, canonical: str | None) -> str:
    if canonical:
        try:
            after_domain = canonical.split("//", 1)[1].split("/", 1)[1]
            return "/" + after_domain
        except Exception:
            pass
    return "/" + path.relative_to(REPO_ROOT).as_posix()


def extract_article(path: Path) -> dict[str, object] | None:
    content = path.read_text(encoding="utf-8", errors="ignore")
    if '<article class="article-container"' not in content:
        return None

    canonical = read_canonical_url(content)
    title = extract_first(content, r"<h1[^>]*>(.*?)</h1>") or extract_first(content, r"<title[^>]*>(.*?)</title>")
    excerpt = extract_first(content, r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']\s*/?>')
    category = extract_first(content, r'<span\s+class=["\']chip["\']>\s*⚖️\s*(.*?)</span>')
    reading_time = extract_first(content, r'<span\s+class=["\']chip["\']>\s*📖\s*(.*?)</span>')

    article_html_match = re.search(r'<article class="article-container"[^>]*>(.*?)</article>', content, flags=re.IGNORECASE | re.DOTALL)
    article_text = strip_tags(article_html_match.group(1) if article_html_match else "")

    keyword_meta = extract_first(content, r'<meta[^>]+name=["\']keywords["\'][^>]+content=["\'](.*?)["\']\s*/?>')
    section_keywords = [strip_tags(item) for item in re.findall(r"<h2[^>]*>(.*?)</h2>", content, flags=re.IGNORECASE | re.DOTALL)]
    keywords = unique_keep_order(split_keywords(keyword_meta) + ([category] if category else []) + section_keywords[:8])

    if not title:
        return None

    return {
        "title": title,
        "excerpt": excerpt,
        "category": category,
        "keywords": keywords,
        "content": article_text,
        "reading_time": reading_time,
        "url": get_relative_url(path, canonical),
    }


def build_index() -> list[dict[str, object]]:
    entries: list[dict[str, object]] = []
    for html_file in list_published_html_files():
        article = extract_article(html_file)
        if article:
            entries.append(article)
    return entries


def main() -> None:
    OUTPUT_FILE.write_text(json.dumps(build_index(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
