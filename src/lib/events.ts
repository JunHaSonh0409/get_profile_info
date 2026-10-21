import fs from 'fs';
import path from 'path';
import { OrbitEvent } from '@/types/event';
import { supabase } from '@/lib/supabase';

const dataFilePath = path.join(process.cwd(), 'data', 'events.json');

// Default fallback events
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
    description: 'Orbit 회원들을 위한 특별한 첫 번째 시크릿 인연 매칭 이벤트입니다. 관리자 페이지에서 이벤트 포스터/이미지를 등록하면 카드에 즉시 반영됩니다.',
    date: '2026.11.01 (토) 18:00 오픈 예정',
    location: '서울 강남 시크릿 라운지 (추후 안내)',
    capacity: '선착순 30명 (남 15명 / 여 15명)',
    content: '우주 모든 인연이 만날 때까지, Orbit이 준비한 첫 번째 스페셜 오프라인 매칭 파티입니다.\n\n엄격한 프로필 검증을 거친 회원들만 초대되며, 프라이빗하고 편안한 분위기에서 서로의 가치관과 이상형을 알아갈 수 있습니다.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'vol02',
    slug: 'vol02',
    volNumber: 'VOL.02',
    title: '가을밤 별빛 블라인드 데이트',
    subtitle: '두 번째 시크릿 매칭 라인업',
    status: 'upcoming',
    imageUrl: '',
    dDayText: 'COMING SOON',
    badgeText: 'ORBIT SEASON 2',
    description: '깊어가는 가을, 별빛 아래서 나누는 진솔한 대화. 두 번째 Orbit 특별 매칭 이벤트입니다.',
    date: '2026.11.15 (토) 19:00 오픈 예정',
    location: '루프탑 가든 (선정 회원 개별 공지)',
    capacity: '선착순 24명 (남 12명 / 여 12명)',
    content: '서로의 외모 선호도와 성향이 매칭된 분들만을 엄선하여 초대하는 프라이빗 블라인드 데이트입니다.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Read local JSON events file
 */
export function getLocalEvents(): OrbitEvent[] {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read local events file:', err);
  }
  return defaultEvents;
}

/**
 * Save events to local JSON file
 */
export function saveLocalEvents(events: OrbitEvent[]): void {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(events, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write local events file:', err);
  }
}

/**
 * Fetch all events (Supabase first with local file fallback)
 */
export async function getAllEvents(): Promise<OrbitEvent[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('vol_number', { ascending: true });

      if (!error && data && data.length > 0) {
        // Map snake_case to camelCase
        return data.map((item: any) => ({
          id: item.id || item.slug,
          slug: item.slug,
          volNumber: item.vol_number || item.volNumber || 'VOL.01',
          title: item.title,
          subtitle: item.subtitle || '',
          status: item.status || 'upcoming',
          imageUrl: item.image_url || item.imageUrl || '',
          dDayText: item.d_day_text || item.dDayText || '',
          badgeText: item.badge_text || item.badgeText || 'ORBIT EXCLUSIVE',
          description: item.description || '',
          date: item.date || '',
          location: item.location || '',
          capacity: item.capacity || '',
          content: item.content || '',
          created_at: item.created_at,
          updated_at: item.updated_at,
        }));
      }
    } catch (e) {
      // Supabase table may not exist yet, proceed to local
    }
  }

  return getLocalEvents();
}

/**
 * Get event by slug (e.g. 'vol01', 'vol02')
 */
export async function getEventBySlug(slug: string): Promise<OrbitEvent | null> {
  const all = await getAllEvents();
  const normalized = slug.toLowerCase();
  return all.find((e) => e.slug.toLowerCase() === normalized || e.id.toLowerCase() === normalized) || null;
}

/**
 * Upsert an event
 */
export async function upsertEvent(eventData: Partial<OrbitEvent> & { slug: string }): Promise<OrbitEvent> {
  const currentEvents = getLocalEvents();
  const normalizedSlug = eventData.slug.toLowerCase();

  const existingIndex = currentEvents.findIndex(
    (e) => e.slug.toLowerCase() === normalizedSlug || e.id.toLowerCase() === normalizedSlug
  );

  let updatedEvent: OrbitEvent;

  if (existingIndex >= 0) {
    updatedEvent = {
      ...currentEvents[existingIndex],
      ...eventData,
      slug: normalizedSlug,
      updated_at: new Date().toISOString(),
    };
    currentEvents[existingIndex] = updatedEvent;
  } else {
    updatedEvent = {
      id: eventData.id || normalizedSlug,
      slug: normalizedSlug,
      volNumber: eventData.volNumber || `VOL.${String(currentEvents.length + 1).padStart(2, '0')}`,
      title: eventData.title || '새로운 이벤트',
      subtitle: eventData.subtitle || '',
      status: eventData.status || 'upcoming',
      imageUrl: eventData.imageUrl || '',
      dDayText: eventData.dDayText || 'COMING SOON',
      badgeText: eventData.badgeText || 'ORBIT EVENT',
      description: eventData.description || '',
      date: eventData.date || '',
      location: eventData.location || '',
      capacity: eventData.capacity || '',
      content: eventData.content || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    currentEvents.push(updatedEvent);
  }

  // Save to local file
  saveLocalEvents(currentEvents);

  // Sync to Supabase if table exists
  if (supabase) {
    try {
      await supabase.from('events').upsert({
        id: updatedEvent.id,
        slug: updatedEvent.slug,
        vol_number: updatedEvent.volNumber,
        title: updatedEvent.title,
        subtitle: updatedEvent.subtitle,
        status: updatedEvent.status,
        image_url: updatedEvent.imageUrl,
        d_day_text: updatedEvent.dDayText,
        badge_text: updatedEvent.badgeText,
        description: updatedEvent.description,
        date: updatedEvent.date,
        location: updatedEvent.location,
        capacity: updatedEvent.capacity,
        content: updatedEvent.content,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      // Ignore if Supabase schema isn't created yet
    }
  }

  return updatedEvent;
}
