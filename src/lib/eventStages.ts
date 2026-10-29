import type { EventStatus, OrbitEvent } from '@/types/event';

// Pure stage rules shared by the server (auto transitions) and the UI (labels, timelines).

export const STAGE_ORDER: EventStatus[] = ['upcoming', 'ongoing', 'screening', 'choosing', 'ended'];

export const STAGE_LABEL: Record<EventStatus, string> = {
  upcoming: '오픈 예정',
  ongoing: '진행중 · 신청 받는 중',
  screening: '선별중',
  choosing: '선택중',
  ended: '종료',
};

/** Recommended durations, used to prefill deadlines. */
export const DEFAULT_DAYS = { apply: 3, like: 2, choose: 1 } as const;

const DAY = 24 * 60 * 60 * 1000;
export const addDays = (from: Date, days: number) => new Date(from.getTime() + days * DAY).toISOString();

const passed = (iso: string | null | undefined, now: Date) => Boolean(iso) && new Date(iso as string).getTime() <= now.getTime();

/**
 * The status an event should have at `now`, following deadlines:
 * ongoing → screening at applyEndsAt; screening → choosing at likeEndsAt (only once published);
 * choosing → ended at chooseEndsAt. Steps chain, so a long-idle event catches up in one call.
 */
export function dueStatus(event: Pick<OrbitEvent, 'status' | 'applyEndsAt' | 'likeEndsAt' | 'chooseEndsAt' | 'publishedAt'>, now = new Date()): EventStatus {
  let status = event.status;
  if (status === 'ongoing' && passed(event.applyEndsAt, now)) status = 'screening';
  if (status === 'screening' && event.publishedAt && passed(event.likeEndsAt, now)) status = 'choosing';
  if (status === 'choosing' && passed(event.chooseEndsAt, now)) status = 'ended';
  return status;
}

/** Likes are open while the published lineup is on display during 선별중. */
export const likesOpen = (e: Pick<OrbitEvent, 'status' | 'publishedAt'>) => e.status === 'screening' && Boolean(e.publishedAt);

/** The lineup page is visible once published, through the end of the event. */
export const lineupVisible = (e: Pick<OrbitEvent, 'status' | 'publishedAt'>) =>
  Boolean(e.publishedAt) && (e.status === 'screening' || e.status === 'choosing' || e.status === 'ended');

/** Compact form for tight spaces: "10.30 21:00". */
export function formatDeadlineShort(iso?: string | null): string {
  if (!iso) return '미정';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}.${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDeadline(iso?: string | null): string {
  if (!iso) return '미정';
  return new Date(iso).toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' });
}
