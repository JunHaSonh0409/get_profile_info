import { randomInt } from 'crypto';
import { FlowError } from '@/lib/errors';
import type { EventStatus, OrbitEvent } from '@/types/event';
import type { PublicCard } from '@/types/application';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAllEvents, getEventBySlug, updateEvent } from '@/lib/events';
import { MEMO_MAX, MEMO_MIN, countByGender, findApplication, insertApplication, listApplications, setSelection, toPublicCard } from '@/lib/applications';
import { findProfileByPhone } from '@/lib/profiles';
import { parseCapacity } from '@/lib/eventCapacity';
import { DEFAULT_DAYS, STAGE_ORDER, addDays, dueStatus, likesOpen, lineupVisible } from '@/lib/eventStages';
import { clip, sendAlimtalk } from '@/lib/notify';
import { LIKE_MESSAGE_MAX } from '@/lib/eventLabels';

// The event lifecycle: auto transitions, applying, the admin's selection, likes, the final pick and
// the match reveal. Every member action is keyed on the phone from the verified session cookie.

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped Supabase rows
type Row = Record<string, any>;

const db = () => createServerSupabaseClient();
const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://get-profile-info.vercel.app').replace(/\/$/, '');
const lineupUrl = (slug: string) => `${siteUrl()}/events/${slug}/lineup`;

/* ---------------- stage transitions ---------------- */

/** Fields to set when an event enters a stage without its deadline prefilled. */
function entryDefaults(event: OrbitEvent, status: EventStatus): Partial<OrbitEvent> {
  const now = new Date();
  if (status === 'ongoing' && !event.applyEndsAt) return { applyEndsAt: addDays(now, DEFAULT_DAYS.apply) };
  if (status === 'choosing' && !event.chooseEndsAt) return { chooseEndsAt: addDays(now, DEFAULT_DAYS.choose) };
  return {};
}

async function enterStage(event: OrbitEvent, status: EventStatus, onlyIfStatus?: EventStatus): Promise<OrbitEvent> {
  const fields = { status, ...entryDefaults(event, status) };
  let query = db().from('events').update({
    status,
    apply_ends_at: fields.applyEndsAt ?? event.applyEndsAt ?? null,
    choose_ends_at: fields.chooseEndsAt ?? event.chooseEndsAt ?? null,
    updated_at: new Date().toISOString(),
  }).eq('slug', event.slug);
  // Auto transitions only fire if nobody moved the event in the meantime, so side effects run once.
  if (onlyIfStatus) query = query.eq('status', onlyIfStatus);
  const { data, error } = await query.select('slug');
  if (error) throw new Error(error.message);
  const updated = { ...event, ...fields };
  const moved = data.length > 0;
  if (moved && status === 'ended') await notifyMatches(event.slug);
  // Applications closed by the deadline without a published lineup: select automatically.
  // A manual close (no onlyIfStatus) leaves the selection to the admin.
  if (moved && onlyIfStatus && status === 'screening' && !event.publishedAt) return autoSelect(updated);
  return updated;
}

/** Applies due transitions one stage at a time, so each stage's entry effects run. */
async function catchUp(event: OrbitEvent): Promise<OrbitEvent> {
  let current = event;
  while (dueStatus(current) !== current.status) {
    const next = STAGE_ORDER[STAGE_ORDER.indexOf(current.status) + 1];
    current = await enterStage(current, next, current.status);
  }
  return current;
}

/** Unbiased shuffle with a CSPRNG (selection must not be predictable). */
function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Picks the largest equal number of men and women at random among applicants with a photo,
 * publishes them and opens the like window. Leaves the event unpublished if either side is empty.
 */
async function autoSelect(event: OrbitEvent): Promise<OrbitEvent> {
  const withPhoto = (await listApplications(event.slug)).filter((a) => a.card && a.card.photos.length > 0);
  const men = withPhoto.filter((a) => a.gender === '남성');
  const women = withPhoto.filter((a) => a.gender === '여성');
  const n = Math.min(men.length, women.length);
  if (n === 0) {
    console.warn(`[auto-select] ${event.slug}: no balanced pair with photos (men ${men.length}, women ${women.length}); left for manual selection.`);
    return event;
  }
  const chosen = [...shuffle(men).slice(0, n), ...shuffle(women).slice(0, n)].map((a) => a.id);
  await setSelection(event.slug, chosen);
  const now = new Date();
  const likeEndsAt = event.likeEndsAt && new Date(event.likeEndsAt) > now ? event.likeEndsAt : addDays(now, DEFAULT_DAYS.like);
  console.info(`[auto-select] ${event.slug}: published ${n} men and ${n} women.`);
  return updateEvent(event.slug, { publishedAt: now.toISOString(), likeEndsAt });
}

/** All events with deadline-based transitions applied. */
export async function resolveEvents(): Promise<OrbitEvent[]> {
  return Promise.all((await getAllEvents()).map(catchUp));
}

export async function resolveEvent(slug: string): Promise<OrbitEvent | null> {
  const event = await getEventBySlug(slug);
  return event ? catchUp(event) : null;
}

async function requireEvent(slug: string): Promise<OrbitEvent> {
  const event = await resolveEvent(slug);
  if (!event) throw new FlowError('존재하지 않는 이벤트예요.', 404);
  return event;
}

async function requireProfile(phone: string): Promise<Row> {
  const profile = await findProfileByPhone(db(), phone);
  if (!profile) throw new FlowError('프로필을 먼저 등록해주세요.', 403);
  return profile;
}

/* ---------------- admin ---------------- */

/** Deadlines must be in the future and in stage order; empty ones get defaults when their stage starts. */
export function assertDeadlines(e: Pick<OrbitEvent, 'applyEndsAt' | 'likeEndsAt' | 'chooseEndsAt'>, now = new Date()) {
  const steps = [
    ['진행중 마감', e.applyEndsAt],
    ['선별중 마감', e.likeEndsAt],
    ['선택중 마감', e.chooseEndsAt],
  ] as const;
  let previous = now.getTime();
  for (const [label, iso] of steps) {
    if (!iso) continue;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) throw new FlowError(`${label} 시각이 올바르지 않아요.`);
    if (t <= previous) throw new FlowError(`${label} 시각은 지금과 앞 단계 마감보다 뒤여야 해요.`);
    previous = t;
  }
}

/**
 * Admin stage changes. 시작 (upcoming → ongoing) only from the stopped state with valid deadlines;
 * 정지 (ongoing → upcoming) only while applications are open, so a published lineup is never undone.
 */
export async function adminSetStatus(slug: string, status: EventStatus): Promise<OrbitEvent> {
  const event = await requireEvent(slug);
  if (status === 'ongoing') {
    if (event.status !== 'upcoming') throw new FlowError('정지된 이벤트만 시작할 수 있어요.', 409);
    assertDeadlines(event);
  }
  if (status === 'upcoming') {
    if (event.status !== 'ongoing') throw new FlowError('진행중인 이벤트만 정지할 수 있어요.', 409);
    // An early (pre-published) selection is discarded on stop; it is redone after restarting.
    if (event.publishedAt) {
      await setSelection(slug, []);
      await updateEvent(slug, { publishedAt: null });
    }
  }
  if (status === 'choosing' && !event.publishedAt) throw new FlowError('선별을 공개한 뒤에 선택중으로 넘어갈 수 있어요.');
  return enterStage(event, status);
}

/** Admin view: applicants with like counts and the matches made. */
export async function adminBoard(slug: string) {
  const event = await requireEvent(slug);
  const applications = await listApplications(slug);
  const [{ data: likes, error: likeError }, { data: matches, error: matchError }] = await Promise.all([
    db().from('event_likes').select('id, to_application_id').eq('event_slug', event.slug),
    db().from('event_matches').select('application_id, like:event_likes(from_profile:profiles(nickname, name, phone))').eq('event_slug', event.slug),
  ]);
  if (likeError || matchError) throw new Error((likeError || matchError)!.message);

  const likeCount: Record<string, number> = {};
  for (const l of likes) likeCount[l.to_application_id] = (likeCount[l.to_application_id] || 0) + 1;

  return {
    event,
    applications: applications.map((a) => ({ ...a, likeCount: likeCount[a.id] || 0 })),
    totalLikes: likes.length,
    matches: (matches as Row[]).map((m) => ({ applicationId: m.application_id, partner: m.like?.from_profile ?? null })),
  };
}

/** Saves the selection and opens the lineup for likes. One-shot: the lineup cannot change once public. */
export async function publishSelection(slug: string, ids: string[]): Promise<OrbitEvent> {
  const event = await requireEvent(slug);
  // Selecting early (while 진행중) is allowed; the lineup only becomes visible once 선별중 starts.
  if (event.status !== 'ongoing' && event.status !== 'screening') throw new FlowError('진행중이나 선별중 단계에서만 선별을 공개할 수 있어요.');
  if (event.publishedAt) throw new FlowError('이미 공개된 선별은 바꿀 수 없어요.');

  const own = new Set((await listApplications(slug)).map((a) => a.id));
  const chosen = [...new Set(ids)].filter((id) => own.has(id));
  if (chosen.length === 0) throw new FlowError('선별할 사람을 1명 이상 골라주세요.');

  await setSelection(slug, chosen);
  const now = new Date();
  const likeEndsAt = event.likeEndsAt && new Date(event.likeEndsAt) > now ? event.likeEndsAt : addDays(now, 1);
  return updateEvent(slug, { publishedAt: now.toISOString(), likeEndsAt });
}

/* ---------------- members ---------------- */

export async function applyToEvent(slug: string, phone: string, memoInput: unknown): Promise<void> {
  const event = await requireEvent(slug);
  if (event.status !== 'ongoing') throw new FlowError('지금은 신청을 받지 않아요.');
  const memo = String(memoInput ?? '').trim();
  if (memo.length < MEMO_MIN) throw new FlowError(`한마디를 ${MEMO_MIN}자 이상 써주세요.`);
  if (memo.length > MEMO_MAX) throw new FlowError(`한마디는 ${MEMO_MAX}자까지 쓸 수 있어요.`);

  const profile = await requireProfile(phone);
  const limit = parseCapacity(event.capacity)[profile.gender === '여성' ? 'female' : 'male'];
  if (limit !== null && (await countByGender(slug, profile.gender)) >= limit) {
    throw new FlowError(`${profile.gender} 모집 인원(${limit}명)이 모두 찼어요.`);
  }
  await insertApplication(slug, event.volNumber, profile, memo);
}

export async function sendLike(slug: string, phone: string, applicationId: string, messageInput: unknown): Promise<void> {
  const event = await requireEvent(slug);
  if (!likesOpen(event)) throw new FlowError('지금은 관심을 보낼 수 없어요.');
  const message = String(messageInput ?? '').trim();
  if (message.length > LIKE_MESSAGE_MAX) throw new FlowError(`한마디는 ${LIKE_MESSAGE_MAX}자까지 쓸 수 있어요.`);
  const me = await requireProfile(phone);
  // Only the selected lineup plays: people who weren't selected can look but not send.
  const mine = await findApplication(slug, me.id);
  if (!mine?.selected) throw new FlowError('이번 회차에 선별된 참가자만 관심을 보낼 수 있어요.', 403);

  const { data: target, error } = await db()
    .from('event_applications')
    .select('id, selected, event_slug, profile:profiles(id, gender)')
    .eq('id', applicationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!target || !target.selected || target.event_slug !== event.slug || !target.profile) throw new FlowError('선별된 참가자가 아니에요.', 404);
  const targetProfile = target.profile as unknown as Row;
  if (targetProfile.id === me.id) throw new FlowError('나에게는 관심을 보낼 수 없어요.');
  if (targetProfile.gender === me.gender) throw new FlowError('이성에게만 관심을 보낼 수 있어요.');

  // The selected participant sees who liked them on the lineup page (no name or phone); nothing is pushed.
  const { error: likeError } = await db()
    .from('event_likes')
    .insert({ event_slug: event.slug, from_profile_id: me.id, to_application_id: target.id, message });
  if (likeError) throw new FlowError(likeError.code === '23505' ? '관심은 한 번만 보낼 수 있어요.' : likeError.message, likeError.code === '23505' ? 409 : 500);
}

export async function chooseLiker(slug: string, phone: string, likeId: string): Promise<void> {
  const event = await requireEvent(slug);
  if (event.status !== 'choosing') throw new FlowError('지금은 선택 기간이 아니에요.');
  const me = await requireProfile(phone);
  const mine = await findApplication(slug, me.id);
  if (!mine?.selected) throw new FlowError('선별된 참가자만 선택할 수 있어요.', 403);

  const { data: like, error } = await db().from('event_likes').select('id, to_application_id, from_profile_id').eq('id', likeId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!like || like.to_application_id !== mine.id) throw new FlowError('나에게 관심을 보낸 사람만 고를 수 있어요.', 404);

  // 1:1 — a selected participant can also be a liker, so neither side may already be matched elsewhere.
  const [{ data: myLike }, likerApp] = await Promise.all([
    db().from('event_likes').select('id').eq('event_slug', event.slug).eq('from_profile_id', me.id).maybeSingle(),
    findApplication(slug, like.from_profile_id),
  ]);
  if (!likerApp?.selected) throw new FlowError('선별된 참가자만 고를 수 있어요.', 403);
  const taken = await db()
    .from('event_matches')
    .select('id', { count: 'exact', head: true })
    .eq('event_slug', event.slug)
    .or([myLike && `like_id.eq.${myLike.id}`, likerApp && `application_id.eq.${likerApp.id}`].filter(Boolean).join(',') || 'id.is.null');
  if (taken.error) throw new Error(taken.error.message);
  if ((taken.count ?? 0) > 0) throw new FlowError('이미 다른 분과 연결된 사람이라 고를 수 없어요.', 409);

  const { error: matchError } = await db().from('event_matches').insert({ event_slug: event.slug, application_id: mine.id, like_id: like.id });
  if (matchError) throw new FlowError(matchError.code === '23505' ? '선택은 한 번만 할 수 있어요.' : matchError.message, matchError.code === '23505' ? 409 : 500);
}

/** Someone who liked me, with the short note they sent along. */
export interface IncomingCard extends PublicCard {
  message: string;
}

export interface MatchCard extends PublicCard {
  phone: string;
}

/** Everything one member sees on the lineup page for one event. */
export async function memberBoard(slug: string, phone: string | null) {
  const event = await requireEvent(slug);
  const me = phone ? await findProfileByPhone(db(), phone) : null;
  const mine = me ? await findApplication(slug, me.id) : null;

  const board = {
    event,
    viewer: {
      loggedIn: Boolean(phone),
      hasProfile: Boolean(me),
      applied: Boolean(mine),
      selected: Boolean(mine?.selected && event.publishedAt),
      likedId: null as string | null,
      chosenId: null as string | null,
    },
    lineup: [] as PublicCard[],
    incoming: [] as IncomingCard[],
    match: null as MatchCard | null,
  };
  // Selected participants' photos and profiles are shown only to people who applied to this event.
  if (!me || !mine || !lineupVisible(event)) return board;

  const [{ data: selected }, { data: myLike }] = await Promise.all([
    db().from('event_applications').select('id, memo, profile:profiles(*)').eq('event_slug', event.slug).eq('selected', true),
    db().from('event_likes').select('id, to_application_id').eq('event_slug', event.slug).eq('from_profile_id', me.id).maybeSingle(),
  ]);
  board.viewer.likedId = myLike?.to_application_id ?? null;
  board.lineup = ((selected || []) as Row[])
    .filter((a) => a.profile && a.profile.id !== me.id && a.profile.gender !== me.gender)
    .map((a) => toPublicCard(a.id, a.profile, a.memo));

  if (board.viewer.selected && mine) {
    const [{ data: likes }, { data: match }] = await Promise.all([
      db().from('event_likes').select('id, message, from_profile:profiles(*)').eq('to_application_id', mine.id).order('created_at'),
      db().from('event_matches').select('like_id').eq('application_id', mine.id).maybeSingle(),
    ]);
    // Likes sent before selection was required may come from unselected members; those can't be chosen, so hide them.
    const selectedIds = new Set(((selected || []) as Row[]).map((a) => a.profile?.id));
    board.incoming = ((likes || []) as Row[])
      .filter((l) => l.from_profile && selectedIds.has(l.from_profile.id))
      .map((l) => ({ ...toPublicCard(l.id, l.from_profile), message: l.message || '' }));
    board.viewer.chosenId = match?.like_id ?? null;
    if (event.status === 'ended' && match) {
      const partner = ((likes || []) as Row[]).find((l) => l.id === match.like_id)?.from_profile;
      if (partner) board.match = { ...toPublicCard(match.like_id, partner), phone: partner.phone };
    }
  } else if (event.status === 'ended' && myLike) {
    const { data: match } = await db()
      .from('event_matches')
      .select('application:event_applications(id, memo, profile:profiles(*))')
      .eq('like_id', myLike.id)
      .maybeSingle();
    const app = match?.application as unknown as Row | undefined;
    if (app?.profile) board.match = { ...toPublicCard(app.id, app.profile, app.memo), phone: app.profile.phone };
  }
  return board;
}

export type MemberBoard = Awaited<ReturnType<typeof memberBoard>>;

/* ---------------- match reveal ---------------- */

const describe = (p: Row) => clip(`${p.nickname}, ${p.age}, ${p.height}cm, ${p.location}`, 80);

/** Sends both sides of every un-notified match their partner's card with phone number. Idempotent. */
export async function notifyMatches(slug: string): Promise<void> {
  const [event, { data, error }] = await Promise.all([
    getEventBySlug(slug),
    db()
      .from('event_matches')
      .select('id, application:event_applications(profile:profiles(*)), like:event_likes(from_profile:profiles(*))')
      .eq('event_slug', slug)
      .is('notified_at', null),
  ]);
  if (error) {
    console.error('[matches] lookup failed:', error.message);
    return;
  }
  const eventName = event ? `${event.volNumber} ${event.title}` : slug;
  for (const m of data as Row[]) {
    const chooser = m.application?.profile;
    const liker = m.like?.from_profile;
    if (!chooser || !liker) continue;
    const results = await Promise.all([
      sendAlimtalk('match', chooser.phone, { event: eventName, nickname: chooser.nickname, partner: describe(liker), partner_phone: liker.phone, link: lineupUrl(slug) }),
      sendAlimtalk('match', liker.phone, { event: eventName, nickname: liker.nickname, partner: describe(chooser), partner_phone: chooser.phone, link: lineupUrl(slug) }),
    ]);
    if (results.every(Boolean)) await db().from('event_matches').update({ notified_at: new Date().toISOString() }).eq('id', m.id);
  }
}
