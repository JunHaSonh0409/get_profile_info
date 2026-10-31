'use client';

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import type { OrbitEvent } from '@/types/event';
import { formatCapacity, parseCapacity } from '@/lib/eventCapacity';
import { STATUS_CLASS, STATUS_LABEL } from '@/lib/eventLabels';
import { DEFAULT_DAYS, addDays, formatDeadline } from '@/lib/eventStages';

const DEADLINES = [
  { key: 'applyEndsAt', label: '진행중 마감 (신청 마감)' },
  { key: 'likeEndsAt', label: '선별중 마감 (관심 마감)' },
  { key: 'chooseEndsAt', label: '선택중 마감 (이벤트 종료)' },
] as const;

/** ISO -> value for <input type="datetime-local"> in the admin's local time. */
const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);
import EventPlate, { UNREVEALED_ART } from '@/components/EventPlate';
import { Field, Icon } from '@/components/ui';

interface Props {
  onShowToast: (msg: string) => void;
  onSwitchToOpenManage: () => void;
}

/** previousSlug: the saved address of the event being edited (absent for a new event). */
type Draft = Partial<OrbitEvent> & { slug: string; previousSlug?: string };
const toDraft = (e: OrbitEvent): Draft => ({ ...e, previousSlug: e.slug });

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export default function EventManagementTab({ onShowToast, onSwitchToOpenManage }: Props) {
  const [events, setEvents] = useState<OrbitEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchEvents = useCallback(
    (keepSlug?: string) =>
      fetch('/api/admin/events', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          const list: OrbitEvent[] = data.events || [];
          setEvents(list);
          const picked = list.find((e) => e.slug === keepSlug) || list[0];
          setDraft(picked ? toDraft(picked) : null);
          setIsNew(false);
        })
        .catch(() => onShowToast('이벤트 목록을 불러오지 못했어요.'))
        .finally(() => setIsLoading(false)),
    [onShowToast]
  );

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const set = (fields: Partial<OrbitEvent>) => setDraft((d) => (d ? { ...d, ...fields } : d));
  const capacity = parseCapacity(draft?.capacity);

  const addEvent = () => {
    const n = String(events.length + 1).padStart(2, '0');
    setDraft({
      volNumber: `VOL.${n}`,
      slug: `vol${n}`,
      title: `VOL.${n} 이벤트`,
      subtitle: '',
      status: 'upcoming',
      imageUrl: '',
      date: '',
      location: '',
      capacity: '',
      content: '',
    });
    setIsNew(true);
  };

  const uploadImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !draft) return;
    if (!file.type.startsWith('image/')) return onShowToast('JPG, PNG, WebP 이미지만 올릴 수 있어요.');
    if (file.size > MAX_IMAGE_BYTES) return onShowToast('이미지는 10MB까지 올릴 수 있어요.');

    setIsUploading(true);
    try {
      const form = new FormData();
      form.append('files', file);
      form.append('phone', `event_${draft.slug}`);
      const data = await (await fetch('/api/upload', { method: 'POST', body: form })).json();
      if (!data.success || !data.urls?.length) throw new Error(data.error);
      set({ imageUrl: data.urls[0] });
      onShowToast('포스터를 올렸어요. 시작하면 반영돼요.');
    } catch (err) {
      onShowToast(err instanceof Error && err.message ? err.message : '포스터를 올리지 못했어요.');
    } finally {
      setIsUploading(false);
    }
  };

  // Card fields are editable only while the event is stopped (or not created yet).
  const editable = isNew || draft?.status === 'upcoming';
  // The address the event is saved under; the slug field may hold an unsaved new address.
  const savedSlug = draft?.previousSlug ?? draft?.slug ?? '';

  const run = async (request: () => Promise<Response>, keepSlug?: string) => {
    setIsBusy(true);
    try {
      const data = await (await request()).json();
      if (!data.success) throw new Error(data.error);
      if (data.message) onShowToast(data.message);
      await fetchEvents(keepSlug);
      return true;
    } catch (err) {
      onShowToast(err instanceof Error && err.message ? err.message : '요청을 처리하지 못했어요.');
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  /** 시작: saves the card and opens applications until the 진행중 deadline. */
  const start = (e: FormEvent) => {
    e.preventDefault();
    if (!draft?.slug || !draft.volNumber || !draft.title) return onShowToast('회차, 주소, 제목은 꼭 입력해야 해요.');
    const until = draft.applyEndsAt ? formatDeadline(draft.applyEndsAt) : `지금부터 ${DEFAULT_DAYS.apply}일 뒤`;
    if (!confirm(`${draft.volNumber} 이벤트를 시작할까요? 지금부터 ${until}까지 신청을 받아요.`)) return;
    void run(() => fetch('/api/admin/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) }), draft.slug);
  };

  /** 정지: closes applications and unlocks the card for editing. */
  const stop = () => {
    if (!draft || !confirm(`${draft.volNumber} 이벤트를 정지할까요? 신청이 멈추고, 내용을 수정할 수 있어요.`)) return;
    void run(
      () => fetch('/api/admin/events/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: savedSlug, status: 'upcoming' }) }),
      savedSlug
    );
  };

  const remove = async () => {
    if (!draft || !confirm(`${draft.volNumber} 이벤트를 삭제할까요? 신청자·관심·매칭 기록도 함께 지워지고 되돌릴 수 없어요.`)) return;
    if (await run(() => fetch(`/api/admin/events?slug=${encodeURIComponent(savedSlug)}`, { method: 'DELETE' }))) {
      onShowToast(`${draft.volNumber} 이벤트를 삭제했어요.`);
    }
  };

  return (
    <div className="editor">
      <aside className="stack">
        <div className="row row--between">
          <h2 className="label">이벤트 {events.length}개</h2>
          <button type="button" className="btn btn--ghost btn--sm" onClick={addEvent}>
            <Icon name="plus" /> 새 이벤트
          </button>
        </div>
        {isLoading && <p className="muted small">불러오는 중</p>}
        {events.map((ev) => (
          <button key={ev.slug} type="button" className="event-row" aria-pressed={!isNew && ev.slug === draft?.previousSlug}
            onClick={() => { setDraft(toDraft(ev)); setIsNew(false); }}>
            <span className="event-row__thumb">
              <img src={ev.imageUrl || UNREVEALED_ART} alt="" style={ev.imageUrl ? undefined : { filter: 'brightness(0.7)', imageRendering: 'pixelated' }} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span className="row">
                <strong>{ev.volNumber}</strong>
                <span className={`status-dot ${STATUS_CLASS[ev.status]}`}>{STATUS_LABEL[ev.status]}</span>
              </span>
              <span className="small muted" style={{ display: 'block' }}>{ev.title}</span>
            </span>
          </button>
        ))}
      </aside>

      {draft && (
        <form className="stack stack--lg" onSubmit={start}>
          <div className="row row--between row--wrap">
            <h2 className="title">{isNew ? '새 이벤트' : `${draft.volNumber} 편집`}</h2>
            {!isNew && (
              <Link href={`/events/${savedSlug}`} target="_blank" className="btn btn--quiet btn--sm">
                <Icon name="external" /> 페이지 열기
              </Link>
            )}
          </div>

          {!editable && (
            <p className="notice notice--info">
              {draft.status === 'ongoing'
                ? `진행중이에요 (${formatDeadline(draft.applyEndsAt)}까지 신청). 내용을 바꾸려면 정지하세요.`
                : '선별중 이후에는 정지하거나 수정할 수 없어요. 단계는 진행·선별 탭에서 관리해요.'}
            </p>
          )}

          <fieldset className="stack stack--lg" disabled={!editable || isBusy} style={{ border: 0, minWidth: 0 }}>
          <div className="grid-2" style={{ alignItems: 'start' }}>
            <div className="stack">
              <EventPlate event={{ status: draft.status || 'upcoming', volNumber: draft.volNumber || '', title: draft.title || '', imageUrl: draft.imageUrl }} />
              <p className="hint">사용자에게 보이는 카드 미리보기예요.</p>
            </div>

            <div className="stack">
              <Field label="포스터 이미지" htmlFor="poster" hint="10MB 이하 JPG, PNG, WebP. 없으면 은하 배경 카드가 보여요.">
                <input id="poster" type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadImage} disabled={isUploading} className="small" />
              </Field>
              {isUploading && <p className="small muted">올리는 중</p>}
              {draft.imageUrl && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => set({ imageUrl: '' })}>
                  포스터 지우기
                </button>
              )}
              <div className="panel stack small">
                <span className="muted">현재 상태</span>
                <span className={`status-dot ${STATUS_CLASS[draft.status || 'upcoming']}`}>{STATUS_LABEL[draft.status || 'upcoming']}</span>
                <button type="button" className="link-btn" style={{ textAlign: 'left' }} onClick={onSwitchToOpenManage}>
                  단계 전환과 선별은 진행·선별 탭에서 해요
                </button>
              </div>
            </div>
          </div>

          <div className="grid-2">
            <Field label="회차" htmlFor="ev-vol" required>
              <input id="ev-vol" className="input" placeholder="VOL.01" value={draft.volNumber || ''} onChange={(e) => set({ volNumber: e.target.value })} />
            </Field>
            <Field label="페이지 주소" htmlFor="ev-slug" required hint={draft.previousSlug && draft.slug !== draft.previousSlug
              ? `시작하면 /events/${draft.previousSlug} → /events/${draft.slug || '...'} 로 바뀌어요. 예전 주소 링크는 열리지 않아요.`
              : `/events/${draft.slug || '...'}`}>
              <input id="ev-slug" className="input" placeholder="vol01" value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })} />
            </Field>
          </div>

          <Field label="제목" htmlFor="ev-title" required>
            <input id="ev-title" className="input" value={draft.title || ''} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="부제" htmlFor="ev-subtitle" optional>
            <input id="ev-subtitle" className="input" value={draft.subtitle || ''} onChange={(e) => set({ subtitle: e.target.value })} />
          </Field>

          <div className="grid-2">
            <Field label="일시" htmlFor="ev-date">
              <input id="ev-date" className="input" placeholder="2026.11.01 (토) 18:00" value={draft.date || ''} onChange={(e) => set({ date: e.target.value })} />
            </Field>
            <Field label="장소" htmlFor="ev-location">
              <input id="ev-location" className="input" placeholder="서울 강남" value={draft.location || ''} onChange={(e) => set({ location: e.target.value })} />
            </Field>
          </div>

          <div className="grid-2">
            {(['male', 'female'] as const).map((g) => (
              <Field key={g} label={`모집 인원 (${g === 'male' ? '남' : '여'})`} htmlFor={`ev-cap-${g}`} hint="비우면 '추후 안내'로 보여요.">
                <div className="affix">
                  <input id={`ev-cap-${g}`} className="input" type="number" min={0} inputMode="numeric" placeholder="15"
                    value={capacity[g] ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : Math.max(0, Math.floor(Number(e.target.value)));
                      set({ capacity: formatCapacity({ ...capacity, [g]: value }) });
                    }} />
                  <span className="affix__text">명</span>
                </div>
              </Field>
            ))}
          </div>

          <fieldset className="panel stack">
            <legend className="label">단계 마감 시각</legend>
            <p className="hint">시각이 지나면 다음 단계로 자동으로 넘어가요. 선별중 → 선택중은 선별을 공개한 뒤에만 넘어가요.</p>
            <div className="grid-2">
              {DEADLINES.map(({ key, label }) => (
                <Field key={key} label={label} htmlFor={`ev-${key}`}>
                  <input id={`ev-${key}`} className="input" type="datetime-local" value={toLocalInput(draft[key])}
                    onChange={(e) => set({ [key]: fromLocalInput(e.target.value) })} />
                </Field>
              ))}
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => {
              const now = new Date();
              set({
                applyEndsAt: addDays(now, DEFAULT_DAYS.apply),
                likeEndsAt: addDays(now, DEFAULT_DAYS.apply + DEFAULT_DAYS.like),
                chooseEndsAt: addDays(now, DEFAULT_DAYS.apply + DEFAULT_DAYS.like + DEFAULT_DAYS.choose),
              });
            }}>
              지금부터 기본 일정으로 채우기 (3일 · 2일 · 1일)
            </button>
          </fieldset>

          <Field label="상세 안내" htmlFor="ev-content" hint="이벤트 페이지 본문과 목록 소개에 함께 쓰여요.">
            <textarea id="ev-content" className="textarea" rows={6} value={draft.content || draft.description || ''}
              onChange={(e) => set({ content: e.target.value, description: e.target.value })} />
          </Field>

          </fieldset>

          <div className="row row--wrap">
            {editable && (
              <button type="submit" className="btn btn--primary" style={{ flex: 1 }} disabled={isBusy}>
                {isBusy ? '처리하는 중' : '시작'}
              </button>
            )}
            {draft.status === 'ongoing' && (
              <button type="button" className="btn btn--ghost" style={{ flex: 1 }} onClick={stop} disabled={isBusy}>
                정지
              </button>
            )}
            {!isNew && (
              <button type="button" className="btn btn--danger" onClick={remove} disabled={isBusy}>
                <Icon name="trash" /> 삭제
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
