'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { OrbitEvent } from '@/types/event';
import { describeCapacity } from '@/lib/eventCapacity';
import { KAKAO_CHANNEL_URL, STATUS_CLASS, STATUS_LABEL, volEnd } from '@/lib/eventLabels';
import EventPlate from '@/components/EventPlate';
import { StageTimeline, postAction, useEventBoard } from '@/components/eventBoard';
import { Icon, Modal, OrbitMark, Toast } from '@/components/ui';

const MEMO_MIN = 30;
const MEMO_GOAL = 300;
const MEMO_MAX = 1000;

const MEMO_PROMPTS = ['이번 만남에서 가장 기대하는 것', '나를 잘 보여주는 요즘의 하루', '처음 만난 상대에게 꼭 전하고 싶은 말'];

export default function EventDetailClient({ event: initialEvent }: { event: OrbitEvent }) {
  const { board, reload } = useEventBoard(initialEvent.slug);
  const event = board?.event ?? initialEvent;
  const viewer = board?.viewer;

  const [toast, setToast] = useState<string | null>(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [memo, setMemo] = useState('');

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
    const text = memo.trim();
    if (text.length < MEMO_MIN) return setApplyError(`한마디를 ${MEMO_MIN}자 이상 써주세요. 지금 ${text.length}자예요.`);
    setIsApplying(true);
    setApplyError('');
    const error = await postAction(`/api/events/${event.slug}/apply`, { memo: text });
    setIsApplying(false);
    if (error) return setApplyError(error);
    setIsApplyOpen(false);
    setToast('신청했어요. 선별 결과는 선별중 단계에서 공개돼요.');
    void reload();
  };

  const lineupHref = `/events/${event.slug}/lineup`;
  const length = memo.trim().length;

  const cta = (() => {
    if (viewer && !viewer.applied && event.status !== 'upcoming' && event.status !== 'ongoing') {
      return <p className="notice notice--info">신청을 마감했어요. 선택 페이지는 이번 회차 신청자만 볼 수 있어요.</p>;
    }
    switch (event.status) {
      case 'upcoming':
        return (
          <a className="btn btn--primary btn--block" href={KAKAO_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
            <Icon name="bell" /> 오픈 알림 받기 (카카오톡 채널)
          </a>
        );
      case 'ongoing':
        if (!viewer) return null;
        if (!viewer.loggedIn) return <Link href="/" className="btn btn--primary btn--block">휴대폰 인증하고 신청하기</Link>;
        if (!viewer.hasProfile) return <Link href="/" className="btn btn--primary btn--block">프로필 등록하고 신청하기</Link>;
        if (viewer.applied) {
          return (
            <button type="button" className="btn btn--ghost btn--block" disabled>
              <Icon name="check" /> 신청 완료 · 선별 결과를 기다려주세요
            </button>
          );
        }
        return (
          <button type="button" className="btn btn--primary btn--block" onClick={() => setIsApplyOpen(true)}>
            {event.volNumber} 참가 신청하기
          </button>
        );
      case 'screening':
        return event.publishedAt ? (
          <Link href={lineupHref} className="btn btn--primary btn--block">
            {viewer?.selected ? '선별되셨어요 · 받은 관심 확인하기' : '선별된 사람들 보러 가기'}
          </Link>
        ) : (
          <p className="notice notice--info">신청을 마감하고 선별하고 있어요. 선별이 공개되면 이곳에서 선택 페이지가 열려요.</p>
        );
      case 'choosing':
        return (
          <Link href={lineupHref} className="btn btn--primary btn--block">
            {viewer?.selected ? '받은 관심 중 한 명 고르기' : '선택 페이지 보기'}
          </Link>
        );
      default:
        return <Link href={lineupHref} className="btn btn--ghost btn--block">결과 보기</Link>;
    }
  })();

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
          {event.volNumber} · {event.status === 'ended' ? volEnd(event.volNumber) : STATUS_LABEL[event.status]}
        </span>
        <h1 className="display display--lg">{event.title}</h1>
        {event.subtitle && <p className="lede">{event.subtitle}</p>}
      </header>

      <EventPlate event={event} hideTitle />

      {event.status !== 'upcoming' && <StageTimeline event={event} />}

      <dl className="sheet stack">
        <div className="spec">
          <Icon name="calendar" />
          <dt>일시</dt>
          <dd>{event.date || '추후 공개'}</dd>
        </div>
        <hr className="divider" />
        <div className="spec">
          <Icon name="pin" />
          <dt>장소</dt>
          <dd>{event.location || '매칭된 두 분께 따로 안내'}</dd>
        </div>
        <hr className="divider" />
        <div className="spec">
          <Icon name="users" />
          <dt>모집 인원</dt>
          <dd>{describeCapacity(event.capacity)}</dd>
        </div>
      </dl>

      <section className="stack">
        <h2 className="title">이렇게 진행돼요</h2>
        <ol className="small muted stack" style={{ paddingLeft: 18, gap: 6 }}>
          <li><strong className="label">진행중</strong> 프로필과 한마디로 신청해요.</li>
          <li><strong className="label">선별중</strong> Orbit이 참가자를 선별해 공개하고, 회원들은 마음에 드는 한 사람에게 관심을 보내요. 선별된 분은 선택 페이지에서 관심을 보낸 사람의 프로필을 바로 확인할 수 있어요.</li>
          <li><strong className="label">선택중</strong> 선별된 분은 관심을 보낸 사람 중 한 명을 골라요.</li>
          <li><strong className="label">종료</strong> 서로 연결된 두 분에게 상대의 연락처가 담긴 카드가 전달돼요.</li>
        </ol>
      </section>

      {(event.content || event.description) && (
        <section className="stack">
          <h2 className="title">이벤트 안내</h2>
          <p className="pre muted">{event.content || event.description}</p>
        </section>
      )}

      <section className="panel stack">
        <h2 className="label row">
          <Icon name="shield" /> 안심하고 참여하세요
        </h2>
        <ul className="small muted" style={{ paddingLeft: 18 }}>
          <li>휴대폰 인증을 마친 회원만 신청하고 관심을 보낼 수 있어요.</li>
          <li>매칭 전까지 실명과 연락처는 누구에게도 공개되지 않아요.</li>
          <li>관심과 선택은 각각 한 번뿐이에요. 1:1 만남이 원칙이에요.</li>
        </ul>
      </section>

      <div className="stack">
        {cta}
        <Link href="/" className="btn btn--quiet btn--block">
          내 프로필로 가기
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
            <button type="submit" form="apply-form" className="btn btn--primary" disabled={isApplying || length < MEMO_MIN}>
              {isApplying ? '신청하는 중' : '이 글로 신청하기'}
            </button>
          </>
        }
      >
        <form id="apply-form" className="stack stack--lg" onSubmit={submit} noValidate>
          <p className="muted small">이름, 연락처, 성별, 나이는 인증된 내 프로필로 자동으로 들어가요. 쓰실 건 한마디 하나예요.</p>
          <p className="notice notice--info">
            <strong>선별은 한마디를 가장 중요하게 봐요.</strong> 한두 줄짜리 글은 선별되기 어려워요. 선별되면 이 글이 선택 페이지의 내 카드에 함께 실려서,
            다른 회원이 나를 고르는 이유가 돼요.
          </p>
          <div className="stack">
            <p className="small muted">무엇을 쓸지 막막하다면</p>
            <ul className="small muted" style={{ paddingLeft: 18 }}>
              {MEMO_PROMPTS.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
          {applyError && <p className="notice notice--error" role="alert">{applyError}</p>}
          <div className="field">
            <label className="label" htmlFor="apply-memo">
              한마디<span className="req" aria-hidden="true">*</span>
            </label>
            <textarea
              id="apply-memo"
              className="textarea"
              rows={8}
              maxLength={MEMO_MAX}
              placeholder="천천히, 나다운 말로 적어주세요."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
            <div className="counter">
              <span>{length < MEMO_MIN ? `${MEMO_MIN - length}자 더 쓰면 신청할 수 있어요` : length < MEMO_GOAL ? `${MEMO_GOAL}자 넘게 쓰면 정성이 잘 전해져요` : '충분히 정성스러워요'}</span>
              <span>{length} / {MEMO_MAX}자</span>
            </div>
          </div>
        </form>
      </Modal>

      <Toast message={toast} />
    </main>
  );
}
