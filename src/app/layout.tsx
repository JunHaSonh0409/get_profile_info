import type { Metadata, Viewport } from 'next';
import { Gowun_Batang } from 'next/font/google';
import './globals.css';

// Korean glyphs are not a selectable subset, so the font is loaded on demand instead of preloaded.
const serif = Gowun_Batang({ weight: ['400', '700'], display: 'swap', preload: false, variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'Orbit · 인연 프로필',
  description: '우주 모든 인연이 만날 때까지. 나의 프로필과 이상형을 남기고 Orbit 매칭 이벤트에 참여하세요.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b1026',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={serif.variable}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
