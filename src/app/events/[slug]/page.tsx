import React, { Suspense } from 'react';
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

  if (!event) {
    notFound();
  }

  return <EventDetailClient event={event} />;
}

export default function EventPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 50% 10%, #0f172a 0%, #07090e 70%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            fontSize: '14px',
          }}
        >
          이벤트 페이지 로딩 중...
        </div>
      }
    >
      <EventPageContent params={params} />
    </Suspense>
  );
}
