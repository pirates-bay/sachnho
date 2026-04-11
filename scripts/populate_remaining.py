#!/usr/bin/env python3
"""Process remaining books (17-20) that didn't complete in the first run."""

import fitz
import urllib.request
import json
import os
import time
import ssl

SUPABASE_URL = "https://qoljgzpbabesejgtshsc.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbGpnenBiYWJlc2VqZ3RzaHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3OTMwOTYsImV4cCI6MjA5MTM2OTA5Nn0.24ixIwcHtdZrdFQFJKperLh8O5WtmniK8bPbAxei9Jo"
BUCKET = "book-pages"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_DIR = os.path.join(SCRIPT_DIR, "pdfs")
PAGES_DIR = os.path.join(SCRIPT_DIR, "pages")

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

REMAINING_BOOKS = [
    {
        "title_en": "The Boy and the Drum",
        "title_vi": "Cậu Bé và Cái Trống",
        "slug": "the-boy-and-the-drum",
        "age_min": 8, "age_max": 10,
        "url": "https://samplecontents.library.ph/en-storybooks/StoryWeaverEn/BoyandDrum.pdf",
        "sort_order": 17,
    },
    {
        "title_en": "The Elephant Bird",
        "title_vi": "Chim Voi",
        "slug": "the-elephant-bird",
        "age_min": 8, "age_max": 10,
        "url": "https://samplecontents.library.ph/en-storybooks/StoryWeaverEn/ElephantBird.pdf",
        "sort_order": 18,
    },
    {
        "title_en": "Lions Are Always Brave",
        "title_vi": "Sư Tử Luôn Dũng Cảm",
        "slug": "lions-are-always-brave",
        "age_min": 8, "age_max": 10,
        "url": "https://freekidsbooks.org/wp-content/uploads/2019/06/lions-are-always-brave_Bookdash_CC-BY-SA_FKB.pdf",
        "sort_order": 19,
    },
    {
        "title_en": "The Generous Crow",
        "title_vi": "Chú Quạ Hào Phóng",
        "slug": "the-generous-crow",
        "age_min": 8, "age_max": 10,
        "url": "https://samplecontents.library.ph/en-storybooks/StoryWeaverEn/GenerousCrow.pdf",
        "sort_order": 20,
    },
]


def supabase_req(method, path, data=None, binary=None, content_type="application/json"):
    url = f"{SUPABASE_URL}{path}"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    }
    if binary is not None:
        headers["Content-Type"] = content_type
        body = binary
    elif data is not None:
        headers["Content-Type"] = "application/json"
        headers["Prefer"] = "return=representation"
        body = json.dumps(data).encode("utf-8") if method != "GET" else None
    else:
        body = None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, context=ssl_ctx, timeout=60) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw.strip() else []
    except Exception as e:
        print(f"    Request error: {e}")
        return None


def upload_with_retry(slug, filename, local_path, retries=3):
    storage_path = f"{slug}/{filename}"
    with open(local_path, "rb") as f:
        image_data = f.read()

    for attempt in range(retries):
        url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{storage_path}"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "image/jpeg",
            "x-upsert": "true",
        }
        req = urllib.request.Request(url, data=image_data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=30) as resp:
                resp.read()
            return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{storage_path}"
        except Exception as e:
            print(f"    Upload attempt {attempt+1} failed: {e}")
            if attempt < retries - 1:
                time.sleep(2)
    return None


def process_book(book):
    slug = book["slug"]
    print(f"\n{'='*60}")
    print(f"[{book['sort_order']}/20] {book['title_en']}")
    print(f"{'='*60}")

    # First clean up any partial data from previous attempt
    existing = supabase_req("GET", f"/rest/v1/books?slug=eq.{slug}&select=id")
    if existing:
        for old in existing:
            print(f"  Cleaning up partial: {old['id']}")
            supabase_req("DELETE", f"/rest/v1/pages?book_id=eq.{old['id']}")
            supabase_req("DELETE", f"/rest/v1/books?id=eq.{old['id']}")

    # Download PDF
    pdf_path = os.path.join(PDF_DIR, f"{slug}.pdf")
    if not os.path.exists(pdf_path):
        print(f"  Downloading PDF...")
        try:
            req = urllib.request.Request(book["url"], headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=30) as resp:
                with open(pdf_path, "wb") as f:
                    f.write(resp.read())
            print(f"  Downloaded: {os.path.getsize(pdf_path) / 1024:.0f} KB")
        except Exception as e:
            print(f"  SKIP: download failed: {e}")
            return False
    else:
        print(f"  PDF already downloaded")

    # Extract pages
    book_pages_dir = os.path.join(PAGES_DIR, slug)
    os.makedirs(book_pages_dir, exist_ok=True)

    print(f"  Extracting pages...")
    doc = fitz.open(pdf_path)
    page_images = []
    for i, page in enumerate(doc):
        zoom = 2.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        if pix.width > 1200:
            scale = 1200 / pix.width
            pix = page.get_pixmap(matrix=fitz.Matrix(zoom * scale, zoom * scale))
        fn = f"{slug}-page-{i+1}.jpg"
        fp = os.path.join(book_pages_dir, fn)
        pix.save(fp, output="jpeg")
        page_images.append({"page_number": i + 1, "local_path": fp, "filename": fn})
    doc.close()
    print(f"  Extracted {len(page_images)} pages")

    # Upload images with retry
    print(f"  Uploading images...")
    for pi in page_images:
        url = upload_with_retry(slug, pi["filename"], pi["local_path"])
        pi["public_url"] = url or ""
        time.sleep(0.2)  # Small delay between uploads

    uploaded = sum(1 for p in page_images if p["public_url"])
    print(f"  Uploaded {uploaded}/{len(page_images)} images")

    # Create book record
    cover_url = page_images[0]["public_url"] if page_images else None
    result = supabase_req("POST", "/rest/v1/books", {
        "title_en": book["title_en"],
        "title_vi": book["title_vi"],
        "slug": slug,
        "age_min": book["age_min"],
        "age_max": book["age_max"],
        "is_published": True,
        "sort_order": book["sort_order"],
        "cover_image_url": cover_url,
    })
    if not result:
        print(f"  FAILED to create book record!")
        return False

    book_id = result[0]["id"]
    print(f"  Book ID: {book_id}")

    # Insert pages
    for pi in page_images:
        supabase_req("POST", "/rest/v1/pages", {
            "book_id": book_id,
            "page_number": pi["page_number"],
            "image_url": pi["public_url"],
            "english_text": "",
            "vietnamese_text": "",
        })

    print(f"  DONE: {book['title_en']} ({len(page_images)} pages)")
    return True


if __name__ == "__main__":
    os.makedirs(PDF_DIR, exist_ok=True)
    os.makedirs(PAGES_DIR, exist_ok=True)

    success = 0
    for book in REMAINING_BOOKS:
        if process_book(book):
            success += 1
        time.sleep(1)

    print(f"\nCompleted: {success}/{len(REMAINING_BOOKS)} books")
