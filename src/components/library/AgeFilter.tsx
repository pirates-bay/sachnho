'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AGE_GROUPS } from '@/lib/constants';

interface AgeFilterProps {
  onFilter: (min: number, max: number) => void;
}

export function AgeFilter({ onFilter }: AgeFilterProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex justify-center gap-3 px-6 py-5 flex-wrap">
      {AGE_GROUPS.map((group, i) => (
        <motion.button
          key={i}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setActive(i); onFilter(group.min, group.max); }}
          className={`rounded-full px-5 py-3 font-bold text-sm transition-all flex items-center gap-2 ${
            active === i
              ? 'ring-2 ring-gray-800 ring-offset-2'
              : ''
          } ${
            i === 0 ? 'bg-white text-gray-800' :
            i === 1 ? 'bg-pink-200 text-pink-800' :
            i === 2 ? 'bg-green-200 text-green-800' :
            'bg-purple-200 text-purple-800'
          }`}
        >
          <span>{group.emoji}</span>
          {group.label}
        </motion.button>
      ))}
    </div>
  );
}
