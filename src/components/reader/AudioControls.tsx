'use client';

import { motion } from 'framer-motion';

export type ReadMode = 'page' | 'book';

interface AudioControlsProps {
  speakingState: 'idle' | 'english' | 'vietnamese';
  readMode: ReadMode;
  isFullBookPlaying: boolean;
  onReadModeChange: (mode: ReadMode) => void;
  onEnglish: () => void;
  onVietnamese: () => void;
  onBoth: () => void;
  onStop: () => void;
}

export function AudioControls({
  speakingState,
  readMode,
  isFullBookPlaying,
  onReadModeChange,
  onEnglish,
  onVietnamese,
  onBoth,
  onStop,
}: AudioControlsProps) {
  const isPlaying = speakingState !== 'idle';

  return (
    <div className="mb-6">
      {/* Read Mode Toggle */}
      <div className="flex justify-center mb-4">
        <div className="bg-gray-100 rounded-full p-1 flex gap-1">
          <button
            onClick={() => { onStop(); onReadModeChange('page'); }}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              readMode === 'page'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📖 Read Page
          </button>
          <button
            onClick={() => { onStop(); onReadModeChange('book'); }}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              readMode === 'book'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📚 Read Full Book
          </button>
        </div>
      </div>

      {/* Audio Buttons */}
      <div className="flex gap-3 justify-center flex-wrap">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          animate={speakingState === 'english' ? { scale: [1, 1.08, 1] } : {}}
          transition={speakingState === 'english' ? { repeat: Infinity, duration: 0.6 } : {}}
          onClick={isPlaying || isFullBookPlaying ? onStop : onEnglish}
          className="bg-[#FF6B35] text-white rounded-full px-7 py-4 font-extrabold text-base flex items-center gap-2.5 min-w-[140px] justify-center"
        >
          <span className="text-xl">{isPlaying && speakingState === 'english' ? '⏹' : '🔊'}</span>
          English
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          animate={speakingState === 'vietnamese' ? { scale: [1, 1.08, 1] } : {}}
          transition={speakingState === 'vietnamese' ? { repeat: Infinity, duration: 0.6 } : {}}
          onClick={isPlaying || isFullBookPlaying ? onStop : onVietnamese}
          className="bg-[#4ECDC4] text-white rounded-full px-7 py-4 font-extrabold text-base flex items-center gap-2.5 min-w-[140px] justify-center"
        >
          <span className="text-xl">{isPlaying && speakingState === 'vietnamese' ? '⏹' : '🔊'}</span>
          Tiếng Việt
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          animate={isPlaying ? { scale: [1, 1.08, 1] } : {}}
          transition={isPlaying ? { repeat: Infinity, duration: 0.6 } : {}}
          onClick={isPlaying || isFullBookPlaying ? onStop : onBoth}
          className="bg-[#A78BFA] text-white rounded-full px-7 py-4 font-extrabold text-base flex items-center gap-2.5 min-w-[140px] justify-center"
        >
          <span className="text-xl">{isPlaying ? '⏹' : '🔊'}</span>
          Both
        </motion.button>
      </div>

      {/* Full Book Mode Indicator */}
      {isFullBookPlaying && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-3"
        >
          <span className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-bold">
            <span className="animate-pulse">●</span> Reading full book...
          </span>
        </motion.div>
      )}
    </div>
  );
}
