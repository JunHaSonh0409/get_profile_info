/** upcoming → ongoing (신청) → screening (선별·관심) → choosing (선택) → ended */
export type EventStatus = 'upcoming' | 'ongoing' | 'screening' | 'choosing' | 'ended';

export interface OrbitEvent {
  id: string; // e.g. 'vol01'
  slug: string; // e.g. 'vol01'
  volNumber: string; // e.g. 'VOL.01'
  title: string;
  subtitle: string;
  status: EventStatus;
  imageUrl?: string;
  dDayText?: string;
  badgeText?: string;
  description?: string;
  date?: string;
  location?: string;
  capacity?: string;
  content?: string;
  /** End of 진행중: applications close and the event moves to 선별중. */
  applyEndsAt?: string | null;
  /** End of the like window in 선별중 (only after the lineup is published). */
  likeEndsAt?: string | null;
  /** End of 선택중: the event moves to 종료. */
  chooseEndsAt?: string | null;
  /** When the admin published the selected lineup. */
  publishedAt?: string | null;
  created_at?: string;
  updated_at?: string;
}
