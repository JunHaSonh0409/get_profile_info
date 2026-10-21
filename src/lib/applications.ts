import fs from 'fs';
import path from 'path';
import { EventApplication, EventApplicationStats } from '@/types/application';
import { supabase } from '@/lib/supabase';

const dataFilePath = path.join(process.cwd(), 'data', 'event_applications.json');

function getLocalApplications(): EventApplication[] {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read local applications file:', err);
  }
  return [];
}

function saveLocalApplications(apps: EventApplication[]): void {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(apps, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write local applications file:', err);
  }
}

/**
 * Get applications by event slug (or all if not specified)
 */
export async function getApplications(eventSlug?: string): Promise<EventApplication[]> {
  if (supabase) {
    try {
      let query = supabase.from('event_applications').select('*').order('created_at', { ascending: false });
      if (eventSlug) {
        query = query.eq('event_slug', eventSlug.toLowerCase());
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          eventSlug: item.event_slug || item.eventSlug,
          volNumber: item.vol_number || item.volNumber,
          name: item.name,
          phone: item.phone,
          gender: item.gender || '',
          age: item.age || '',
          status: item.status || 'confirmed',
          memo: item.memo || '',
          created_at: item.created_at,
        }));
      }
    } catch (e) {
      // Supabase table might not exist yet, fallback to local file
    }
  }

  const local = getLocalApplications();
  if (eventSlug) {
    return local.filter((a) => a.eventSlug.toLowerCase() === eventSlug.toLowerCase());
  }
  return local;
}

/**
 * Register a new applicant
 */
export async function createApplication(
  payload: Omit<EventApplication, 'id' | 'created_at'>
): Promise<{ success: boolean; application?: EventApplication; error?: string }> {
  const normalizedSlug = payload.eventSlug.toLowerCase();
  const normalizedPhone = payload.phone.replace(/[^0-9]/g, '');

  if (!normalizedPhone || normalizedPhone.length < 9) {
    return { success: false, error: '유효한 전화번호를 입력해주세요.' };
  }
  if (!payload.name.trim()) {
    return { success: false, error: '이름을 입력해주세요.' };
  }

  const existing = await getApplications(normalizedSlug);
  const alreadyApplied = existing.some(
    (a) => a.phone.replace(/[^0-9]/g, '') === normalizedPhone
  );

  if (alreadyApplied) {
    return { success: false, error: '이미 해당 이벤트에 신청이 완료된 전화번호입니다.' };
  }

  const newApp: EventApplication = {
    id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventSlug: normalizedSlug,
    volNumber: payload.volNumber,
    name: payload.name.trim(),
    phone: normalizedPhone,
    gender: payload.gender || '',
    age: payload.age || '',
    status: payload.status || 'confirmed',
    memo: payload.memo || '',
    created_at: new Date().toISOString(),
  };

  // 1. Save to local file
  const allLocal = getLocalApplications();
  allLocal.unshift(newApp);
  saveLocalApplications(allLocal);

  // 2. Sync to Supabase if available
  if (supabase) {
    try {
      await supabase.from('event_applications').insert({
        event_slug: newApp.eventSlug,
        vol_number: newApp.volNumber,
        name: newApp.name,
        phone: newApp.phone,
        gender: newApp.gender,
        age: newApp.age,
        status: newApp.status,
        memo: newApp.memo,
      });
    } catch (e) {
      // ignore
    }
  }

  return { success: true, application: newApp };
}

/**
 * Update applicant status (e.g. 'confirmed', 'cancelled')
 */
export async function updateApplicationStatus(
  id: string,
  status: 'pending' | 'confirmed' | 'cancelled'
): Promise<boolean> {
  const local = getLocalApplications();
  const idx = local.findIndex((a) => a.id === id);
  if (idx >= 0) {
    local[idx].status = status;
    saveLocalApplications(local);
  }

  if (supabase) {
    try {
      await supabase.from('event_applications').update({ status }).eq('id', id);
    } catch (e) {
      // ignore
    }
  }

  return true;
}

/**
 * Delete applicant
 */
export async function deleteApplication(id: string): Promise<boolean> {
  const local = getLocalApplications().filter((a) => a.id !== id);
  saveLocalApplications(local);

  if (supabase) {
    try {
      await supabase.from('event_applications').delete().eq('id', id);
    } catch (e) {
      // ignore
    }
  }

  return true;
}

/**
 * Calculate stats for an event volume
 */
export async function getApplicationStats(eventSlug: string): Promise<EventApplicationStats> {
  const apps = await getApplications(eventSlug);
  const male = apps.filter((a) => a.gender === '남성' || a.gender === 'male').length;
  const female = apps.filter((a) => a.gender === '여성' || a.gender === 'female').length;
  const confirmed = apps.filter((a) => a.status === 'confirmed').length;
  const pending = apps.filter((a) => a.status === 'pending').length;
  const cancelled = apps.filter((a) => a.status === 'cancelled').length;

  return {
    total: apps.length,
    male,
    female,
    confirmed,
    pending,
    cancelled,
  };
}
