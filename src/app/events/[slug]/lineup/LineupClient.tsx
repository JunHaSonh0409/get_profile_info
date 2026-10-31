'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LIKE_MESSAGE_MAX, STATUS_CLASS, STATUS_LABEL } from '@/lib/eventLabels';
import { formatDeadline, likesOpen } from '@/lib/eventStages';
import PublicProfileCard from '@/components/PublicProfileCard';
import { StageTimeline, postAction, useEventBoard } from '@/components/eventBoard';
import { Icon, Modal, OrbitMark } from '@/components/ui';

const REFRESH_MS = 30_000;

type Pending = { kind: 'like' | 'choose'; id: string; nickname: string } | null;

export default function LineupClient({ slug }: { slug: string }) {
  const { board, error, reload } = useEventBoard(slug);
  const [pending, setPending] = useState<Pending>(null);
  const [isSending, setIsSending] = useState(false);
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');

  // Selected participants watch likes arrive here; refresh while the tab is visible.
  const watching = Boolean(board?.viewer.selected) && board?.event.status === 'screening';
  useEffect(() => {
    if (!watching) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void reload();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [watching, reload]);

  const confirm = async () => {
    if (!pending) return;
    setIsSending(true);
    setActionError('');
    const err =
      pending.kind === 'like'
        ? await postAction(`/api/events/${slug}/like`, { applicationId: pending.id, message })
        : await postAction(`/api/events/${slug}/choose`, { likeId: pending.id });
    setIsSending(false);
    if (err) return setActionError(err);
    setPending(null);
    setMessage('');
    void reload();
  };

  const chrome = (
    <div className="topbar">
      <Link href={`/events/${slug}`} className="icon-btn" aria-label="이벤트로 돌아가기">
        <Icon name="back" />
      </Link>
      <span className="brand">
        <OrbitMark /> Orbit
      </span>
      <span style={{ width: 44 }} />
    </div>
  );

  if (!board) {
    return (
      <main className="shell">
        {chrome}
        <p className={error ? 'notice notice--error' : 'center muted'} role="status">{error || '불러오는 중'}</p>
      </main>
    );
  }

  const { event, viewer, lineup, incoming, match } = board;
  const canLike = likesOpen(event) && viewer.selected && !viewer.likedId;

  let gate: React.ReactNode = null;
  if (!viewer.loggedIn) gate = <><p className="lede">휴대폰 인증을 한 Orbit 회원만 볼 수 있어요.</p><Link href="/" className="btn btn--primary btn--block">휴대폰 인증하기</Link></>;
  else if (!viewer.hasProfile) gate = <><p className="lede">프로필을 등록한 회원만 볼 수 있어요.</p><Link href="/" className="btn btn--primary btn--block">프로필 등록하기</Link></>;
  else if (!viewer.applied) gate = <p className="lede">이번 회차에 신청한 분만 볼 수 있어요.</p>;
  else if (!event.publishedAt) gate = <p className="lede">아직 선별된 참가자가 공개되지 않았어요.</p>;

  return (
    <main className="shell">
      {chrome}

      <header className="stack">
        <span className={`status-dot ${STATUS_CLASS[event.status]}`}>{event.volNumber} · {STATUS_LABEL[event.status]}</span>
        <h1 className="display">{event.title}</h1>
      </header>
      <StageTimeline event={event} />

      {gate ? (
        <section className="sheet stack">{gate}</section>
      ) : (
        <>
          {match && (
            <section className="stack">
              <h2 className="display">인연이 닿았어요</h2>
              <p className="lede">서로를 선택한 분의 연락처예요. 먼저 반갑게 인사해보세요.</p>
              <PublicProfileCard card={match} phone={match.phone} />
            </section>
          )}
          {event.status === 'ended' && !match && (
            <p className="notice notice--info">이번 이벤트는 마무리됐어요. 이번엔 인연이 닿지 않았지만, 다음 회차에서 다시 만나요.</p>
          )}

          {viewer.selected && (
            <section className="stack">
              <div className="row row--between">
                <h2 className="title">나에게 관심을 보낸 사람 {incoming.length}명</h2>
                {event.status !== 'ended' && (
                  <button type="button" className="btn btn--quiet btn--sm" onClick={() => void reload()}>
                    <Icon name="refresh" /> 새로고침
                  </button>
                )}
              </div>
              <p className="muted small">
                {event.status === 'choosing'
                  ? viewer.chosenId
                    ? '선택을 마쳤어요. 종료되면 서로의 연락처가 담긴 카드가 전달돼요.'
                    : `이 중 한 명을 골라주세요. 선택은 한 번뿐이고, ${formatDeadline(event.chooseEndsAt)}까지예요.`
                  : event.status === 'screening'
                    ? '선별되셨어요. 관심을 보낸 분의 프로필이 이곳에 바로 쌓여요(실명과 연락처는 보이지 않아요). 선택중 단계가 되면 이 중 한 명을 고를 수 있어요.'
                    : ''}
              </p>
              {incoming.length === 0 && <p className="panel muted center">아직 도착한 관심이 없어요.</p>}
              {incoming.map((card) => (
                <PublicProfileCard
                  key={card.id}
                  card={card}
                  note={card.message}
                  action={
                    viewer.chosenId === card.id ? (
                      <span className="tag tag--gold"><Icon name="check" /> 내가 고른 사람</span>
                    ) : event.status === 'choosing' && !viewer.chosenId ? (
                      <button type="button" className="btn btn--primary btn--block" onClick={() => setPending({ kind: 'choose', id: card.id, nickname: card.nickname })}>
                        이 분과 만날래요
                      </button>
                    ) : null
                  }
                />
              ))}
            </section>
          )}

          {event.status !== 'ended' && (
            <section className="stack">
              <h2 className="title">선별된 사람들</h2>
              <p className="muted small">
                {likesOpen(event)
                  ? !viewer.selected
                    ? '이번 회차에 선별된 참가자끼리만 관심을 주고받을 수 있어요. 프로필은 둘러볼 수 있어요.'
                    : viewer.likedId
                    ? '관심을 보냈어요. 상대가 선택중 단계에서 나를 고르면 종료 때 연락처가 전달돼요.'
                    : `마음에 드는 한 사람에게만 짧은 한마디와 함께 관심을 보낼 수 있어요. ${formatDeadline(event.likeEndsAt)}까지예요.`
                  : '관심 보내기 기간이 끝났어요.'}
              </p>
              {lineup.length === 0 && <p className="panel muted center">이번 회차에 볼 수 있는 이성 참가자가 없어요.</p>}
              {lineup.map((card) => (
                <PublicProfileCard
                  key={card.id}
                  card={card}
                  action={
                    viewer.likedId === card.id ? (
                      <span className="tag tag--gold"><Icon name="star" /> 관심을 보낸 사람</span>
                    ) : canLike ? (
                      <button type="button" className="btn btn--primary btn--block" onClick={() => {
                        setMessage('');
                        setPending({ kind: 'like', id: card.id, nickname: card.nickname });
                      }}>
                        <Icon name="star" /> 관심있어요
                      </button>
                    ) : null
                  }
                />
              ))}
            </section>
          )}
        </>
      )}

      <Modal
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        locked={isSending}
        title={pending?.kind === 'like' ? '관심을 보낼까요?' : '이 분을 선택할까요?'}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setPending(null)} disabled={isSending}>취소</button>
            <button type="button" className="btn btn--primary" onClick={confirm} disabled={isSending}>
              {isSending ? '보내는 중' : pending?.kind === 'like' ? '관심 보내기' : '선택하기'}
            </button>
          </>
        }
      >
        {pending && (
          <p>
            <strong>{pending.nickname}</strong>님에게{' '}
            {pending.kind === 'like'
              ? '관심을 보내요. 이번 회차에서 관심은 한 번만 보낼 수 있고 취소할 수 없어요.'
              : '만나고 싶다고 전해요. 선택은 한 번뿐이고 취소할 수 없어요. 종료되면 서로의 연락처가 전달돼요.'}
          </p>
        )}
        {pending?.kind === 'like' && (
          <div className="field">
            <label className="label" htmlFor="like-message">
              {pending.nickname}님에게 한마디<span className="opt">선택</span>
            </label>
            <textarea
              id="like-message"
              className="textarea textarea--short"
              rows={3}
              maxLength={LIKE_MESSAGE_MAX}
              placeholder="프로필에서 마음이 간 부분을 짧게 전해보세요."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
            />
            <div className="counter">
              <span>실명과 연락처 없이 이 한마디만 전달돼요</span>
              <span>{message.length} / {LIKE_MESSAGE_MAX}자</span>
            </div>
          </div>
        )}
        {actionError && <p className="notice notice--error" role="alert">{actionError}</p>}
      </Modal>
    </main>
  );
}
