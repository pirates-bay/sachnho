'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { TTS_CONFIG } from '@/lib/constants';

type SpeakingState = 'idle' | 'english' | 'vietnamese';

export function useTTS() {
  const [speakingState, setSpeakingState] = useState<SpeakingState>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSpeakingState('idle');
  }, []);

  const speakText = useCallback((text: string, lang: 'en' | 'vi'): Promise<void> => {
    return new Promise((resolve, reject) => {
      const config = TTS_CONFIG[lang];
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = config.lang;
      utterance.rate = config.rate;
      utterance.pitch = config.pitch;
      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);
      speechSynthesis.speak(utterance);
    });
  }, []);

  const speakEnglish = useCallback(async (text: string) => {
    stop();
    setSpeakingState('english');
    try {
      await speakText(text, 'en');
    } finally {
      setSpeakingState('idle');
    }
  }, [stop, speakText]);

  const speakVietnamese = useCallback(async (text: string) => {
    stop();
    setSpeakingState('vietnamese');
    try {
      await speakText(text, 'vi');
    } finally {
      setSpeakingState('idle');
    }
  }, [stop, speakText]);

  const speakBoth = useCallback(async (englishText: string, vietnameseText: string) => {
    stop();
    setSpeakingState('english');
    try {
      await speakText(englishText, 'en');
      await new Promise<void>((resolve) => {
        timeoutRef.current = setTimeout(resolve, TTS_CONFIG.pauseBetween);
      });
      setSpeakingState('vietnamese');
      await speakText(vietnameseText, 'vi');
    } finally {
      setSpeakingState('idle');
    }
  }, [stop, speakText]);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return { speakingState, speakEnglish, speakVietnamese, speakBoth, stop };
}
