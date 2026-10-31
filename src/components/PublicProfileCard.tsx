'use client';

import { useState, type ReactNode } from 'react';
import type { PublicCard } from '@/types/application';
import { formatPhone } from '@/lib/format';
import PhotoCarousel from './PhotoCarousel';
import { Icon } from './ui';

/**
 * A member's card as other members see it. `phone` is passed only for a confirmed match;
 * `note` is the short message they sent along with their "관심있어요".
 */
export default function PublicProfileCard({ card, phone, note, action }: { card: PublicCard; phone?: string; note?: string; action?: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  return (
    <article className="sheet stack">
      <PhotoCarousel photos={card.photos} alt={`${card.nickname}의 사진`} index={index} onIndex={setIndex}>
        <div className="photo-empty">
          <Icon name="user" />
          <p className="hint">등록된 사진이 없어요</p>
        </div>
      </PhotoCarousel>

      <div className="row row--between row--wrap">
        <h3 className="display">{card.nickname}</h3>
        {card.mbti && <span className="tag tag--gold">{card.mbti}</span>}
      </div>
      <p className="muted">{[card.age, card.height && `${card.height}cm`, card.location].filter(Boolean).join(', ')}</p>

      {phone && (
        <a className="btn btn--primary btn--block" href={`tel:${phone}`}>
          <Icon name="phone" /> {formatPhone(phone)}
        </a>
      )}

      {note && (
        <figure className="like-note">
          <figcaption className="like-note__from">
            <Icon name="star" /> {card.nickname}님이 보낸 한마디
          </figcaption>
          <blockquote className="like-note__text">{note}</blockquote>
        </figure>
      )}

      {card.memo && <p className="memo-quote">{card.memo}</p>}

      <button type="button" className="btn btn--quiet" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? '프로필 접기' : '프로필 자세히'}
      </button>
      {open && (
        <dl className="facts panel">
          <div className="fact fact--block"><dt>나에 대하여</dt><dd>{card.selfIntro}</dd></div>
          <div className="fact fact--block"><dt>바라는 사람</dt><dd>{card.preferredPartnerDetail}</dd></div>
          {card.preferredAnimals.length > 0 && (
            <div className="fact fact--block">
              <dt>끌리는 인상</dt>
              <dd className="chips">{card.preferredAnimals.map((a) => <span key={a} className="tag">{a}</span>)}</dd>
            </div>
          )}
        </dl>
      )}

      {action}
    </article>
  );
}
