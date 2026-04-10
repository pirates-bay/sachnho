import { BookGrid } from '@/components/library/BookGrid';
import type { Book } from '@/lib/types';

// Mock data until Supabase is connected
const MOCK_BOOKS: Book[] = [
  {
    id: '1', title_en: 'The Red Cat', title_vi: 'Con Mèo Đỏ', slug: 'the-red-cat',
    cover_image_url: null, age_min: 2, age_max: 4, page_count: 4,
    is_published: true, sort_order: 1, created_at: new Date().toISOString(),
  },
  {
    id: '2', title_en: 'My Family', title_vi: 'Gia Đình Tôi', slug: 'my-family',
    cover_image_url: null, age_min: 2, age_max: 4, page_count: 4,
    is_published: true, sort_order: 2, created_at: new Date().toISOString(),
  },
  {
    id: '3', title_en: 'Colors Everywhere', title_vi: 'Màu Sắc Khắp Nơi', slug: 'colors-everywhere',
    cover_image_url: null, age_min: 2, age_max: 4, page_count: 4,
    is_published: true, sort_order: 3, created_at: new Date().toISOString(),
  },
  {
    id: '4', title_en: 'At the Zoo', title_vi: 'Ở Sở Thú', slug: 'at-the-zoo',
    cover_image_url: null, age_min: 5, age_max: 7, page_count: 5,
    is_published: true, sort_order: 4, created_at: new Date().toISOString(),
  },
  {
    id: '5', title_en: 'Counting to Ten', title_vi: 'Đếm Đến Mười', slug: 'counting-to-ten',
    cover_image_url: null, age_min: 5, age_max: 7, page_count: 4,
    is_published: true, sort_order: 5, created_at: new Date().toISOString(),
  },
  {
    id: '6', title_en: 'The Water Cycle', title_vi: 'Chu Trình Nước', slug: 'the-water-cycle',
    cover_image_url: null, age_min: 8, age_max: 10, page_count: 4,
    is_published: true, sort_order: 6, created_at: new Date().toISOString(),
  },
];

export default function LibraryPage() {
  return (
    <main>
      <div className="text-center pt-10 pb-5 px-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#2D3436] mb-2" style={{ fontFamily: "'Fredoka One', cursive" }}>
          Choose a Book!
        </h1>
        <p className="text-lg text-gray-500 font-semibold">Chọn một cuốn sách!</p>
      </div>
      <BookGrid books={MOCK_BOOKS} />
    </main>
  );
}
