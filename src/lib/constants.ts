export const COLORS = {
  orange: '#FF6B35',
  teal: '#4ECDC4',
  yellow: '#FFE66D',
  cream: '#FFF8F0',
  purple: '#A78BFA',
  pink: '#F472B6',
  green: '#34D399',
  dark: '#2D3436',
  gray: '#636E72',
} as const;

export const AGE_GROUPS = [
  { label: 'All Books', labelVi: 'Tất Cả', min: 0, max: 99, emoji: '📚' },
  { label: 'Baby 2-4', labelVi: 'Bé Nhỏ', min: 2, max: 4, emoji: '👶' },
  { label: 'Kid 5-7', labelVi: 'Trẻ Em', min: 5, max: 7, emoji: '🧒' },
  { label: 'Big Kid 8-10', labelVi: 'Lớn Hơn', min: 8, max: 10, emoji: '🎓' },
] as const;

export const TTS_CONFIG = {
  en: { lang: 'en-US', rate: 0.65, pitch: 1.1 },
  vi: { lang: 'vi-VN', rate: 0.7, pitch: 1.1 },
  pauseBetween: 1800,
  pauseBetweenPages: 1400,
} as const;
