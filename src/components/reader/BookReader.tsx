'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useTTS } from '@/hooks/useTTS';
import { useSwipe } from '@/hooks/useSwipe';
import { AudioControls, type ReadMode } from './AudioControls';
import type { Page } from '@/lib/types';

interface BookReaderProps {
  bookTitle: string;
  pages: Page[];
}

export function BookReader({ bookTitle, pages }: BookReaderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [readMode, setReadMode] = useState<ReadMode>('page');
  const [isFullBookPlaying, setIsFullBookPlaying] = useState(false);
  const currentIndexRef = useRef(0);
  const { speakingState, speakEnglish, speakVietnamese, speakBoth, startFullBookReading, stop, stoppedRef } = useTTS();

  const page = pages[currentIndex];
  const total = pages.length;
  const progress = ((currentIndex + 1) / total) * 100;

  const setPage = useCallback((index: number) => {
    setCurrentIndex(index);
    currentIndexRef.current = index;
  }, []);

  const goNext = useCallback(() => {
    stop();
    setIsFullBookPlaying(false);
    if (currentIndexRef.current < total - 1) {
      setPage(currentIndexRef.current + 1);
    } else {
      setShowCelebration(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }, [total, stop, setPage]);

  const goPrev = useCallback(() => {
    stop();
    setIsFullBookPlaying(false);
    if (currentIndexRef.current > 0) setPage(currentIndexRef.current - 1);
  }, [stop, setPage]);

  const stopAll = useCallback(() => {
    stop();
    setIsFullBookPlaying(false);
  }, [stop]);

  // Page-mode handlers
  const handlePageEnglish = useCallback(() => {
    speakEnglish(page.english_text, { audio_en_url: page.audio_en_url, audio_vi_url: page.audio_vi_url });
  }, [speakEnglish, page]);

  const handlePageVietnamese = useCallback(() => {
    speakVietnamese(page.vietnamese_text, { audio_en_url: page.audio_en_url, audio_vi_url: page.audio_vi_url });
  }, [speakVietnamese, page]);

  const handlePageBoth = useCallback(() => {
    speakBoth(page.english_text, page.vietnamese_text, { audio_en_url: page.audio_en_url, audio_vi_url: page.audio_vi_url });
  }, [speakBoth, page]);

  // Full-book handlers
  const handleFullBookRead = useCallback(async (mode: 'english' | 'vietnamese' | 'both') => {
    setIsFullBookPlaying(true);
    try {
      await startFullBookReading(pages, currentIndexRef.current, mode, (index) => {
        setPage(index);
      });
      // Finished all pages
      if (!stoppedRef.current) {
        setShowCelebration(true);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } finally {
      setIsFullBookPlaying(false);
    }
  }, [startFullBookReading, pages, setPage, stoppedRef]);

  const handleEnglish = useCallback(() => {
    if (readMode === 'book') {
      handleFullBookRead('english');
    } else {
      handlePageEnglish();
    }
  }, [readMode, handleFullBookRead, handlePageEnglish]);

  const handleVietnamese = useCallback(() => {
    if (readMode === 'book') {
      handleFullBookRead('vietnamese');
    } else {
      handlePageVietnamese();
    }
  }, [readMode, handleFullBookRead, handlePageVietnamese]);

  const handleBoth = useCallback(() => {
    if (readMode === 'book') {
      handleFullBookRead('both');
    } else {
      handlePageBoth();
    }
  }, [readMode, handleFullBookRead, handlePageBoth]);

  const swipeHandlers = useSwipe({ onSwipeLeft: goNext, onSwipeRight: goPrev });

  if (showCelebration) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-12 text-center max-w-md"
        >
          <div className="text-7xl mb-4">🎉⭐🎉</div>
          <h2 className="font-display text-3xl text-[#FF6B35] mb-2" style={{ fontFamily: "'Fredoka One', cursive" }}>
            Great Job!
          </h2>
          <p className="text-gray-500 font-semibold text-lg mb-6">
            Giỏi lắm! You finished the book!
          </p>
          <Link
            href="/"
            className="inline-block bg-[#4ECDC4] text-white rounded-full px-9 py-4 font-extrabold text-lg hover:scale-105 transition-transform"
          >
            📚 More Books!
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div {...swipeHandlers}>
      {/* Reader Header */}
      <div className="bg-white px-5 py-3 flex items-center justify-between shadow-sm">
        <Link
          href="/"
          onClick={stopAll}
          className="bg-[#FFF8F0] rounded-full px-5 py-3 font-bold flex items-center gap-2 hover:bg-orange-100 transition-colors"
        >
          ← Books
        </Link>
        <h1 className="font-extrabold text-lg text-center flex-1 truncate px-4">{bookTitle}</h1>
        <div className="w-[90px]" />
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-200 h-2">
        <motion.div
          className="h-full bg-gradient-to-r from-[#4ECDC4] to-[#34D399] rounded-r"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Page Content */}
      <div className="max-w-[800px] mx-auto p-4 sm:p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {/* Page Image */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg mb-5 relative">
              <div className="relative aspect-[4/3]">
                {page.image_url ? (
                  <Image
                    src={page.image_url}
                    alt={`Page ${page.page_number}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 800px) 100vw, 800px"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-400 text-xl font-bold">
                    Page {page.page_number}
                  </div>
                )}
              </div>
              <div className="absolute top-4 right-4 bg-black/60 text-white px-3.5 py-1.5 rounded-full text-sm font-bold">
                {currentIndex + 1} / {total}
              </div>
            </div>

            {/* Text Panel */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-5">
              <p className={`text-xl sm:text-2xl font-bold text-gray-800 leading-relaxed p-2 rounded-xl transition-colors ${
                speakingState === 'english' ? 'bg-yellow-100' : ''
              }`}>
                {page.english_text}
              </p>
              <div className="h-0.5 bg-[#FFF8F0] my-3" />
              <p className={`text-base sm:text-lg text-gray-500 font-semibold leading-relaxed p-2 rounded-xl transition-colors ${
                speakingState === 'vietnamese' ? 'bg-green-100' : ''
              }`}>
                {page.vietnamese_text}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Audio Controls */}
        <AudioControls
          speakingState={speakingState}
          readMode={readMode}
          isFullBookPlaying={isFullBookPlaying}
          onReadModeChange={setReadMode}
          onEnglish={handleEnglish}
          onVietnamese={handleVietnamese}
          onBoth={handleBoth}
          onStop={stopAll}
        />

        {/* Page Navigation */}
        <div className="flex justify-center items-center gap-5 pb-10">
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={goPrev}
            disabled={currentIndex === 0 || isFullBookPlaying}
            className="w-16 h-16 rounded-full bg-[#FFF8F0] border-3 border-gray-200 text-2xl font-extrabold flex items-center justify-center disabled:opacity-30"
          >
            ←
          </motion.button>
          <span className="text-gray-500 font-extrabold text-lg">
            {currentIndex + 1} of {total}
          </span>
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={goNext}
            disabled={isFullBookPlaying}
            className="w-16 h-16 rounded-full bg-[#FF6B35] text-white text-2xl font-extrabold flex items-center justify-center disabled:opacity-30"
          >
            →
          </motion.button>
        </div>
      </div>
    </div>
  );
}
