import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-extrabold text-lg text-[#FF6B35]" style={{ fontFamily: "'Fredoka One', cursive" }}>
            SachNho Admin
          </Link>
          <nav className="flex gap-4">
            <Link href="/admin" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Dashboard
            </Link>
            <Link href="/admin/books" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Books
            </Link>
          </nav>
        </div>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Site
        </Link>
      </div>
      <main className="p-6 max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
}
