'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import type { Book } from '@/lib/types';

export default function EditBookPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;
  const [book, setBook] = useState<Book | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    title_en: '',
    title_vi: '',
    slug: '',
    age_min: 2,
    age_max: 4,
    is_published: false,
    cover_image_url: null as string | null,
  });

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('books').select('*').eq('id', bookId).single();
      if (data) {
        setBook(data);
        setForm({
          title_en: data.title_en,
          title_vi: data.title_vi,
          slug: data.slug,
          age_min: data.age_min,
          age_max: data.age_max,
          is_published: data.is_published,
          cover_image_url: data.cover_image_url,
        });
        setCoverPreview(data.cover_image_url);
      }
    }
    load();
  }, [bookId]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);

    const resized = await resizeImage(file, 800);
    const filePath = `${bookId}/cover-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('book-pages')
      .upload(filePath, resized, { contentType: 'image/jpeg' });

    if (uploadError) {
      alert('Cover upload failed: ' + uploadError.message);
      setUploadingCover(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('book-pages')
      .getPublicUrl(filePath);

    await supabase.from('books').update({ cover_image_url: publicUrl }).eq('id', bookId);
    setForm(f => ({ ...f, cover_image_url: publicUrl }));
    setCoverPreview(publicUrl);
    setUploadingCover(false);
  };

  const removeCover = async () => {
    await supabase.from('books').update({ cover_image_url: null }).eq('id', bookId);
    setForm(f => ({ ...f, cover_image_url: null }));
    setCoverPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { cover_image_url: _cover, ...updateData } = form;
    const { error } = await supabase
      .from('books')
      .update(updateData)
      .eq('id', bookId);

    if (error) {
      alert('Error updating book: ' + error.message);
    } else {
      router.push('/admin/books');
    }
    setSaving(false);
  };

  const togglePublish = async () => {
    const newStatus = !form.is_published;
    setForm({ ...form, is_published: newStatus });
    await supabase.from('books').update({ is_published: newStatus }).eq('id', bookId);
  };

  if (!book) {
    return <div className="text-center py-16 text-gray-400 font-semibold">Loading...</div>;
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">Edit Book</h1>
        <Link
          href={`/admin/books/${bookId}/pages`}
          className="bg-[#4ECDC4] text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-teal-600 transition-colors"
        >
          Manage Pages
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-5">
        {/* Cover Image */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Cover Image</label>
          <div className="flex items-start gap-4">
            <div className="w-32 shrink-0">
              {coverPreview ? (
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                  <Image src={coverPreview} alt="Cover" fill className="object-cover" sizes="128px" />
                </div>
              ) : (
                <div className="aspect-[3/4] rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-3xl">
                  📖
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <label className="inline-flex items-center gap-2 bg-[#FF6B35] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-600 cursor-pointer transition-colors">
                {uploadingCover ? 'Uploading...' : '📷 Upload Cover'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  className="hidden"
                />
              </label>
              {coverPreview && (
                <button
                  type="button"
                  onClick={removeCover}
                  className="text-xs text-red-400 hover:text-red-600 font-semibold text-left"
                >
                  Remove cover
                </button>
              )}
              <p className="text-xs text-gray-400">Recommended: 3:4 ratio (e.g. 600x800px)</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">English Title</label>
          <input
            type="text"
            required
            value={form.title_en}
            onChange={(e) => setForm({ ...form, title_en: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Vietnamese Title</label>
          <input
            type="text"
            required
            value={form.title_vi}
            onChange={(e) => setForm({ ...form, title_vi: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">URL Slug</label>
          <input
            type="text"
            required
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Min Age</label>
            <select
              value={form.age_min}
              onChange={(e) => setForm({ ...form, age_min: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
            >
              {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Max Age</label>
            <select
              value={form.age_max}
              onChange={(e) => setForm({ ...form, age_max: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
            >
              {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* Publish Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-bold text-sm">Published</div>
            <div className="text-xs text-gray-400">Make this book visible to readers</div>
          </div>
          <button
            type="button"
            onClick={togglePublish}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              form.is_published ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
              form.is_published ? 'translate-x-5.5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#FF6B35] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

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
