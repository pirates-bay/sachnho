'use client';

import { useState, useMemo } from 'react';
import { AgeFilter } from './AgeFilter';
import { BookCard } from './BookCard';
import type { Book } from '@/lib/types';

interface BookGridProps {
  books: Book[];
}

export function BookGrid({ books }: BookGridProps) {
  const [ageRange, setAgeRange] = useState({ min: 0, max: 99 });

  const filtered = useMemo(() => {
    if (ageRange.min === 0 && ageRange.max === 99) return books;
    return books.filter(b => b.age_min >= ageRange.min && b.age_max <= ageRange.max);
  }, [books, ageRange]);

  return (
    <>
      <AgeFilter onFilter={(min, max) => setAgeRange({ min, max })} />
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-500 font-bold text-lg">No books yet for this age group!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-6 pb-16 max-w-[1200px] mx-auto">
          {filtered.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </>
  );
}
