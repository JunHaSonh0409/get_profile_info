import type { SupabaseClient } from '@supabase/supabase-js';
import type { EventApplication, PublicCard } from '@/types/application';
import { createServerSupabaseClient } from '@/lib/supabase';
import { MAX_PHOTOS } from '@/lib/profiles';
import { FlowError } from '@/lib/errors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped Supabase rows
type Row = Record<string, any>;

export const MEMO_MIN = 30;
export const MEMO_MAX = 1000;

const db = (): SupabaseClient => createServerSupabaseClient();

/** Everything a member may show to other members: never real name or phone. */
export function toPublicCard(id: string, profile: Row, memo = ''): PublicCard {
  return {
    id,
    nickname: profile.nickname,
    gender: profile.gender,
    age: profile.age,
    height: profile.height,
    location: profile.location,
    mbti: profile.mbti || '',
    photos: Array.isArray(profile.photos) ? profile.photos.slice(0, MAX_PHOTOS) : [],
    preferredAnimals: profile.preferred_animals || [],
    preferredAppearanceDetail: profile.preferred_appearance_detail || '',
    preferredPartnerDetail: profile.preferred_partner_detail || '',
    selfIntro: profile.self_intro || '',
    memo,
  };
}

function fromRow(row: Row): EventApplication {
  const p = row.profile;
  return {
    id: row.id,
    eventSlug: row.event_slug,
    volNumber: row.vol_number,
    profileId: row.profile_id,
    name: row.name,
    phone: row.phone,
    gender: row.gender || '',
    age: row.age || '',
    memo: row.memo || '',
    selected: Boolean(row.selected),
    created_at: row.created_at,
    card: p ? toPublicCard(row.id, p, row.memo || '') : null,
  };
}

const WITH_PROFILE = '*, profile:profiles(*)';

/** All applications for an event, newest first, joined with the applicant's profile. */
export async function listApplications(eventSlug: string): Promise<EventApplication[]> {
  const { data, error } = await db()
    .from('event_applications')
    .select(WITH_PROFILE)
    .eq('event_slug', eventSlug.toLowerCase())
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(fromRow);
}

export async function findApplication(eventSlug: string, profileId: string): Promise<EventApplication | null> {
  const { data, error } = await db()
    .from('event_applications')
    .select(WITH_PROFILE)
    .eq('event_slug', eventSlug.toLowerCase())
    .eq('profile_id', profileId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data) : null;
}

export async function countByGender(eventSlug: string, gender: string): Promise<number> {
  const { count, error } = await db()
    .from('event_applications')
    .select('id', { count: 'exact', head: true })
    .eq('event_slug', eventSlug.toLowerCase())
    .eq('gender', gender);
  if (error) throw new Error(error.message);
  return count || 0;
}

/** Name, phone, gender and age are copied from the verified profile; the member only writes the memo. */
export async function insertApplication(eventSlug: string, volNumber: string, profile: Row, memo: string): Promise<void> {
  const { error } = await db().from('event_applications').insert({
    event_slug: eventSlug.toLowerCase(),
    vol_number: volNumber,
    profile_id: profile.id,
    name: profile.name,
    phone: profile.phone,
    gender: profile.gender,
    age: profile.age,
    memo,
    status: 'confirmed',
  });
  if (error?.code === '23505') throw new FlowError('이미 이 이벤트에 신청했어요.', 409);
  if (error) throw new Error(error.message);
}

export async function deleteApplication(id: string): Promise<void> {
  const { error } = await db().from('event_applications').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Replaces the selection for an event: exactly `ids` end up selected. */
export async function setSelection(eventSlug: string, ids: string[]): Promise<void> {
  const slug = eventSlug.toLowerCase();
  const clear = await db().from('event_applications').update({ selected: false }).eq('event_slug', slug);
  if (clear.error) throw new Error(clear.error.message);
  if (ids.length === 0) return;
  const set = await db().from('event_applications').update({ selected: true }).eq('event_slug', slug).in('id', ids);
  if (set.error) throw new Error(set.error.message);
}
