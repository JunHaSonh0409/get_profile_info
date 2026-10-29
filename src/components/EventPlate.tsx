import Link from 'next/link';
import type { OrbitEvent } from '@/types/event';
import { STATUS_CLASS, STATUS_LABEL, plateHeadline } from '@/lib/eventLabels';

type PlateEvent = Pick<OrbitEvent, 'status' | 'volNumber' | 'title' | 'imageUrl'> & { slug?: string };

/** Shown on every event card that has no poster yet. */
export const UNREVEALED_ART = '/images/event-galaxy.png';

/** The event "star plate": the poster if one is set, otherwise the dimmed galaxy artwork. */
export default function EventPlate({ event, href, hideTitle }: { event: PlateEvent; href?: string; hideTitle?: boolean }) {
  const body = (
    <>
      {event.imageUrl ? (
        <img className="plate__poster" src={event.imageUrl} alt="" />
      ) : (
        <img className="plate__poster plate__poster--art" src={UNREVEALED_ART} alt="" />
      )}
      <div className={`plate__shade${event.imageUrl ? '' : ' plate__shade--deep'}`} />
      <div className="plate__top">
        <span>Orbit {event.volNumber}</span>
        <span className={`status-dot ${STATUS_CLASS[event.status]}`}>{STATUS_LABEL[event.status]}</span>
      </div>
      <div className="plate__foot">
        <span
          className={`plate__status${event.status === 'ongoing' ? ' plate__status--open' : event.status === 'ended' ? ' plate__status--ended' : ''}`}
        >
          {plateHeadline(event)}
        </span>
        {!hideTitle && <span className="title">{event.title}</span>}
      </div>
    </>
  );

  const className = 'plate';
  return href ? (
    <Link href={href} className={className} aria-label={`${event.volNumber} ${event.title} 자세히 보기`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
