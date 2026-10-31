import type { EventStatus, OrbitEvent } from '@/types/event';

export const KAKAO_CHANNEL_URL = 'https://pf.kakao.com/_txnqmX';

/** The event room (KakaoTalk open chat) shown from the menu. */
export const EVENT_ROOM_URL = 'https://open.kakao.com/o/gQ0EZeSi';
export const EVENT_ROOM_PASSWORD = 'orbit123';

/** 'VOL.01' -> 'VOL.1 END' */
export function volEnd(vol?: string): string {
  const v = (vol || 'VOL.1').trim();
  if (/end$/i.test(v)) return v.toUpperCase();
  return `${v.replace(/vol\.?\s*0*/i, 'VOL.').toUpperCase()} END`;
}

export const STATUS_LABEL: Record<EventStatus, string> = {
  upcoming: '오픈 예정',
  ongoing: '신청 받는 중',
  screening: '선별 중',
  choosing: '선택 중',
  ended: '종료',
};

export const STATUS_CLASS: Record<EventStatus, string> = {
  upcoming: 'status--upcoming',
  ongoing: 'status--open',
  screening: 'status--upcoming',
  choosing: 'status--open',
  ended: 'status--ended',
};

/** Large word on the event plate. */
export function plateHeadline(event: Pick<OrbitEvent, 'status' | 'volNumber'>): string {
  switch (event.status) {
    case 'ongoing':
      return 'Now open';
    case 'screening':
      return 'Lineup';
    case 'choosing':
      return 'Your pick';
    case 'ended':
      return volEnd(event.volNumber);
    default:
      return 'Coming soon';
  }
}
