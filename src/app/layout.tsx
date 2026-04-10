import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SachNho - Learn English with Books!',
  description: 'Help Vietnamese kids learn English through fun picture books',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-[#FFF8F0] text-[#2D3436]" style={{ fontFamily: "'Nunito', sans-serif" }}>
        {/* Header */}
        <header className="bg-white px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
          <a href="/" className="flex items-center gap-2 no-underline">
            <div className="w-10 h-10 bg-[#FF6B35] rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ fontFamily: "'Fredoka One', cursive" }}>
              S
            </div>
            <span className="text-2xl text-[#FF6B35]" style={{ fontFamily: "'Fredoka One', cursive" }}>
              SachNho
            </span>
          </a>
        </header>
        {children}
      </body>
    </html>
  );
}
