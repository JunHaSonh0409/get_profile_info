import fs from 'fs';
import path from 'path';
import { EventApplication, EventApplicationStats } from '@/types/application';
import { supabase } from '@/lib/supabase';
import { digitsOnly } from '@/lib/format';

const dataFilePath = path.join(process.cwd(), 'data', 'event_applications.json');

function getLocalApplications(): EventApplication[] {
  try {
    if (fs.existsSync(dataFilePath)) {
      const parsed = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to read local applications file:', err);
  }
  return [];
}

// Serverless filesystems are read-only; the local file is a best-effort dev fallback.
function saveLocalApplications(apps: EventApplication[]): void {
  try {
    fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
    fs.writeFileSync(dataFilePath, JSON.stringify(apps, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write local applications file:', err);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped Supabase row
function fromRow(row: Record<string, any>): EventApplication {
  return {
    id: row.id,
    eventSlug: row.event_slug,
    volNumber: row.vol_number,
    name: row.name,
    phone: row.phone,
    gender: row.gender || '',
    age: row.age || '',
    status: row.status || 'confirmed',
    memo: row.memo || '',
    created_at: row.created_at,
  };
}

/** Applications for one event (or all), Supabase first with the local file as fallback. */
export async function getApplications(eventSlug?: string): Promise<EventApplication[]> {
  const slug = eventSlug?.toLowerCase();
  if (supabase) {
    let query = supabase.from('event_applications').select('*').order('created_at', { ascending: false });
    if (slug) query = query.eq('event_slug', slug);
    const { data, error } = await query;
    if (!error && data.length > 0) return data.map(fromRow);
  }
  const local = getLocalApplications();
  return slug ? local.filter((a) => a.eventSlug.toLowerCase() === slug) : local;
}

export async function createApplication(
  payload: Omit<EventApplication, 'id' | 'created_at'>
): Promise<{ success: boolean; application?: EventApplication; error?: string }> {
  const eventSlug = payload.eventSlug.toLowerCase();
  const phone = digitsOnly(payload.phone);

  if (phone.length < 9) return { success: false, error: '유효한 전화번호를 입력해주세요.' };
  if (!payload.name.trim()) return { success: false, error: '이름을 입력해주세요.' };

  const existing = await getApplications(eventSlug);
  if (existing.some((a) => digitsOnly(a.phone) === phone)) {
    return { success: false, error: '이미 해당 이벤트에 신청이 완료된 전화번호입니다.' };
  }

  const application: EventApplication = {
    ...payload,
    id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    eventSlug,
    name: payload.name.trim(),
    phone,
    status: payload.status || 'confirmed',
    memo: payload.memo || '',
    created_at: new Date().toISOString(),
  };

  saveLocalApplications([application, ...getLocalApplications()]);
  if (supabase) {
    const { error } = await supabase.from('event_applications').insert({
      event_slug: application.eventSlug,
      vol_number: application.volNumber,
      name: application.name,
      phone: application.phone,
      gender: application.gender,
      age: application.age,
      status: application.status,
      memo: application.memo,
    });
    if (error) console.warn('[Supabase Applications] insert warning:', error.message);
  }

  return { success: true, application };
}

export async function updateApplicationStatus(id: string, status: EventApplication['status']): Promise<void> {
  saveLocalApplications(getLocalApplications().map((a) => (a.id === id ? { ...a, status } : a)));
  if (supabase) await supabase.from('event_applications').update({ status }).eq('id', id);
}

export async function deleteApplication(id: string): Promise<void> {
  saveLocalApplications(getLocalApplications().filter((a) => a.id !== id));
  if (supabase) await supabase.from('event_applications').delete().eq('id', id);
}

export const isMaleApplicant = (a: EventApplication) => a.gender === '남성' || a.gender === 'male';
export const isFemaleApplicant = (a: EventApplication) => a.gender === '여성' || a.gender === 'female';

export function getApplicationStats(apps: EventApplication[]): EventApplicationStats {
  const count = (fn: (a: EventApplication) => boolean) => apps.filter(fn).length;
  return {
    total: apps.length,
    male: count(isMaleApplicant),
    female: count(isFemaleApplicant),
    confirmed: count((a) => a.status === 'confirmed'),
    pending: count((a) => a.status === 'pending'),
    cancelled: count((a) => a.status === 'cancelled'),
  };
}
