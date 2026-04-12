'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { TTS_CONFIG } from '@/lib/constants';

type SpeakingState = 'idle' | 'english' | 'vietnamese';

interface AudioUrls {
  audio_en_url?: string | null;
  audio_vi_url?: string | null;
}

export function useTTS() {
  const [speakingState, setSpeakingState] = useState<SpeakingState>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stoppedRef = useRef(false);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSpeakingState('idle');
  }, []);

  const playAudioFile = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { audioRef.current = null; resolve(); };
      audio.onerror = () => { audioRef.current = null; reject(new Error('Audio playback failed')); };
      audio.play().catch(reject);
    });
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

  // Play audio file if available, otherwise use TTS
  const playOrSpeak = useCallback(async (text: string, lang: 'en' | 'vi', audioUrl?: string | null) => {
    if (audioUrl) {
      await playAudioFile(audioUrl);
    } else {
      await speakText(text, lang);
    }
  }, [playAudioFile, speakText]);

  const speakEnglish = useCallback(async (text: string, audio?: AudioUrls) => {
    stop();
    stoppedRef.current = false;
    setSpeakingState('english');
    try {
      await playOrSpeak(text, 'en', audio?.audio_en_url);
    } finally {
      if (!stoppedRef.current) setSpeakingState('idle');
    }
  }, [stop, playOrSpeak]);

  const speakVietnamese = useCallback(async (text: string, audio?: AudioUrls) => {
    stop();
    stoppedRef.current = false;
    setSpeakingState('vietnamese');
    try {
      await playOrSpeak(text, 'vi', audio?.audio_vi_url);
    } finally {
      if (!stoppedRef.current) setSpeakingState('idle');
    }
  }, [stop, playOrSpeak]);

  const speakBoth = useCallback(async (englishText: string, vietnameseText: string, audio?: AudioUrls) => {
    stop();
    stoppedRef.current = false;
    setSpeakingState('english');
    try {
      await playOrSpeak(englishText, 'en', audio?.audio_en_url);
      if (stoppedRef.current) return;
      await new Promise<void>((resolve) => {
        timeoutRef.current = setTimeout(resolve, TTS_CONFIG.pauseBetween);
      });
      if (stoppedRef.current) return;
      setSpeakingState('vietnamese');
      await playOrSpeak(vietnameseText, 'vi', audio?.audio_vi_url);
    } finally {
      if (!stoppedRef.current) setSpeakingState('idle');
    }
  }, [stop, playOrSpeak]);

  // Read a single page, returns when done
  const speakPage = useCallback(async (
    englishText: string,
    vietnameseText: string,
    mode: 'english' | 'vietnamese' | 'both',
    audio?: AudioUrls
  ): Promise<void> => {
    if (mode === 'english') {
      setSpeakingState('english');
      await playOrSpeak(englishText, 'en', audio?.audio_en_url);
      if (!stoppedRef.current) setSpeakingState('idle');
    } else if (mode === 'vietnamese') {
      setSpeakingState('vietnamese');
      await playOrSpeak(vietnameseText, 'vi', audio?.audio_vi_url);
      if (!stoppedRef.current) setSpeakingState('idle');
    } else {
      setSpeakingState('english');
      await playOrSpeak(englishText, 'en', audio?.audio_en_url);
      if (stoppedRef.current) return;
      await new Promise<void>((resolve) => {
        timeoutRef.current = setTimeout(resolve, TTS_CONFIG.pauseBetween);
      });
      if (stoppedRef.current) return;
      setSpeakingState('vietnamese');
      await playOrSpeak(vietnameseText, 'vi', audio?.audio_vi_url);
      if (!stoppedRef.current) setSpeakingState('idle');
    }
  }, [playOrSpeak]);

  // Start full-book reading from a given index
  const startFullBookReading = useCallback(async (
    pages: { english_text: string; vietnamese_text: string; audio_en_url: string | null; audio_vi_url: string | null }[],
    startIndex: number,
    mode: 'english' | 'vietnamese' | 'both',
    onPageChange: (index: number) => void,
    waitForImageLoad?: () => Promise<void>,
  ) => {
    stop();
    stoppedRef.current = false;

    for (let i = startIndex; i < pages.length; i++) {
      if (stoppedRef.current) return;
      onPageChange(i);

      // Wait for page transition animation
      await new Promise<void>((resolve) => {
        timeoutRef.current = setTimeout(resolve, 400);
      });
      if (stoppedRef.current) return;

      // Wait for the page image to load before speaking
      if (waitForImageLoad) {
        await waitForImageLoad();
      }
      if (stoppedRef.current) return;

      const p = pages[i];

      // Skip pages with no text (title/credit pages) — just show briefly
      if (!p.english_text && !p.vietnamese_text) {
        await new Promise<void>((resolve) => {
          timeoutRef.current = setTimeout(resolve, 1500);
        });
        continue;
      }

      await speakPage(p.english_text, p.vietnamese_text, mode, {
        audio_en_url: p.audio_en_url,
        audio_vi_url: p.audio_vi_url,
      });
      if (stoppedRef.current) return;

      // Pause between pages — give kids time to look at the picture
      await new Promise<void>((resolve) => {
        timeoutRef.current = setTimeout(resolve, TTS_CONFIG.pauseBetweenPages);
      });
    }
  }, [stop, speakPage]);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return {
    speakingState,
    speakEnglish,
    speakVietnamese,
    speakBoth,
    speakPage,
    startFullBookReading,
    stop,
    stoppedRef,
  };
}
