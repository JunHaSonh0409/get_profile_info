import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getEventBySlug, getAllEvents } from '@/lib/events';
import EventDetailClient from './EventDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const events = await getAllEvents();
  return events.map((e) => ({ slug: e.slug }));
}

async function EventPageContent({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
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
