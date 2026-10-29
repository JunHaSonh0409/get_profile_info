'use client';

import { useCallback, useEffect, useState } from 'react';
import type { OrbitEvent } from '@/types/event';
import type { MemberBoard } from '@/lib/eventFlow';
import { STAGE_ORDER, formatDeadlineShort } from '@/lib/eventStages';

/** Loads /api/events/[slug] (event + what this member may see) and exposes a reload. */
export function useEventBoard(slug: string) {
  const [board, setBoard] = useState<MemberBoard | null>(null);
  const [error, setError] = useState('');

  const reload = useCallback(
    () =>
      fetch(`/api/events/${encodeURIComponent(slug)}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (!data.success) throw new Error(data.error);
          setBoard(data);
          setError('');
        })
        .catch((err) => setError(err instanceof Error && err.message ? err.message : '이벤트를 불러오지 못했어요.')),
    [slug]
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return { board, error, reload };
}

/** POST helper for member actions; resolves to an error message or ''. */
export async function postAction(url: string, body: unknown): Promise<string> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    return data.success ? '' : data.error || '요청을 처리하지 못했어요.';
  } catch {
    return '네트워크 오류가 있었어요. 잠시 후 다시 시도해주세요.';
  }
}

const STEPS: { status: OrbitEvent['status']; label: string; until: (e: OrbitEvent) => string | null | undefined }[] = [
  { status: 'ongoing', label: '진행중', until: (e) => e.applyEndsAt },
  { status: 'screening', label: '선별중', until: (e) => e.likeEndsAt },
  { status: 'choosing', label: '선택중', until: (e) => e.chooseEndsAt },
  { status: 'ended', label: '종료', until: () => null },
];

/** 진행중 → 선별중 → 선택중 → 종료 with each stage's deadline. */
export function StageTimeline({ event }: { event: OrbitEvent }) {
  const now = STAGE_ORDER.indexOf(event.status);
  return (
    <ol className="timeline" aria-label="이벤트 진행 단계">
      {STEPS.map((step) => {
        const i = STAGE_ORDER.indexOf(step.status);
        const state = i < now ? 'done' : i === now ? 'now' : 'next';
        const until = step.until(event);
        return (
          <li key={step.status} data-state={state} aria-current={state === 'now' ? 'step' : undefined}>
            <strong>{step.label}</strong>
            {until ? `~ ${formatDeadlineShort(until)}` : step.status === 'ended' ? '' : '일정 미정'}
          </li>
        );
      })}
    </ol>
  );
}
