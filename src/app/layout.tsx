import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '인연 프로필 등록 | Orbit Love',
  description: '나만의 매력과 이상형을 등록하고 설레는 인연을 만나보세요. Vercel & Supabase 기반의 감성 프로필 매칭 온보딩.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0d0f1a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
