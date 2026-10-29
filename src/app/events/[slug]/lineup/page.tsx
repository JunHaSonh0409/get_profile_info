import { Suspense } from 'react';
import type { Metadata } from 'next';
import LineupClient from './LineupClient';

export const metadata: Metadata = { title: 'Orbit · 선택 페이지', robots: { index: false, follow: false } };

type Props = PageProps<'/events/[slug]/lineup'>;

async function Lineup({ params }: Props) {
  const { slug } = await params;
  return <LineupClient slug={slug} />;
}

export default function LineupPage(props: Props) {
  return (
    <Suspense fallback={<p className="shell center muted">불러오는 중</p>}>
      <Lineup {...props} />
    </Suspense>
  );
}
