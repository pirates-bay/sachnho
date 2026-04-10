'use client';

import { motion } from 'framer-motion';

interface AudioControlsProps {
  speakingState: 'idle' | 'english' | 'vietnamese';
  onEnglish: () => void;
  onVietnamese: () => void;
  onBoth: () => void;
  onStop: () => void;
}

export function AudioControls({ speakingState, onEnglish, onVietnamese, onBoth, onStop }: AudioControlsProps) {
  const isPlaying = speakingState !== 'idle';

  return (
    <div className="flex gap-3 justify-center flex-wrap mb-6">
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        animate={speakingState === 'english' ? { scale: [1, 1.08, 1] } : {}}
        transition={speakingState === 'english' ? { repeat: Infinity, duration: 0.6 } : {}}
        onClick={isPlaying ? onStop : onEnglish}
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
        onClick={isPlaying ? onStop : onVietnamese}
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
        onClick={isPlaying ? onStop : onBoth}
        className="bg-[#A78BFA] text-white rounded-full px-7 py-4 font-extrabold text-base flex items-center gap-2.5 min-w-[140px] justify-center"
      >
        <span className="text-xl">{isPlaying ? '⏹' : '🔊'}</span>
        Both
      </motion.button>
    </div>
  );
}
