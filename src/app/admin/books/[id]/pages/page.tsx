'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import type { Book, Page } from '@/lib/types';

export default function ManagePagesPage() {
  const params = useParams();
  const bookId = params.id as string;
  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [uploading, setUploading] = useState(false);
  const [savingPageId, setSavingPageId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [bookRes, pagesRes] = await Promise.all([
      supabase.from('books').select('*').eq('id', bookId).single(),
      supabase.from('pages').select('*').eq('book_id', bookId).order('page_number', { ascending: true }),
    ]);
    if (bookRes.data) setBook(bookRes.data);
    if (pagesRes.data) setPages(pagesRes.data);
  }, [bookId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleImageUpload = async (pageId: string, pageNumber: number, file: File) => {
    setUploading(true);

    // Resize image client-side
    const resized = await resizeImage(file, 1200);
    const filePath = `${bookId}/page-${pageNumber}-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('book-pages')
      .upload(filePath, resized, { contentType: 'image/jpeg' });

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('book-pages')
      .getPublicUrl(filePath);

    await supabase.from('pages').update({ image_url: publicUrl }).eq('id', pageId);
    await loadData();
    setUploading(false);
  };

  const handleTextSave = async (pageId: string, englishText: string, vietnameseText: string) => {
    setSavingPageId(pageId);
    await supabase.from('pages').update({
      english_text: englishText,
      vietnamese_text: vietnameseText,
    }).eq('id', pageId);
    setSavingPageId(null);
  };

  const addNewPage = async () => {
    const nextNumber = pages.length > 0 ? Math.max(...pages.map(p => p.page_number)) + 1 : 1;
    await supabase.from('pages').insert({
      book_id: bookId,
      page_number: nextNumber,
      english_text: '',
      vietnamese_text: '',
      image_url: '',
    });
    await loadData();
  };

  const deletePage = async (pageId: string) => {
    if (!confirm('Delete this page?')) return;
    await supabase.from('pages').delete().eq('id', pageId);
    await loadData();
  };

  if (!book) {
    return <div className="text-center py-16 text-gray-400 font-semibold">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/admin/books/${bookId}`} className="text-sm text-gray-400 hover:text-gray-600 font-semibold">
            ← Back to Book
          </Link>
          <h1 className="text-2xl font-extrabold">{book.title_en} — Pages</h1>
        </div>
        <button
          onClick={addNewPage}
          className="bg-[#FF6B35] text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-orange-600 transition-colors"
        >
          + Add Page
        </button>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl">
          <div className="text-5xl mb-4">📄</div>
          <p className="text-gray-500 font-semibold">No pages yet. Add your first page!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pages.map((page) => (
            <PageEditor
              key={page.id}
              page={page}
              uploading={uploading}
              saving={savingPageId === page.id}
              onImageUpload={(file) => handleImageUpload(page.id, page.page_number, file)}
              onTextSave={(en, vi) => handleTextSave(page.id, en, vi)}
              onDelete={() => deletePage(page.id)}
            />
          ))}
        </div>
      )}

      {/* Bulk Upload Section */}
      <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-bold text-lg mb-3">Bulk Upload Pages</h2>
        <p className="text-sm text-gray-500 mb-4">
          Drop multiple scanned images here. They will be added as new pages in order.
        </p>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;
            setUploading(true);

            let nextNumber = pages.length > 0 ? Math.max(...pages.map(p => p.page_number)) + 1 : 1;

            for (const file of files) {
              const resized = await resizeImage(file, 1200);
              const filePath = `${bookId}/page-${nextNumber}-${Date.now()}.jpg`;

              const { error: uploadError } = await supabase.storage
                .from('book-pages')
                .upload(filePath, resized, { contentType: 'image/jpeg' });

              if (uploadError) {
                alert(`Failed to upload ${file.name}: ${uploadError.message}`);
                continue;
              }

              const { data: { publicUrl } } = supabase.storage
                .from('book-pages')
                .getPublicUrl(filePath);

              await supabase.from('pages').insert({
                book_id: bookId,
                page_number: nextNumber,
                image_url: publicUrl,
                english_text: '',
                vietnamese_text: '',
              });

              nextNumber++;
            }

            await loadData();
            setUploading(false);
          }}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#4ECDC4] file:text-white hover:file:bg-teal-600 file:cursor-pointer file:transition-colors"
        />
        {uploading && <p className="text-sm text-[#FF6B35] font-semibold mt-2">Uploading...</p>}
      </div>
    </div>
  );
}

// Page Editor Component
function PageEditor({
  page,
  uploading,
  saving,
  onImageUpload,
  onTextSave,
  onDelete,
}: {
  page: Page;
  uploading: boolean;
  saving: boolean;
  onImageUpload: (file: File) => void;
  onTextSave: (en: string, vi: string) => void;
  onDelete: () => void;
}) {
  const [en, setEn] = useState(page.english_text);
  const [vi, setVi] = useState(page.vietnamese_text);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Page {page.page_number}</h3>
        <button onClick={onDelete} className="text-red-400 hover:text-red-600 text-sm font-semibold">
          Delete
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image Section */}
        <div>
          {page.image_url ? (
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 mb-3">
              <Image src={page.image_url} alt={`Page ${page.page_number}`} fill className="object-contain" sizes="400px" />
            </div>
          ) : (
            <div className="aspect-[4/3] rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-semibold mb-3">
              No image
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImageUpload(file);
            }}
            className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 file:cursor-pointer"
          />
        </div>

        {/* Text Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">English Text</label>
            <textarea
              value={en}
              onChange={(e) => setEn(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none text-sm"
              placeholder="Enter English text for this page..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Vietnamese Text</label>
            <textarea
              value={vi}
              onChange={(e) => setVi(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent outline-none text-sm"
              placeholder="Nhập văn bản tiếng Việt cho trang này..."
            />
          </div>
          <button
            onClick={() => onTextSave(en, vi)}
            disabled={saving}
            className="bg-[#4ECDC4] text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-teal-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Text'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper: resize image client-side
function resizeImage(file: File, maxWidth: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
