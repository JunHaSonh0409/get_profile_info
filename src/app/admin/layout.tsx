import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '보안 관리자 포털 | Orbit Admin',
  description: '최고 권한 관리자 전용 대시보드',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#090d16',
        color: '#f1f5f9',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard Variable", Pretendard, sans-serif',
      }}
    >
      {children}
    </div>
  );
}
