'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { EventStatus, OrbitEvent } from '@/types/event';
import type { EventApplication } from '@/types/application';
import { parseCapacity } from '@/lib/eventCapacity';
import { STAGE_LABEL } from '@/lib/eventStages';
import { downloadCsv, today } from '@/lib/csv';
import { StageTimeline } from '@/components/eventBoard';
import { Icon } from '@/components/ui';

type Applicant = EventApplication & { likeCount: number };
interface Board {
  event: OrbitEvent;
  applications: Applicant[];
  totalLikes: number;
  matches: { applicationId: string; partner: { nickname: string; name: string; phone: string } | null }[];
}

const isMale = (g: string) => g === '남성' || g === 'male';
const hasPhoto = (a: Applicant) => Boolean(a.card?.photos.length);

/** Unbiased random sample using the browser's CSPRNG. */
function sample<T>(items: T[], n: number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.max(0, n));
}

const NEXT_STEP: Partial<Record<EventStatus, { to: EventStatus; label: string; confirm: string }>> = {
  upcoming: { to: 'ongoing', label: '진행중으로 열기 (신청 시작)', confirm: '신청을 받기 시작할까요?' },
  ongoing: { to: 'screening', label: '신청 마감하고 선별중으로', confirm: '지금 신청을 마감할까요? 이후로는 신청할 수 없어요. 직접 마감하면 자동 선별은 하지 않으니, 선별중에 직접 선별해 주세요.' },
  screening: { to: 'choosing', label: '관심 마감하고 선택중으로', confirm: '관심 보내기를 마감하고 선택 단계로 넘길까요?' },
  choosing: { to: 'ended', label: '종료하고 매칭 공개', confirm: '이벤트를 종료할까요? 매칭된 두 사람에게 서로의 연락처가 전달돼요.' },
};

export default function EventOpenManagementTab({ onShowToast }: { onShowToast: (msg: string) => void }) {
  const [events, setEvents] = useState<OrbitEvent[]>([]);
  const [slug, setSlug] = useState('');
  const [board, setBoard] = useState<Board | null>(null);
  const [busy, setBusy] = useState(false);

  // Selection draft (only while screening and not yet published)
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [skipNoPhoto, setSkipNoPhoto] = useState(true);
  const [randomCount, setRandomCount] = useState({ male: '', female: '' });
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/events', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
        setSlug((s) => s || data.events?.[0]?.slug || '');
      })
      .catch(() => onShowToast('이벤트 목록을 불러오지 못했어요.'));
  }, [onShowToast]);

  const load = useCallback(
    (target: string) =>
      fetch(`/api/admin/events/applications?slug=${encodeURIComponent(target)}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (!data.success) throw new Error(data.error);
          setBoard(data);
          setPicked(new Set((data.applications as Applicant[]).filter((a) => a.selected).map((a) => a.id)));
          const cap = parseCapacity(data.event.capacity);
          setRandomCount({ male: cap.male?.toString() ?? '', female: cap.female?.toString() ?? '' });
        })
        .catch((err) => onShowToast(err instanceof Error && err.message ? err.message : '신청자 목록을 불러오지 못했어요.')),
    [onShowToast]
  );

  useEffect(() => {
    if (slug) void load(slug);
  }, [slug, load]);

  const apps = useMemo(() => board?.applications ?? [], [board]);
  // Selection opens with applications (진행중) and closes once published.
  const editable = (board?.event.status === 'ongoing' || board?.event.status === 'screening') && !board.event.publishedAt;
  const eligible = (a: Applicant) => !skipNoPhoto || hasPhoto(a);

  if (!board) return <p className="muted">이벤트를 불러오는 중이거나 등록된 이벤트가 없어요.</p>;
  const { event } = board;
  const capacity = parseCapacity(event.capacity);
  const males = apps.filter((a) => isMale(a.gender));
  const pickedApps = apps.filter((a) => picked.has(a.id));
  const matchOf = new Map(board.matches.map((m) => [m.applicationId, m.partner]));

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pickRandom = () => {
    const m = Number(randomCount.male) || 0;
    const f = Number(randomCount.female) || 0;
    const pool = apps.filter(eligible);
    const chosen = [...sample(pool.filter((a) => isMale(a.gender)), m), ...sample(pool.filter((a) => !isMale(a.gender)), f)];
    setPicked(new Set(chosen.map((a) => a.id)));
    const short = [m > chosen.filter((a) => isMale(a.gender)).length && '남성', f > chosen.filter((a) => !isMale(a.gender)).length && '여성'].filter(Boolean);
    onShowToast(short.length ? `${short.join('·')} 후보가 부족해서 있는 만큼만 뽑았어요.` : `남 ${m}명, 여 ${f}명을 무작위로 뽑았어요.`);
  };

  const applyPhotoFilter = (on: boolean) => {
    setSkipNoPhoto(on);
    if (on) setPicked((prev) => new Set([...prev].filter((id) => hasPhoto(apps.find((a) => a.id === id)!))));
  };

  const request = async (url: string, init: RequestInit, success: string) => {
    setBusy(true);
    try {
      const data = await (await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } })).json();
      if (!data.success) throw new Error(data.error);
      onShowToast(data.message || success);
      if (data.event) setEvents((prev) => prev.map((e) => (e.slug === data.event.slug ? data.event : e)));
      await load(slug);
    } catch (err) {
      onShowToast(err instanceof Error && err.message ? err.message : '요청을 처리하지 못했어요.');
    } finally {
      setBusy(false);
    }
  };

  const advance = () => {
    const step = NEXT_STEP[event.status];
    if (step && confirm(step.confirm)) void request('/api/admin/events/status', { method: 'PATCH', body: JSON.stringify({ slug, status: step.to }) }, '단계를 바꿨어요.');
  };

  const publish = () => {
    if (pickedApps.length === 0) return onShowToast('선별할 사람을 1명 이상 골라주세요.');
    const m = pickedApps.filter((a) => isMale(a.gender)).length;
    if (!confirm(`남 ${m}명, 여 ${pickedApps.length - m}명을 선별해 공개할까요? 공개하면 모든 회원이 볼 수 있고, 선별은 바꿀 수 없어요.`)) return;
    void request('/api/admin/events/selection', { method: 'POST', body: JSON.stringify({ slug, ids: [...picked] }) }, '선별을 공개했어요. 이제 회원들이 관심을 보낼 수 있어요.');
  };

  const remove = (a: Applicant) => {
    if (confirm(`${a.name}님의 신청을 삭제할까요?`)) void request(`/api/admin/events/applications?id=${encodeURIComponent(a.id)}`, { method: 'DELETE' }, '신청을 삭제했어요.');
  };

  const exportCsv = () => {
    if (apps.length === 0) return onShowToast('내려받을 신청자가 없어요.');
    downloadCsv(
      `orbit_${slug}_applicants_${today()}.csv`,
      ['신청일시', '이름', '닉네임', '연락처', '성별', '나이', '사진수', '선별', '받은관심', '매칭상대', '한마디'],
      apps.map((a) => [
        new Date(a.created_at).toLocaleString('ko-KR'), a.name, a.card?.nickname, a.phone, a.gender, a.age, a.card?.photos.length ?? 0,
        a.selected ? 'O' : '', a.likeCount, matchOf.get(a.id)?.name ?? '', a.memo,
      ])
    );
  };

  const step = NEXT_STEP[event.status];
  const blocked = event.status === 'screening' && !event.publishedAt;

  return (
    <div className="stack stack--lg">
      <div className="vol-tabs" role="tablist" aria-label="이벤트 회차">
        {events.map((ev) => (
          <button key={ev.slug} type="button" role="tab" className="chip" aria-selected={ev.slug === slug} onClick={() => setSlug(ev.slug)}>
            {ev.volNumber}
          </button>
        ))}
      </div>

      <section className="sheet stack">
        <div className="row row--between row--wrap">
          <h2 className="display">{event.volNumber} · {STAGE_LABEL[event.status]}</h2>
          <Link href={`/events/${slug}${event.publishedAt ? '/lineup' : ''}`} target="_blank" className="btn btn--quiet btn--sm">
            <Icon name="external" /> 회원 화면 열기
          </Link>
        </div>
        <StageTimeline event={event} />
        {event.status === 'ongoing' && !event.publishedAt && (
          <p className="notice notice--info">진행중에도 미리 선별해 둘 수 있어요. 진행중 마감까지 선별을 공개하지 않으면, 사진이 있는 신청자 중 남녀 같은 인원을 최대로 무작위 선별해 공개하고 선별중으로 넘어가요.</p>
        )}
        {event.status === 'ongoing' && event.publishedAt && <p className="notice notice--success">선별을 공개해 뒀어요. 진행중이 끝나면 선택 페이지가 열려요.</p>}
        {blocked && <p className="notice notice--info">아래에서 참가자를 선별해 공개하면 회원들이 관심을 보낼 수 있고, 그 뒤에 선택중으로 넘어갈 수 있어요.</p>}
        {step && (
          <button type="button" className="btn btn--ghost" disabled={busy || blocked} onClick={advance}>
            {step.label}
          </button>
        )}
        <p className="hint">마감 시각이 지나면 자동으로 넘어가요. 시각은 이벤트 카드 탭에서 바꿀 수 있어요.</p>
      </section>

      <section className="stats">
        <div className="stat"><div className="stat__label">신청</div><div className="stat__value">{apps.length}<small>명</small></div></div>
        <div className="stat">
          <div className="stat__label">남 / 여 {capacity.male !== null || capacity.female !== null ? '(정원)' : ''}</div>
          <div className="stat__value">
            <span style={{ color: 'var(--male)' }}>{males.length}</span>
            {capacity.male !== null && <small>/{capacity.male}</small>} : <span style={{ color: 'var(--female)' }}>{apps.length - males.length}</span>
            {capacity.female !== null && <small>/{capacity.female}</small>}
          </div>
        </div>
        <div className="stat"><div className="stat__label">선별</div><div className="stat__value">{pickedApps.length}<small>명</small></div></div>
        <div className="stat"><div className="stat__label">관심 / 매칭</div><div className="stat__value">{board.totalLikes}<small>/ {board.matches.length}쌍</small></div></div>
      </section>

      {editable && (
        <section className="panel stack">
          <h3 className="title">선별 도구</h3>
          <label className="check">
            <input type="checkbox" checked={skipNoPhoto} onChange={(e) => applyPhotoFilter(e.target.checked)} />
            <span>프로필 사진이 없는 사람은 거르기 ({apps.filter((a) => !hasPhoto(a)).length}명)</span>
          </label>
          <div className="row row--wrap">
            {(['male', 'female'] as const).map((g) => (
              <label key={g} className="row small">
                {g === 'male' ? '남' : '여'}
                <input className="input" style={{ width: 88 }} type="number" min={0} inputMode="numeric" value={randomCount[g]}
                  onChange={(e) => setRandomCount((c) => ({ ...c, [g]: e.target.value }))} aria-label={`${g === 'male' ? '남성' : '여성'} 뽑을 인원`} />
                명
              </label>
            ))}
            <button type="button" className="btn btn--ghost btn--sm" onClick={pickRandom}>무작위로 뽑기</button>
            <button type="button" className="btn btn--quiet btn--sm" onClick={() => setPicked(new Set())}>모두 해제</button>
          </div>
          <div className="row row--between row--wrap">
            <span className="small muted">
              지금 선택: 남 {pickedApps.filter((a) => isMale(a.gender)).length}명, 여 {pickedApps.filter((a) => !isMale(a.gender)).length}명
            </span>
            <button type="button" className="btn btn--primary" disabled={busy || pickedApps.length === 0} onClick={publish}>
              선별 확정하고 공개
            </button>
          </div>
        </section>
      )}

      <section className="stack">
        <div className="row row--between">
          <h3 className="title">신청자 {apps.length}명</h3>
          <button type="button" className="btn btn--ghost btn--sm" onClick={exportCsv}>
            <Icon name="download" /> CSV
          </button>
        </div>
        {apps.length === 0 && <p className="panel center muted">{event.status === 'ongoing' ? '아직 신청자가 없어요.' : '신청자가 없어요.'}</p>}
        {apps.map((a) => {
          const disabled = !eligible(a);
          const partner = matchOf.get(a.id);
          return (
            <article key={a.id} className="member" style={disabled ? { opacity: 0.55 } : undefined}>
              <div className="member__row">
                <div className="row" style={{ gap: 12, minWidth: 220 }}>
                  {editable && (
                    <input type="checkbox" style={{ width: 22, height: 22, accentColor: 'var(--starlight)' }} checked={picked.has(a.id)} disabled={disabled}
                      onChange={() => toggle(a.id)} aria-label={`${a.name} 선별`} />
                  )}
                  <span className="member__avatar">
                    {a.card?.photos[0] ? <img src={a.card.photos[0]} alt="" /> : <Icon name="user" />}
                  </span>
                  <div>
                    <div className="row row--wrap">
                      <strong>{a.card?.nickname ?? a.name}</strong>
                      <span className="muted small">{a.name}</span>
                      <span className={`tag ${isMale(a.gender) ? 'tag--male' : 'tag--female'}`}>{a.gender}</span>
                      {a.selected && <span className="tag tag--gold">선별</span>}
                    </div>
                    <div className="small muted">{[a.age, a.card?.height && `${a.card.height}cm`, a.card?.location, a.phone].filter(Boolean).join(', ')}</div>
                  </div>
                </div>
                <div className="row row--wrap">
                  {event.publishedAt && a.selected && <span className="tag">관심 {a.likeCount}</span>}
                  {partner && <span className="tag tag--aurora">매칭: {partner.nickname} ({partner.name})</span>}
                  <button type="button" className="btn btn--quiet btn--sm" aria-expanded={expanded === a.id} onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                    {expanded === a.id ? '접기' : '한마디'}
                  </button>
                  {!event.publishedAt && (
                    <button type="button" className="btn btn--danger btn--sm" onClick={() => remove(a)} aria-label={`${a.name} 신청 삭제`}>
                      <Icon name="trash" />
                    </button>
                  )}
                </div>
              </div>
              {expanded === a.id && (
                <div className="member__detail">
                  <p className="memo-quote">{a.memo || '한마디가 없어요.'}</p>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
