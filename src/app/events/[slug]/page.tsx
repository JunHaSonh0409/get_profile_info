import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getAllEvents } from '@/lib/events';
import { resolveEvent } from '@/lib/eventFlow';
import EventDetailClient from './EventDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

// Cache Components requires at least one param; other slugs still render on demand.
const FALLBACK_PARAMS = [{ slug: 'vol01' }];

export async function generateStaticParams() {
  try {
    const params = (await getAllEvents()).map((e) => ({ slug: e.slug }));
    return params.length > 0 ? params : FALLBACK_PARAMS;
  } catch {
    return FALLBACK_PARAMS; // build without DB access
  }
}

async function EventPageContent({ params }: Props) {
  const { slug } = await params;
  const event = await resolveEvent(slug);
  if (!event) notFound();
  return <EventDetailClient event={event} />;
}

export default function EventPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="shell center muted">이벤트를 불러오는 중</p>}>
      <EventPageContent params={params} />
    </Suspense>
  );
}
