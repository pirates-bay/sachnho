#!/usr/bin/env python3
"""
Download CC-licensed children's book PDFs, extract page images,
upload to Supabase Storage, and update the database.
"""

import fitz  # PyMuPDF
import urllib.request
import urllib.parse
import json
import os
import sys
import time
import ssl

# ── Config ──────────────────────────────────────────────────────────
SUPABASE_URL = "https://qoljgzpbabesejgtshsc.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbGpnenBiYWJlc2VqZ3RzaHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3OTMwOTYsImV4cCI6MjA5MTM2OTA5Nn0.24ixIwcHtdZrdFQFJKperLh8O5WtmniK8bPbAxei9Jo"
BUCKET = "book-pages"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_DIR = os.path.join(SCRIPT_DIR, "pdfs")
PAGES_DIR = os.path.join(SCRIPT_DIR, "pages")

# SSL context for downloads
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

# ── 20 Books to download ───────────────────────────────────────────
BOOKS = [
    # Ages 2-4 (6 books)
    {
        "title_en": "Too Many Bananas",
        "title_vi": "Quá Nhiều Chuối",
        "slug": "too-many-bananas",
        "age_min": 2, "age_max": 4,
        "url": "https://samplecontents.library.ph/en-storybooks/StoryWeaverEn/TooManyBananas.pdf",
        "source": "Pratham Books / StoryWeaver (CC BY 4.0)"
    },
    {
        "title_en": "The Moon and The Cap",
        "title_vi": "Mặt Trăng và Chiếc Mũ",
        "slug": "the-moon-and-the-cap",
        "age_min": 2, "age_max": 4,
        "url": "https://samplecontents.library.ph/en-storybooks/StoryWeaverEn/MoonandCap.pdf",
        "source": "Pratham Books / StoryWeaver (CC BY 4.0)"
    },
    {
        "title_en": "Busy Ants",
        "title_vi": "Đàn Kiến Bận Rộn",
        "slug": "busy-ants",
        "age_min": 2, "age_max": 4,
        "url": "https://samplecontents.library.ph/en-storybooks/StoryWeaverEn/BusyAnts.pdf",
        "source": "Pratham Books / StoryWeaver (CC BY 4.0)"
    },
    {
        "title_en": "Smile Please!",
        "title_vi": "Hãy Cười Nào!",
        "slug": "smile-please",
        "age_min": 2, "age_max": 4,
        "url": "https://samplecontents.library.ph/en-storybooks/StoryWeaverEn/SmilePlease.pdf",
        "source": "Pratham Books / StoryWeaver (CC BY 4.0)"
    },
    {
        "title_en": "A Beautiful Day",
        "title_vi": "Một Ngày Đẹp Trời",
        "slug": "a-beautiful-day",
        "age_min": 2, "age_max": 4,
        "url": "https://freekidsbooks.org/wp-content/uploads/2019/10/a-beautiful-day_pdf-Bookdash-FKB-stories.pdf",
        "source": "Book Dash (CC BY 4.0)"
    },
    {
        "title_en": "Wiggle Jiggle",
        "title_vi": "Lắc Lư Nhảy Nhót",
        "slug": "wiggle-jiggle",
        "age_min": 2, "age_max": 4,
        "url": "https://freekidsbooks.org/wp-content/uploads/2019/08/wiggle-jiggle_Bookdash_FKB.pdf",
        "source": "Book Dash (CC BY 4.0)"
    },
    # Ages 5-7 (7 books)
    {
        "title_en": "Hippo Wants to Dance",
        "title_vi": "Hà Mã Muốn Nhảy Múa",
        "slug": "hippo-wants-to-dance",
        "age_min": 5, "age_max": 7,
        "url": "https://freekidsbooks.org/wp-content/uploads/2019/08/hippo-wants-to-dance_english_bookdash-FKB.pdf",
        "source": "Book Dash (CC BY 4.0)"
    },
    {
        "title_en": "Catch That Cat!",
        "title_vi": "Bắt Con Mèo Đó!",
        "slug": "catch-that-cat",
        "age_min": 5, "age_max": 7,
        "url": "https://freekidsbooks.org/wp-content/uploads/2022/12/2211-catch-that-cat_en-FKB.pdf",
        "source": "Book Dash (CC BY 4.0)"
    },
    {
        "title_en": "Grandma's Glasses",
        "title_vi": "Kính Của Bà",
        "slug": "grandmas-glasses",
        "age_min": 5, "age_max": 7,
        "url": "https://samplecontents.library.ph/en-storybooks/StoryWeaverEn/GrandmasGlasses.pdf",
        "source": "Pratham Books / StoryWeaver (CC BY 4.0)"
    },
    {
        "title_en": "A Fish and a Gift",
        "title_vi": "Một Con Cá và Món Quà",
        "slug": "a-fish-and-a-gift",
        "age_min": 5, "age_max": 7,
        "url": "https://www.bookspring.org/wp-content/uploads/2021/07/104873-a-fish-and-a-gift.pdf",
        "source": "Book Dash (CC BY 4.0)"
    },
    {
        "title_en": "Who Is Our Friend?",
        "title_vi": "Ai Là Bạn Của Chúng Ta?",
        "slug": "who-is-our-friend",
        "age_min": 5, "age_max": 7,
        "url": "https://freekidsbooks.org/wp-content/uploads/2019/09/who-is-our-friend-Bookdash-FKB.pdf",
        "source": "Book Dash (CC BY 4.0)"
    },
    {
        "title_en": "Sizwe's Smile",
        "title_vi": "Nụ Cười Của Sizwe",
        "slug": "sizwes-smile",
        "age_min": 5, "age_max": 7,
        "url": "https://freekidsbooks.org/wp-content/uploads/2019/12/sizwes_smile-Bookdash-FKB.pdf",
        "source": "Book Dash (CC BY 4.0)"
    },
    {
        "title_en": "Lara the Yellow Ladybird",
        "title_vi": "Lara Bọ Rùa Vàng",
        "slug": "lara-the-yellow-ladybird",
        "age_min": 5, "age_max": 7,
        "url": "https://www.bookspring.org/wp-content/uploads/2021/04/BOOKDASH_-lara-the-yellow-ladybird_english_e-book_20180930.pdf",
        "source": "Book Dash (CC BY 4.0)"
    },
    # Ages 8-10 (7 books)
    {
        "title_en": "Brave Bora",
        "title_vi": "Bora Dũng Cảm",
        "slug": "brave-bora",
        "age_min": 8, "age_max": 10,
        "url": "https://freekidsbooks.org/wp-content/uploads/2022/03/brave-bora_BookDash-FKB.pdf",
        "source": "Book Dash (CC BY 4.0)"
    },
    {
        "title_en": "The Memory Tree",
        "title_vi": "Cây Ký Ức",
        "slug": "the-memory-tree",
        "age_min": 8, "age_max": 10,
        "url": "https://freekidsbooks.org/wp-content/uploads/2023/09/2309-the-memory-tree-BookDash-FKB.pdf",
        "source": "Book Dash (CC BY 4.0)"
    },
    {
        "title_en": "Mama Antelope's House",
        "title_vi": "Nhà Của Mẹ Linh Dương",
        "slug": "mama-antelopes-house",
        "age_min": 8, "age_max": 10,
        "url": "https://freekidsbooks.org/wp-content/uploads/2020/05/mama-antelopes-house_en_BookDash-FKB.pdf",
        "source": "Book Dash (CC BY 4.0)"
    },
    {
        "title_en": "The Boy and the Drum",
        "title_vi": "Cậu Bé và Cái Trống",
        "slug": "the-boy-and-the-drum",
        "age_min": 8, "age_max": 10,
        "url": "https://samplecontents.library.ph/en-storybooks/StoryWeaverEn/BoyandDrum.pdf",
        "source": "Pratham Books / StoryWeaver (CC BY 4.0)"
    },
    {
        "title_en": "The Elephant Bird",
        "title_vi": "Chim Voi",
        "slug": "the-elephant-bird",
        "age_min": 8, "age_max": 10,
        "url": "https://samplecontents.library.ph/en-storybooks/StoryWeaverEn/ElephantBird.pdf",
        "source": "Pratham Books / StoryWeaver (CC BY 4.0)"
    },
    {
        "title_en": "Lions Are Always Brave",
        "title_vi": "Sư Tử Luôn Dũng Cảm",
        "slug": "lions-are-always-brave",
        "age_min": 8, "age_max": 10,
        "url": "https://freekidsbooks.org/wp-content/uploads/2019/06/lions-are-always-brave_Bookdash_CC-BY-SA_FKB.pdf",
        "source": "Book Dash (CC BY 4.0)"
    },
    {
        "title_en": "The Generous Crow",
        "title_vi": "Chú Quạ Hào Phóng",
        "slug": "the-generous-crow",
        "age_min": 8, "age_max": 10,
        "url": "https://samplecontents.library.ph/en-storybooks/StoryWeaverEn/GenerousCrow.pdf",
        "source": "Pratham Books / StoryWeaver (CC BY 4.0)"
    },
]


def supabase_request(method, path, data=None, content_type="application/json", binary=None):
    """Make a request to Supabase REST API or Storage API."""
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
        if method == "GET":
            body = None
        else:
            body = json.dumps(data).encode("utf-8")
    else:
        body = None

    # For POST with Prefer header (return representation)
    if method == "POST" and content_type == "application/json":
        headers["Prefer"] = "return=representation"

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, context=ssl_ctx) as resp:
            raw = resp.read().decode("utf-8")
            if not raw.strip():
                return []
            return json.loads(raw)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"  HTTP {e.code}: {err_body[:300]}")
        return None


def download_pdf(url, dest_path):
    """Download a PDF file."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, context=ssl_ctx, timeout=30) as resp:
            with open(dest_path, "wb") as f:
                f.write(resp.read())
        return True
    except Exception as e:
        print(f"  Download failed: {e}")
        return False


def extract_pages(pdf_path, output_dir, book_slug, max_width=1200):
    """Extract each page as a JPEG image from a PDF."""
    doc = fitz.open(pdf_path)
    page_images = []

    for i, page in enumerate(doc):
        # Render at ~150 DPI for good quality
        zoom = 2.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)

        # Resize if too wide
        if pix.width > max_width:
            scale = max_width / pix.width
            mat2 = fitz.Matrix(zoom * scale, zoom * scale)
            pix = page.get_pixmap(matrix=mat2)

        img_filename = f"{book_slug}-page-{i+1}.jpg"
        img_path = os.path.join(output_dir, img_filename)

        # Save as JPEG
        pix.save(img_path, output="jpeg")
        page_images.append({
            "page_number": i + 1,
            "local_path": img_path,
            "filename": img_filename,
        })

    doc.close()
    return page_images


def upload_image(book_slug, filename, local_path):
    """Upload an image to Supabase Storage and return the public URL."""
    storage_path = f"{book_slug}/{filename}"

    with open(local_path, "rb") as f:
        image_data = f.read()

    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{storage_path}"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
    }

    req = urllib.request.Request(url, data=image_data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, context=ssl_ctx) as resp:
            resp.read()
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{storage_path}"
        return public_url
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        print(f"  Upload failed for {filename}: {e.code} {err[:200]}")
        return None


def process_book(book, sort_order):
    """Full pipeline for one book: download, extract, upload, insert DB records."""
    slug = book["slug"]
    print(f"\n{'='*60}")
    print(f"[{sort_order}/20] {book['title_en']}")
    print(f"{'='*60}")

    # 1. Download PDF
    pdf_path = os.path.join(PDF_DIR, f"{slug}.pdf")
    if os.path.exists(pdf_path):
        print(f"  PDF already downloaded: {pdf_path}")
    else:
        print(f"  Downloading PDF...")
        if not download_pdf(book["url"], pdf_path):
            print(f"  SKIPPING {slug} - download failed")
            return False
        print(f"  Downloaded: {os.path.getsize(pdf_path) / 1024:.0f} KB")

    # 2. Extract page images
    book_pages_dir = os.path.join(PAGES_DIR, slug)
    os.makedirs(book_pages_dir, exist_ok=True)

    print(f"  Extracting pages...")
    try:
        page_images = extract_pages(pdf_path, book_pages_dir, slug)
    except Exception as e:
        print(f"  SKIPPING {slug} - extraction failed: {e}")
        return False
    print(f"  Extracted {len(page_images)} pages")

    # 3. Upload images to Supabase Storage
    print(f"  Uploading images to Supabase Storage...")
    for pi in page_images:
        public_url = upload_image(slug, pi["filename"], pi["local_path"])
        if public_url:
            pi["public_url"] = public_url
        else:
            pi["public_url"] = ""

    uploaded_count = sum(1 for pi in page_images if pi["public_url"])
    print(f"  Uploaded {uploaded_count}/{len(page_images)} images")

    # 4. Use first page as cover image
    cover_url = page_images[0]["public_url"] if page_images else None

    # 5. Insert book record via REST API
    print(f"  Creating book record...")
    book_data = {
        "title_en": book["title_en"],
        "title_vi": book["title_vi"],
        "slug": slug,
        "age_min": book["age_min"],
        "age_max": book["age_max"],
        "is_published": True,
        "sort_order": sort_order,
        "cover_image_url": cover_url,
    }

    result = supabase_request("POST", "/rest/v1/books", book_data)
    if not result:
        print(f"  Failed to create book record!")
        return False

    book_id = result[0]["id"]
    print(f"  Book ID: {book_id}")

    # 6. Insert page records
    print(f"  Creating {len(page_images)} page records...")
    for pi in page_images:
        page_data = {
            "book_id": book_id,
            "page_number": pi["page_number"],
            "image_url": pi["public_url"],
            "english_text": "",
            "vietnamese_text": "",
        }
        supabase_request("POST", "/rest/v1/pages", page_data)

    print(f"  DONE: {book['title_en']} ({len(page_images)} pages)")
    return True


def main():
    os.makedirs(PDF_DIR, exist_ok=True)
    os.makedirs(PAGES_DIR, exist_ok=True)

    # First, delete old books (the original 20 with placeholder text)
    print("Cleaning up old placeholder books...")

    # Get existing books
    existing = supabase_request("GET", "/rest/v1/books?select=id,slug&order=sort_order")
    if existing:
        # Collect slugs of new books we're about to insert
        new_slugs = {b["slug"] for b in BOOKS}
        for old_book in existing:
            old_id = old_book["id"]
            old_slug = old_book["slug"]
            # Delete pages first (foreign key constraint)
            print(f"  Deleting pages for: {old_slug}")
            supabase_request("DELETE", f"/rest/v1/pages?book_id=eq.{old_id}")
            # Delete book
            print(f"  Deleting book: {old_slug}")
            supabase_request("DELETE", f"/rest/v1/books?id=eq.{old_id}")

    print(f"\nProcessing {len(BOOKS)} books...\n")

    success = 0
    failed = 0

    for i, book in enumerate(BOOKS):
        ok = process_book(book, i + 1)
        if ok:
            success += 1
        else:
            failed += 1
        # Small delay between books to avoid rate limiting
        time.sleep(0.5)

    print(f"\n{'='*60}")
    print(f"COMPLETE: {success} books processed, {failed} failed")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
