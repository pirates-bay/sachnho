'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function NewBookPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title_en: '',
    title_vi: '',
    slug: '',
    age_min: 2,
    age_max: 4,
  });

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data, error } = await supabase
      .from('books')
      .insert({
        title_en: form.title_en,
        title_vi: form.title_vi,
        slug: form.slug || generateSlug(form.title_en),
        age_min: form.age_min,
        age_max: form.age_max,
        sort_order: 0,
      })
      .select()
      .single();

    if (error) {
      alert('Error creating book: ' + error.message);
      setSaving(false);
      return;
    }

    router.push(`/admin/books/${data.id}/pages`);
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-extrabold mb-6">Add New Book</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">English Title</label>
          <input
            type="text"
            required
            value={form.title_en}
            onChange={(e) => {
              setForm({ ...form, title_en: e.target.value, slug: generateSlug(e.target.value) });
            }}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none"
            placeholder="e.g. The Red Cat"
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
            placeholder="e.g. Con Mèo Đỏ"
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
            placeholder="the-red-cat"
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

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#FF6B35] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Book'}
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
