import type { OrbitEvent } from '@/types/event';
import { createServerSupabaseClient } from '@/lib/supabase';
import { FlowError } from '@/lib/errors';

// Events live only in Supabase (the old data/events.json fallback could drift from the DB).

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped Supabase row
type EventRow = Record<string, any>;

function fromRow(row: EventRow): OrbitEvent {
  return {
    id: row.id || row.slug,
    slug: row.slug,
    volNumber: row.vol_number || 'VOL.01',
    title: row.title,
    subtitle: row.subtitle || '',
    status: row.status || 'upcoming',
    imageUrl: row.image_url || '',
    dDayText: row.d_day_text || '',
    badgeText: row.badge_text || '',
    description: row.description || '',
    date: row.date || '',
    location: row.location || '',
    capacity: row.capacity || '',
    content: row.content || '',
    applyEndsAt: row.apply_ends_at,
    likeEndsAt: row.like_ends_at,
    chooseEndsAt: row.choose_ends_at,
    publishedAt: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const COLUMNS: Record<string, string> = {
  volNumber: 'vol_number',
  title: 'title',
  subtitle: 'subtitle',
  status: 'status',
  imageUrl: 'image_url',
  description: 'description',
  date: 'date',
  location: 'location',
  capacity: 'capacity',
  content: 'content',
  applyEndsAt: 'apply_ends_at',
  likeEndsAt: 'like_ends_at',
  chooseEndsAt: 'choose_ends_at',
  publishedAt: 'published_at',
};

/** Only whitelisted fields reach the DB; empty strings become NULL for timestamp columns. */
function toRow(fields: Partial<OrbitEvent>): EventRow {
  const row: EventRow = {};
  for (const [key, column] of Object.entries(COLUMNS)) {
    if (!(key in fields)) continue;
    const value = fields[key as keyof OrbitEvent];
    row[column] = column.endsWith('_at') ? value || null : value;
  }
  return row;
}

export async function getAllEvents(): Promise<OrbitEvent[]> {
  const { data, error } = await createServerSupabaseClient().from('events').select('*').order('vol_number', { ascending: true });
  if (error) throw new Error(`이벤트를 불러오지 못했습니다: ${error.message}`);
  return data.map(fromRow);
}

export async function getEventBySlug(slug: string): Promise<OrbitEvent | null> {
  const { data, error } = await createServerSupabaseClient().from('events').select('*').eq('slug', slug.toLowerCase()).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data) : null;
}

export async function createEvent(fields: Partial<OrbitEvent> & { slug: string }): Promise<OrbitEvent> {
  const slug = fields.slug.toLowerCase();
  const { data, error } = await createServerSupabaseClient()
    .from('events')
    .insert({ status: 'upcoming', ...toRow(fields), id: slug, slug, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error?.code === '23505') throw new FlowError('이미 있는 페이지 주소예요.', 409);
  if (error) throw new Error(error.message);
  return fromRow(data);
}

export async function updateEvent(slug: string, fields: Partial<OrbitEvent>): Promise<OrbitEvent> {
  const { data, error } = await createServerSupabaseClient()
    .from('events')
    .update({ ...toRow(fields), updated_at: new Date().toISOString() })
    .eq('slug', slug.toLowerCase())
    .select()
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data);
}

// Event children reference the event by slug (no foreign key), so they move/delete together here.
// Order matters for delete: matches → likes → applications (likes/matches cascade from applications too).
const CHILD_TABLES = ['event_matches', 'event_likes', 'event_applications'] as const;

/** Changes the page address (/events/{slug}) and re-points all of the event's records. */
export async function renameEvent(from: string, to: string): Promise<void> {
  const db = createServerSupabaseClient();
  const oldSlug = from.toLowerCase();
  const newSlug = to.toLowerCase();
  if (await getEventBySlug(newSlug)) throw new FlowError(`'${newSlug}' 주소는 이미 다른 이벤트가 쓰고 있어요.`, 409);

  const { error } = await db.from('events').update({ id: newSlug, slug: newSlug, updated_at: new Date().toISOString() }).eq('slug', oldSlug);
  if (error) throw new Error(error.message);
  for (const table of CHILD_TABLES) {
    const res = await db.from(table).update({ event_slug: newSlug }).eq('event_slug', oldSlug);
    if (res.error) throw new Error(res.error.message);
  }
}

/** Deletes the event and its applications, likes and matches. */
export async function deleteEvent(slug: string): Promise<void> {
  const db = createServerSupabaseClient();
  const key = slug.toLowerCase();
  for (const table of CHILD_TABLES) {
    const res = await db.from(table).delete().eq('event_slug', key);
    if (res.error) throw new Error(res.error.message);
  }
  const { error } = await db.from('events').delete().eq('slug', key);
  if (error) throw new Error(error.message);
}
