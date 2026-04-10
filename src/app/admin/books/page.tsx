import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminBooksPage() {
  const supabase = createServerClient();
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .order('sort_order', { ascending: true });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">Books</h1>
        <Link
          href="/admin/books/new"
          className="bg-[#FF6B35] text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-orange-600 transition-colors"
        >
          + Add Book
        </Link>
      </div>

      {!books || books.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-gray-500 font-semibold">No books yet. Add your first book!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase">Book</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase">Age</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase">Pages</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-bold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm">{book.title_en}</div>
                    <div className="text-xs text-gray-400">{book.title_vi}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{book.age_min}-{book.age_max}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{book.page_count}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                      book.is_published
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {book.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/books/${book.id}`}
                      className="text-sm font-semibold text-[#FF6B35] hover:text-orange-700"
                    >
                      Edit
                    </Link>
                    <span className="mx-2 text-gray-300">|</span>
                    <Link
                      href={`/admin/books/${book.id}/pages`}
                      className="text-sm font-semibold text-[#4ECDC4] hover:text-teal-700"
                    >
                      Pages
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
