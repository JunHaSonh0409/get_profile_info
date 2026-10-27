'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { OrbitEvent } from '@/types/event';
import { describeCapacity } from '@/lib/eventCapacity';
import { KAKAO_CHANNEL_URL, STATUS_CLASS, STATUS_LABEL, volEnd } from '@/lib/eventLabels';
import { digitsOnly, formatPhone } from '@/lib/format';
import EventPlate from '@/components/EventPlate';
import { Field, Icon, Modal, OrbitMark, Toast } from '@/components/ui';

type Gender = '남성' | '여성';

export default function EventDetailClient({ event: initialEvent }: { event: OrbitEvent }) {
  const [event, setEvent] = useState(initialEvent);
  const [toast, setToast] = useState<string | null>(null);

  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [justApplied, setJustApplied] = useState(false);
  const [applyError, setApplyError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [age, setAge] = useState('');
  const [memo, setMemo] = useState('');

  const appliedKey = `applied_event_${event.slug}`;

  useEffect(() => {
    // Prefill from this device's login and any unfinished profile draft.
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read of browser storage on mount */
    setIsApplied(localStorage.getItem(appliedKey) === 'true');
    setPhone(formatPhone(localStorage.getItem('orbit_auth_phone') || ''));
    try {
      const draft = JSON.parse(localStorage.getItem('profile_form_draft') || '{}');
      if (draft.name) setName(draft.name);
      if (draft.gender === '남성' || draft.gender === '여성') setGender(draft.gender);
      if (draft.age) setAge(String(draft.age));
    } catch {
      // ignore a corrupt draft
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    fetch('/api/events', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        const fresh = data.events?.find((e: OrbitEvent) => e.slug === initialEvent.slug);
        if (fresh) setEvent(fresh);
      })
      .catch(() => {});
  }, [appliedKey, initialEvent.slug]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const share = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setToast('이벤트 링크를 복사했어요.');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setApplyError('');
    if (!name.trim()) return setApplyError('이름을 입력해주세요.');
    if (digitsOnly(phone).length < 10) return setApplyError('휴대폰 번호를 정확히 입력해주세요.');
    if (!gender) return setApplyError('성별을 골라주세요.');

    setIsApplying(true);
    try {
      const res = await fetch('/api/events/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventSlug: event.slug, name: name.trim(), phone, gender, age: age.trim(), memo: memo.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '신청하지 못했어요.');
      localStorage.setItem(appliedKey, 'true');
      localStorage.setItem('orbit_auth_phone', digitsOnly(phone));
      setIsApplied(true);
      setJustApplied(true);
      setIsApplyOpen(false);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : '네트워크 오류로 신청하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsApplying(false);
    }
  };

  const isOpen = event.status === 'ongoing';
  const isEnded = event.status === 'ended';

  return (
    <main className="shell">
      <div className="topbar">
        <Link href="/" className="icon-btn" aria-label="홈으로">
          <Icon name="back" />
        </Link>
        <span className="brand">
          <OrbitMark /> Orbit
        </span>
        <button type="button" className="icon-btn" onClick={share} aria-label="링크 복사">
          <Icon name="link" />
        </button>
      </div>

      <header className="stack">
        <span className={`status-dot ${STATUS_CLASS[event.status]}`}>
          {event.volNumber} · {isEnded ? volEnd(event.volNumber) : STATUS_LABEL[event.status]}
        </span>
        <h1 className="display display--lg">{event.title}</h1>
        {event.subtitle && <p className="lede">{event.subtitle}</p>}
      </header>

      {justApplied && (
        <p className="notice notice--success" role="status">
          {name}님의 신청이 접수됐어요. 성비 조율과 선정이 끝나면 {formatPhone(phone)}로 따로 안내드릴게요.
        </p>
      )}

      <EventPlate event={event} hideTitle />

      <dl className="sheet stack">
        <div className="spec">
          <Icon name="calendar" />
          <dt>일시</dt>
          <dd>{event.date || (isOpen ? '지금 신청 받는 중' : '추후 공개')}</dd>
        </div>
        <hr className="divider" />
        <div className="spec">
          <Icon name="pin" />
          <dt>장소</dt>
          <dd>{event.location || '선정된 분께 개별 안내'}</dd>
        </div>
        <hr className="divider" />
        <div className="spec">
          <Icon name="users" />
          <dt>모집 인원</dt>
          <dd>{describeCapacity(event.capacity)}</dd>
        </div>
      </dl>

      <section className="stack">
        <h2 className="title">이벤트 안내</h2>
        <p className="pre muted">{event.content || event.description || '이벤트를 준비하고 있어요.'}</p>
      </section>

      <section className="panel stack">
        <h2 className="label row">
          <Icon name="shield" /> 안심하고 참여하세요
        </h2>
        <ul className="small muted" style={{ paddingLeft: 18 }}>
          <li>프로필 검증과 본인 확인을 마친 회원만 참석해요.</li>
          <li>매칭 전까지 연락처와 실명은 공개되지 않아요.</li>
          <li>노쇼를 막기 위해 사전 예약제로 운영해요.</li>
        </ul>
      </section>

      <div className="stack">
        {isOpen &&
          (isApplied ? (
            <button type="button" className="btn btn--ghost btn--block" disabled>
              <Icon name="check" /> 신청 완료
            </button>
          ) : (
            <button type="button" className="btn btn--primary btn--block" onClick={() => setIsApplyOpen(true)}>
              {event.volNumber} 참가 신청하기
            </button>
          ))}
        {isEnded && (
          <button type="button" className="btn btn--ghost btn--block" disabled>
            종료된 이벤트예요
          </button>
        )}
        {!isOpen && !isEnded && (
          <a className="btn btn--primary btn--block" href={KAKAO_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
            <Icon name="bell" /> 오픈 알림 받기 (카카오톡 채널)
          </a>
        )}
        <Link href="/" className="btn btn--quiet btn--block">
          프로필 등록하러 가기
        </Link>
      </div>

      <Modal
        open={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        locked={isApplying}
        title={`${event.volNumber} 참가 신청`}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setIsApplyOpen(false)} disabled={isApplying}>
              취소
            </button>
            <button type="submit" form="apply-form" className="btn btn--primary" disabled={isApplying}>
              {isApplying ? '신청하는 중' : '신청하기'}
            </button>
          </>
        }
      >
        <form id="apply-form" className="stack stack--lg" onSubmit={submit} noValidate>
          {applyError && <p className="notice notice--error" role="alert">{applyError}</p>}
          <Field label="이름" htmlFor="apply-name" required>
            <input id="apply-name" className="input" autoComplete="name" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="휴대폰 번호" htmlFor="apply-phone" required>
            <input id="apply-phone" className="input" type="tel" inputMode="numeric" autoComplete="tel" placeholder="010-0000-0000"
              value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
          </Field>
          <div className="grid-2">
            <Field label="성별" required>
              <div className="seg seg--sm" role="group" aria-label="성별">
                {(['남성', '여성'] as const).map((g) => (
                  <button key={g} type="button" aria-pressed={gender === g} onClick={() => setGender(g)}>
                    {g}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="나이" htmlFor="apply-age" optional>
              <input id="apply-age" className="input" placeholder="28세" value={age} onChange={(e) => setAge(e.target.value)} />
            </Field>
          </div>
          <Field label="한마디" htmlFor="apply-memo" optional>
            <textarea id="apply-memo" className="textarea" rows={2} style={{ minHeight: 80 }} placeholder="참가 계기나 바라는 만남을 적어주세요."
              value={memo} onChange={(e) => setMemo(e.target.value)} />
          </Field>
          <p className="hint row">
            <Icon name="lock" /> 신청 정보는 본인 확인과 참가자 선정에만 써요.
          </p>
        </form>
      </Modal>

      <Toast message={toast} />
    </main>
  );
}
