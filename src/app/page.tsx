import { BookGrid } from '@/components/library/BookGrid';
import { createServerClient } from '@/lib/supabase/server';
import type { Book } from '@/lib/types';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function LibraryPage() {
  const supabase = createServerClient();
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  return (
    <main>
      <div className="text-center pt-10 pb-5 px-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#2D3436] mb-2" style={{ fontFamily: "'Fredoka One', cursive" }}>
          Choose a Book!
        </h1>
        <p className="text-lg text-gray-500 font-semibold">Chọn một cuốn sách!</p>
      </div>
      <BookGrid books={(books as Book[]) || []} />
    </main>
  );
}
