import fs from 'fs';
import path from 'path';
import { OrbitEvent } from '@/types/event';
import { supabase } from '@/lib/supabase';

const dataFilePath = path.join(process.cwd(), 'data', 'events.json');

// Used only when neither Supabase nor data/events.json has any events.
const defaultEvents: OrbitEvent[] = [
  {
    id: 'vol01',
    slug: 'vol01',
    volNumber: 'VOL.01',
    title: '비밀 인연 매칭 프로젝트',
    subtitle: '곧 첫 번째 이벤트가 공개됩니다',
    status: 'upcoming',
    imageUrl: '',
    dDayText: 'PREVIEW · D-DAY EVENT',
    badgeText: 'ORBIT EXCLUSIVE',
    description: 'Orbit 회원들을 위한 특별한 첫 번째 시크릿 인연 매칭 이벤트입니다.',
    date: '',
    location: '',
    capacity: '',
    content: '',
  },
];

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
    badgeText: row.badge_text || 'ORBIT EXCLUSIVE',
    description: row.description || '',
    date: row.date || '',
    location: row.location || '',
    capacity: row.capacity || '',
    content: row.content || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toRow(event: OrbitEvent): EventRow {
  return {
    id: event.id,
    slug: event.slug,
    vol_number: event.volNumber,
    title: event.title,
    subtitle: event.subtitle,
    status: event.status,
    image_url: event.imageUrl,
    d_day_text: event.dDayText,
    badge_text: event.badgeText,
    description: event.description,
    date: event.date,
    location: event.location,
    capacity: event.capacity,
    content: event.content,
    updated_at: event.updated_at || new Date().toISOString(),
  };
}

export function getLocalEvents(): OrbitEvent[] {
  try {
    if (fs.existsSync(dataFilePath)) {
      const parsed = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to read local events file:', err);
  }
  return defaultEvents;
}

// Serverless filesystems are read-only; the local file is a best-effort dev fallback.
function saveLocalEvents(events: OrbitEvent[]): void {
  try {
    fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
    fs.writeFileSync(dataFilePath, JSON.stringify(events, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write local events file:', err);
  }
}

/** Supabase first; an empty table is seeded from the local file. */
export async function getAllEvents(): Promise<OrbitEvent[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('events').select('*').order('vol_number', { ascending: true });
      if (error) {
        console.warn('[Supabase Events] fetch notice:', error.message);
      } else if (data.length > 0) {
        return data.map(fromRow);
      } else {
        const local = getLocalEvents();
        await supabase.from('events').upsert(local.map(toRow));
        return local;
      }
    } catch (e) {
      console.warn('[Supabase Events] connection notice:', e instanceof Error ? e.message : e);
    }
  }
  return getLocalEvents();
}

export async function getEventBySlug(slug: string): Promise<OrbitEvent | null> {
  const key = slug.toLowerCase();
  return (await getAllEvents()).find((e) => e.slug.toLowerCase() === key || e.id.toLowerCase() === key) || null;
}

export async function upsertEvent(eventData: Partial<OrbitEvent> & { slug: string }): Promise<OrbitEvent> {
  const events = await getAllEvents();
  const slug = eventData.slug.toLowerCase();
  const index = events.findIndex((e) => e.slug.toLowerCase() === slug || e.id.toLowerCase() === slug);
  const now = new Date().toISOString();

  const updated: OrbitEvent =
    index >= 0
      ? { ...events[index], ...eventData, slug, updated_at: now }
      : {
          id: eventData.id || slug,
          volNumber: `VOL.${String(events.length + 1).padStart(2, '0')}`,
          title: '새로운 이벤트',
          subtitle: '',
          status: 'upcoming',
          dDayText: 'COMING SOON',
          badgeText: 'ORBIT EVENT',
          ...eventData,
          slug,
          created_at: now,
          updated_at: now,
        };

  if (index >= 0) events[index] = updated;
  else events.push(updated);
  saveLocalEvents(events);

  if (supabase) {
    const { error } = await supabase.from('events').upsert(toRow(updated));
    if (error) console.warn('[Supabase Events] upsert warning:', error.message);
  }
  return updated;
}

export async function deleteEvent(slug: string): Promise<void> {
  const key = slug.toLowerCase();
  saveLocalEvents(getLocalEvents().filter((e) => e.slug.toLowerCase() !== key));
  if (supabase) await supabase.from('events').delete().eq('slug', slug);
}
