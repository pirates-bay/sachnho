import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = createServerClient();

  const { count: bookCount } = await supabase.from('books').select('*', { count: 'exact', head: true });
  const { count: publishedCount } = await supabase.from('books').select('*', { count: 'exact', head: true }).eq('is_published', true);
  const { count: pageCount } = await supabase.from('pages').select('*', { count: 'exact', head: true });

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-extrabold text-[#FF6B35]">{bookCount ?? 0}</div>
          <div className="text-sm text-gray-500 font-semibold mt-1">Total Books</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-extrabold text-[#4ECDC4]">{publishedCount ?? 0}</div>
          <div className="text-sm text-gray-500 font-semibold mt-1">Published</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-extrabold text-[#A78BFA]">{pageCount ?? 0}</div>
          <div className="text-sm text-gray-500 font-semibold mt-1">Total Pages</div>
        </div>
      </div>

      <Link
        href="/admin/books/new"
        className="inline-flex items-center gap-2 bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors"
      >
        + Add New Book
      </Link>
    </div>
  );
}
