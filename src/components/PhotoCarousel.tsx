'use client';

import { useRef, type ReactNode, type TouchEvent } from 'react';
import { Icon } from './ui';

const SWIPE_PX = 40;

/** 3:4 photo frame with prev/next buttons, swipe, dots and a counter. Empty -> renders children. */
export default function PhotoCarousel({ photos, alt, index, onIndex, children }: {
  photos: string[];
  alt: string;
  index: number;
  onIndex: (i: number) => void;
  children?: ReactNode;
}) {
  const startX = useRef<number | null>(null);
  const count = photos.length;
  const step = (delta: number) => onIndex((index + delta + count) % count);

  const onTouchEnd = (e: TouchEvent) => {
    if (startX.current === null || count < 2) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > SWIPE_PX) step(dx > 0 ? -1 : 1);
    startX.current = null;
  };

  if (count === 0) return <div className="ticket__photo">{children}</div>;

  return (
    <div
      className="ticket__photo"
      onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
    >
      <img src={photos[index]} alt={`${alt} ${index + 1}`} />
      {count > 1 && (
        <>
          <button type="button" className="carousel-btn carousel-btn--prev" aria-label="이전 사진" onClick={(e) => { e.stopPropagation(); step(-1); }}>
            <Icon name="back" />
          </button>
          <button type="button" className="carousel-btn carousel-btn--next" aria-label="다음 사진" onClick={(e) => { e.stopPropagation(); step(1); }}>
            <Icon name="next" />
          </button>
          <div className="carousel-dots" aria-hidden="true">
            {photos.map((p, i) => <span key={p + i} data-active={i === index} />)}
          </div>
        </>
      )}
      <span className="carousel-count">
        {index + 1} / {count}
      </span>
    </div>
  );
}

