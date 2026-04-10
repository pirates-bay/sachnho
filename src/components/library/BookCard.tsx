'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Book } from '@/lib/types';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const ageBadge = book.age_min <= 4
    ? { bg: 'bg-pink-200', text: 'text-pink-800', label: `Age ${book.age_min}-${book.age_max}` }
    : book.age_min <= 7
    ? { bg: 'bg-green-200', text: 'text-green-800', label: `Age ${book.age_min}-${book.age_max}` }
    : { bg: 'bg-purple-200', text: 'text-purple-800', label: `Age ${book.age_min}-${book.age_max}` };

  return (
    <Link href={`/books/${book.slug}`}>
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer"
      >
        <div className="relative aspect-[3/4] bg-gradient-to-br from-orange-100 to-orange-50">
          {book.cover_image_url ? (
            <Image
              src={book.cover_image_url}
              alt={book.title_en}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              📖
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-extrabold text-base text-gray-800">{book.title_en}</h3>
          <p className="text-sm text-gray-500 font-semibold">{book.title_vi}</p>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${ageBadge.bg} ${ageBadge.text}`}>
            {ageBadge.label}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
