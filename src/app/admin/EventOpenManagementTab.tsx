'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { OrbitEvent } from '@/types/event';
import type { EventApplication, EventApplicationStats } from '@/types/application';
import { parseCapacity } from '@/lib/eventCapacity';
import { STATUS_CLASS, STATUS_LABEL, volEnd } from '@/lib/eventLabels';
import { downloadCsv, today } from '@/lib/csv';
import { Icon } from '@/components/ui';

type Status = OrbitEvent['status'];

const APP_STATUS = {
  confirmed: { label: '참석 확정', className: 'tag--aurora' },
  pending: { label: '대기', className: 'tag--gold' },
  cancelled: { label: '취소', className: 'tag--ember' },
} as const;

const isMale = (g: string) => g === '남성' || g === 'male';

export default function EventOpenManagementTab({ onShowToast }: { onShowToast: (msg: string) => void }) {
  const [events, setEvents] = useState<OrbitEvent[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [applications, setApplications] = useState<EventApplication[]>([]);
  const [stats, setStats] = useState<EventApplicationStats | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');

  useEffect(() => {
    fetch('/api/admin/events', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
        setSelectedSlug((s) => s || data.events?.[0]?.slug || '');
      })
      .catch(() => onShowToast('이벤트 목록을 불러오지 못했어요.'));
  }, [onShowToast]);

  const fetchApplications = useCallback(
    (slug: string) =>
      fetch(`/api/admin/events/applications?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          setApplications(data.applications || []);
          setStats(data.stats || null);
        })
        .catch(() => onShowToast('신청자 목록을 불러오지 못했어요.')),
    [onShowToast]
  );

  useEffect(() => {
    if (selectedSlug) void fetchApplications(selectedSlug);
  }, [selectedSlug, fetchApplications]);

  const event = events.find((e) => e.slug === selectedSlug);
  if (!event) return <p className="muted">이벤트를 불러오는 중이거나 등록된 이벤트가 없어요.</p>;

  const changeStatus = async (status: Status) => {
    setIsChanging(true);
    try {
      const data = await (
        await fetch('/api/admin/events/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: event.slug, status }),
        })
      ).json();
      if (!data.success) throw new Error(data.error);
      onShowToast(data.message || '상태를 바꿨어요.');
      setEvents((prev) => prev.map((ev) => (ev.slug === event.slug ? { ...ev, status } : ev)));
    } catch (err) {
      onShowToast(err instanceof Error && err.message ? err.message : '상태를 바꾸지 못했어요.');
    } finally {
      setIsChanging(false);
    }
  };

  const updateApp = async (id: string, status: 'confirmed' | 'cancelled') => {
    const res = await fetch('/api/admin/events/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    }).catch(() => null);
    if (!res?.ok) return onShowToast('신청 상태를 바꾸지 못했어요.');
    onShowToast(`${APP_STATUS[status].label}(으)로 바꿨어요.`);
    fetchApplications(event.slug);
  };

  const deleteApp = async (id: string, name: string) => {
    if (!confirm(`${name}님의 신청을 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/events/applications?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => null);
    if (!res?.ok) return onShowToast('신청을 삭제하지 못했어요.');
    onShowToast('신청을 삭제했어요.');
    fetchApplications(event.slug);
  };

  const q = search.trim().toLowerCase();
  const filtered = applications.filter(
    (a) =>
      (!q || a.name.toLowerCase().includes(q) || a.phone.includes(q)) &&
      (genderFilter === 'all' || isMale(a.gender) === (genderFilter === 'male'))
  );

  const exportCsv = () => {
    if (applications.length === 0) return onShowToast('내려받을 신청자가 없어요.');
    downloadCsv(
      `orbit_${event.slug}_applicants_${today()}.csv`,
      ['신청일시', '이벤트', '이름', '연락처', '성별', '나이', '상태', '한마디'],
      applications.map((a) => [
        a.created_at ? new Date(a.created_at).toLocaleString('ko-KR') : '',
        a.volNumber, a.name, a.phone, a.gender, a.age, APP_STATUS[a.status]?.label || a.status, a.memo,
      ])
    );
    onShowToast('신청자 명단을 CSV로 내려받았어요.');
  };

  const capacity = parseCapacity(event.capacity);
  const seats = (taken: number, limit: number | null) => (limit === null ? `${taken}명` : `${taken} / ${limit}명`);
  const activeMale = applications.filter((a) => isMale(a.gender) && a.status !== 'cancelled').length;
  const activeFemale = applications.filter((a) => !isMale(a.gender) && a.status !== 'cancelled').length;

  const actions: { status: Status; label: string; primary?: boolean }[] =
    event.status === 'ongoing'
      ? [{ status: 'ended', label: `신청 마감 (${volEnd(event.volNumber)})` }, { status: 'upcoming', label: '오픈 전으로 되돌리기' }]
      : event.status === 'ended'
        ? [{ status: 'ongoing', label: '다시 오픈하기', primary: true }, { status: 'upcoming', label: '오픈 전으로 되돌리기' }]
        : [{ status: 'ongoing', label: `${event.volNumber} 오픈하기`, primary: true }, { status: 'ended', label: '바로 종료 처리' }];

  return (
    <div className="stack stack--lg">
      <div className="vol-tabs" role="tablist" aria-label="이벤트 회차">
        {events.map((ev) => (
          <button key={ev.slug} type="button" role="tab" className="chip" aria-selected={ev.slug === selectedSlug}
            onClick={() => setSelectedSlug(ev.slug)}>
            {ev.volNumber}
          </button>
        ))}
      </div>

      <section className="sheet stack">
        <div className="row row--between row--wrap">
          <span className={`status-dot ${STATUS_CLASS[event.status]}`}>
            {event.volNumber} · {STATUS_LABEL[event.status]}
          </span>
          <Link href={`/events/${event.slug}`} target="_blank" className="btn btn--quiet btn--sm">
            <Icon name="external" /> 페이지 열기
          </Link>
        </div>
        <h2 className="display">{event.title}</h2>
        <p className="muted">
          {event.status === 'ongoing'
            ? '지금 누구나 이벤트 페이지에서 신청할 수 있어요.'
            : event.status === 'ended'
              ? `카드에 ${volEnd(event.volNumber)}로 표시되고 새 신청은 받지 않아요.`
              : '오픈 전이에요. 오픈하면 카드가 Now open으로 바뀌고 신청을 받기 시작해요.'}
        </p>
        <div className="row row--wrap">
          {actions.map((a) => (
            <button key={a.status} type="button" className={`btn ${a.primary ? 'btn--primary' : 'btn--ghost'}`} disabled={isChanging} onClick={() => changeStatus(a.status)}>
              {a.label}
            </button>
          ))}
        </div>
      </section>

      {stats && (
        <section className="stats">
          <div className="stat"><div className="stat__label">전체 신청</div><div className="stat__value">{stats.total}<small>명</small></div></div>
          <div className="stat"><div className="stat__label">남성 (취소 제외 / 정원)</div><div className="stat__value" style={{ color: 'var(--male)' }}>{seats(activeMale, capacity.male)}</div></div>
          <div className="stat"><div className="stat__label">여성 (취소 제외 / 정원)</div><div className="stat__value" style={{ color: 'var(--female)' }}>{seats(activeFemale, capacity.female)}</div></div>
          <div className="stat"><div className="stat__label">참석 확정 / 취소</div><div className="stat__value">{stats.confirmed}<small>/ {stats.cancelled}명</small></div></div>
        </section>
      )}

      <section className="stack">
        <div className="row row--between row--wrap">
          <h2 className="title">{event.volNumber} 신청자 ({filtered.length}명)</h2>
          <div className="toolbar">
            <label className="visually-hidden" htmlFor="app-search">신청자 검색</label>
            <input id="app-search" className="input" placeholder="이름, 연락처 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="seg seg--sm" role="group" aria-label="성별 필터">
              {(['all', 'male', 'female'] as const).map((g) => (
                <button key={g} type="button" aria-pressed={genderFilter === g} onClick={() => setGenderFilter(g)}>
                  {g === 'all' ? '전체' : g === 'male' ? '남성' : '여성'}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={exportCsv}>
              <Icon name="download" /> CSV
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="panel center muted">
            {q || genderFilter !== 'all'
              ? '조건에 맞는 신청자가 없어요.'
              : event.status === 'ongoing'
                ? '아직 신청자가 없어요. 신청이 들어오면 여기에 바로 보여요.'
                : '이벤트를 오픈하면 신청을 받을 수 있어요.'}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>신청 일시</th>
                  <th>이름</th>
                  <th>연락처</th>
                  <th>성별 / 나이</th>
                  <th>상태</th>
                  <th style={{ textAlign: 'right' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td className="small muted">{a.created_at ? new Date(a.created_at).toLocaleString('ko-KR') : '-'}</td>
                    <td>
                      <strong>{a.name}</strong>
                      {a.memo && <div className="small muted">{a.memo}</div>}
                    </td>
                    <td>{a.phone}</td>
                    <td>
                      <span className={`tag ${isMale(a.gender) ? 'tag--male' : 'tag--female'}`}>{a.gender || '-'}</span>{' '}
                      <span className="small muted">{a.age || '-'}</span>
                    </td>
                    <td>
                      <span className={`tag ${APP_STATUS[a.status]?.className || ''}`}>{APP_STATUS[a.status]?.label || a.status}</span>
                    </td>
                    <td>
                      <div className="row" style={{ justifyContent: 'flex-end' }}>
                        {a.status !== 'confirmed' && (
                          <button type="button" className="btn btn--success btn--sm" onClick={() => updateApp(a.id, 'confirmed')}>확정</button>
                        )}
                        {a.status !== 'cancelled' && (
                          <button type="button" className="btn btn--ghost btn--sm" onClick={() => updateApp(a.id, 'cancelled')}>취소</button>
                        )}
                        <button type="button" className="btn btn--danger btn--sm" onClick={() => deleteApp(a.id, a.name)} aria-label={`${a.name} 신청 삭제`}>
                          <Icon name="trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
