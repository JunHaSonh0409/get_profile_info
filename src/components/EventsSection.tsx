'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { OrbitEvent } from '@/types/event';
import { KAKAO_CHANNEL_URL } from '@/lib/eventLabels';
import EventPlate from './EventPlate';
import { StageTimeline } from './eventBoard';
import { Icon } from './ui';

const CTA_LABEL: Record<OrbitEvent['status'], string> = {
  upcoming: '이벤트 자세히 보기',
  ongoing: '참가 신청하기',
  screening: '선별된 사람들 보기',
  choosing: '선택 페이지 보기',
  ended: '결과 보기',
};

export default function EventsSection({ onGoToProfile }: { onGoToProfile: () => void }) {
  const [events, setEvents] = useState<OrbitEvent[] | null>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    fetch('/api/events', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setEvents(Array.isArray(data.events) ? data.events : []))
      .catch(() => setEvents([]));
  }, []);

  if (!events) {
    return (
      <p className="center muted" role="status">
        <Icon name="refresh" className="icon spin" /> 이벤트를 불러오는 중
      </p>
    );
  }

  const event = events[selected];
  if (!event) {
    return (
      <section className="sheet stack center">
        <h1 className="display">준비 중인 이벤트가 없어요</h1>
        <p className="lede">새 이벤트가 열리면 카카오톡 채널로 알려드려요.</p>
        <a className="btn btn--primary btn--block" href={KAKAO_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
          <Icon name="bell" /> 오픈 알림 받기
        </a>
      </section>
    );
  }

  const href = `/events/${event.slug}`;

  return (
    <div className="stack stack--lg">
      <header className="stack">
        <h1 className="display">매칭 이벤트</h1>
        <p className="lede">Orbit 회원을 위한 오프라인 매칭 모임이에요.</p>
      </header>

      {events.length > 1 && (
        <div className="vol-tabs" role="tablist" aria-label="이벤트 회차">
          {events.map((ev, i) => (
            <button key={ev.slug} type="button" role="tab" className="chip" aria-selected={i === selected} onClick={() => setSelected(i)}>
              {ev.volNumber}
            </button>
          ))}
        </div>
      )}

      <EventPlate event={event} href={href} />

      <section className="sheet stack">
        <h2 className="title">{event.title}</h2>
        <p className="muted">
          {event.description || '취향과 가치관을 바탕으로 준비 중인 매칭 이벤트예요. 프로필을 미리 등록해두면 오픈 소식을 놓치지 않아요.'}
        </p>
        {event.status !== 'upcoming' && <StageTimeline event={event} />}
        <ul className="stack small muted" style={{ listStyle: 'none', gap: 6 }}>
          <li className="row"><Icon name="user" /> 프로필을 등록한 회원만 신청할 수 있어요</li>
          <li className="row"><Icon name="star" /> 관심과 선택은 각각 한 번, 1:1 만남이 원칙이에요</li>
          <li className="row"><Icon name="lock" /> 매칭 전까지 실명과 연락처는 공개되지 않아요</li>
        </ul>
        <Link href={event.status === 'screening' || event.status === 'choosing' ? `${href}/lineup` : href} className="btn btn--primary btn--block">
          {CTA_LABEL[event.status]}
        </Link>
        {event.status === 'upcoming' && (
          <a className="btn btn--ghost btn--block" href={KAKAO_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
            <Icon name="bell" /> 오픈 알림 받기 (카카오톡 채널)
          </a>
        )}
        <button type="button" className="btn btn--quiet btn--block" onClick={onGoToProfile}>
          내 프로필로 가기
        </button>
      </section>
    </div>
  );
}
