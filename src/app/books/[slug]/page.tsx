import { BookReader } from '@/components/reader/BookReader';
import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Page } from '@/lib/types';

export const revalidate = 60;

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;
  const supabase = createServerClient();

  // Fetch book by slug
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!book) notFound();

  // Fetch pages for this book
  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .eq('book_id', book.id)
    .order('page_number', { ascending: true });

  if (!pages || pages.length === 0) notFound();

  return <BookReader bookTitle={book.title_en} pages={pages as Page[]} />;
}
