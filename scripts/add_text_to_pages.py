#!/usr/bin/env python3
"""
Extract English text from book PDFs, translate to Vietnamese,
and update all page records in Supabase.
"""

import fitz  # PyMuPDF
import json
import os
import re
import ssl
import time
import urllib.request
from deep_translator import GoogleTranslator

# ── Config ──────────────────────────────────────────────────────────
SUPABASE_URL = "https://qoljgzpbabesejgtshsc.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbGpnenBiYWJlc2VqZ3RzaHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3OTMwOTYsImV4cCI6MjA5MTM2OTA5Nn0.24ixIwcHtdZrdFQFJKperLh8O5WtmniK8bPbAxei9Jo"
PDF_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pdfs")

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

translator = GoogleTranslator(source='en', target='vi')


def supabase_get(path):
    """GET request to Supabase REST API."""
    url = f"{SUPABASE_URL}{path}"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, context=ssl_ctx) as resp:
        return json.loads(resp.read().decode("utf-8"))


def supabase_patch(path, data):
    """PATCH request to Supabase REST API."""
    url = f"{SUPABASE_URL}{path}"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=headers, method="PATCH")
    try:
        with urllib.request.urlopen(req, context=ssl_ctx) as resp:
            resp.read()
        return True
    except urllib.error.HTTPError as e:
        print(f"    PATCH error: {e.code} {e.read().decode()[:200]}")
        return False


def clean_page_text(text, page_num, total_pages):
    """Clean extracted text: remove page numbers, metadata, etc."""
    if not text:
        return ""

    text = text.strip()

    # Skip known non-story pages
    skip_patterns = [
        r"^This book was made possible by",
        r"^This is a Level \d",
        r"^Content under Creative Commons",
        r"^Pratham Books",
        r"^StoryWeaver",
        r"^www\.storyweaver",
        r"^www\.prathambooks",
        r"^Disclaimer:",
        r"^Some rights reserved",
        r"^Reading Level",
        r"^Pratham Books goes digital",
        r"^Brought to you by",
        r"^Read more on StoryWeaver",
        r"^Credits",
        r"^Written by",
        r"^Illustrated by",
        r"^Translator",
        r"^LET US LEARN SOME NEW WORDS",
        r"^DID YOU KNOW",
        r"^Facts About",
        r"This book belongs to",
    ]

    for pattern in skip_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return ""

    # Remove trailing page numbers (standalone number at end)
    text = re.sub(r'\s+\d{1,2}\s*$', '', text)

    # Remove leading page numbers
    text = re.sub(r'^\d{1,2}\s+', '', text)

    # Clean up excessive whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    # Skip if text is too short (likely just metadata or page number)
    if len(text) < 5:
        return ""

    # Skip title pages that just repeat the title/author
    lower = text.lower()
    if any(kw in lower for kw in ["author:", "illustrator:", "translator:", "editor:", "designer:"]):
        if len(text) < 200:  # Short text with metadata markers = title page
            return ""

    return text


def translate_text(text, retries=3):
    """Translate English text to Vietnamese with retry logic."""
    if not text:
        return ""

    for attempt in range(retries):
        try:
            # Google Translate has a ~5000 char limit per request
            if len(text) > 4500:
                # Split into sentences and translate in chunks
                sentences = re.split(r'(?<=[.!?])\s+', text)
                chunks = []
                current = ""
                for s in sentences:
                    if len(current) + len(s) > 4000:
                        chunks.append(current)
                        current = s
                    else:
                        current = f"{current} {s}".strip()
                if current:
                    chunks.append(current)

                translated_parts = []
                for chunk in chunks:
                    translated_parts.append(translator.translate(chunk))
                    time.sleep(0.3)
                return " ".join(translated_parts)
            else:
                return translator.translate(text)
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1 + attempt)
            else:
                print(f"    Translation failed: {e}")
                return ""


def extract_all_page_texts(pdf_path):
    """Extract text from every page of a PDF."""
    doc = fitz.open(pdf_path)
    total = doc.page_count
    texts = []
    for i, page in enumerate(doc):
        raw = page.get_text().strip()
        cleaned = clean_page_text(raw, i + 1, total)
        texts.append(cleaned)
    doc.close()
    return texts


def process_book(book_record):
    """Extract text from PDF, translate, update database for one book."""
    slug = book_record["slug"]
    book_id = book_record["id"]
    title = book_record["title_en"]

    print(f"\n{'='*60}")
    print(f"  {title} (slug: {slug})")
    print(f"{'='*60}")

    # Get pages from database
    pages = supabase_get(f"/rest/v1/pages?book_id=eq.{book_id}&order=page_number&select=id,page_number,english_text")

    if not pages:
        print("  No pages found in DB!")
        return 0

    # Extract text from PDF
    pdf_path = os.path.join(PDF_DIR, f"{slug}.pdf")
    if not os.path.exists(pdf_path):
        print(f"  PDF not found: {pdf_path}")
        return 0

    page_texts = extract_all_page_texts(pdf_path)
    print(f"  Extracted text from {len(page_texts)} PDF pages, {len(pages)} DB pages")

    updated = 0
    for db_page in pages:
        page_num = db_page["page_number"]
        page_id = db_page["id"]
        idx = page_num - 1  # 0-based index into page_texts

        if idx >= len(page_texts):
            continue

        en_text = page_texts[idx]
        if not en_text:
            continue

        # Translate to Vietnamese
        vi_text = translate_text(en_text)
        time.sleep(0.3)  # Rate limit

        # Update database
        ok = supabase_patch(
            f"/rest/v1/pages?id=eq.{page_id}",
            {"english_text": en_text, "vietnamese_text": vi_text}
        )

        if ok:
            updated += 1
            preview_en = en_text[:60] + "..." if len(en_text) > 60 else en_text
            preview_vi = vi_text[:60] + "..." if len(vi_text) > 60 else vi_text
            print(f"  Page {page_num}: EN: {preview_en}")
            print(f"           VI: {preview_vi}")
        else:
            print(f"  Page {page_num}: FAILED to update")

    print(f"  Updated {updated}/{len(pages)} pages with text")
    return updated


def main():
    print("Fetching all books from database...")
    books = supabase_get("/rest/v1/books?select=id,slug,title_en&order=sort_order")

    if not books:
        print("No books found!")
        return

    print(f"Found {len(books)} books\n")

    total_updated = 0
    for book in books:
        count = process_book(book)
        total_updated += count

    print(f"\n{'='*60}")
    print(f"COMPLETE: Updated {total_updated} pages with English + Vietnamese text")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
