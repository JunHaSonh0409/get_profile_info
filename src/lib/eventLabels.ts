import type { OrbitEvent } from '@/types/event';

export const KAKAO_CHANNEL_URL = 'https://pf.kakao.com/_txnqmX';

/** 'VOL.01' -> 'VOL.1 END' */
export function volEnd(vol?: string): string {
  const v = (vol || 'VOL.1').trim();
  if (/end$/i.test(v)) return v.toUpperCase();
  return `${v.replace(/vol\.?\s*0*/i, 'VOL.').toUpperCase()} END`;
}

export const STATUS_LABEL: Record<OrbitEvent['status'], string> = {
  upcoming: '오픈 예정',
  ongoing: '신청 받는 중',
  ended: '종료',
};

export const STATUS_CLASS: Record<OrbitEvent['status'], string> = {
  upcoming: 'status--upcoming',
  ongoing: 'status--open',
  ended: 'status--ended',
};

/** Large word on the event plate. */
export function plateHeadline(event: Pick<OrbitEvent, 'status' | 'volNumber'>): string {
  if (event.status === 'ongoing') return 'Now open';
  if (event.status === 'ended') return volEnd(event.volNumber);
  return 'Coming soon';
}
