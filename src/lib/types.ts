export interface Book {
  id: string;
  title_en: string;
  title_vi: string;
  slug: string;
  cover_image_url: string | null;
  age_min: number;
  age_max: number;
  page_count: number;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export interface Page {
  id: string;
  book_id: string;
  page_number: number;
  image_url: string;
  english_text: string;
  vietnamese_text: string;
  audio_en_url: string | null;
  audio_vi_url: string | null;
}

export interface Category {
  id: string;
  name_en: string;
  name_vi: string;
  emoji: string;
  sort_order: number;
}
