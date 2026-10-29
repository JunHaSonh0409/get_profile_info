import type { SupabaseClient } from '@supabase/supabase-js';
import { digitsOnly } from '@/lib/format';

export const MAX_PHOTOS = 3;
const PHOTO_BUCKET = 'profile-photos';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped Supabase row / request body
type Row = Record<string, any>;

/** The member's profile row (phones are stored as digits only), or null. */
export async function findProfileByPhone(supabase: SupabaseClient, phone: string): Promise<Row | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('phone', digitsOnly(phone)).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** DB row (snake_case) -> client profile shape (camelCase fields added). */
export function normalizeProfile(row: Row): Row {
  return {
    ...row,
    mbti: row.mbti || '',
    preferredAnimals: row.preferred_animals || [],
    preferredAppearanceDetail: row.preferred_appearance_detail || '',
    preferredPartnerDetail: row.preferred_partner_detail || '',
    selfIntro: row.self_intro || '',
    photos: Array.isArray(row.photos) ? row.photos.slice(0, MAX_PHOTOS) : [],
  };
}

/** Client profile payload -> DB columns (phone and photos are handled by the caller). */
export function toProfileRow(body: Row): Row {
  const age = String(body.age ?? '').trim();
  const row: Row = {
    name: body.name?.trim(),
    nickname: body.nickname?.trim(),
    gender: body.gender,
    age: age.endsWith('년생') ? age : `${age}년생`,
    height: Number(body.height),
    location: body.location?.trim(),
    mbti: body.mbti ? String(body.mbti).trim().toUpperCase() : '',
    preferred_animals: Array.isArray(body.preferredAnimals) ? body.preferredAnimals : [],
    preferred_appearance_detail: body.preferredAppearanceDetail?.trim() || '',
    preferred_partner_detail: body.preferredPartnerDetail?.trim(),
    self_intro: body.selfIntro?.trim(),
  };
  if (body.mbti === undefined) delete row.mbti;
  return row;
}

const extensionFor = (mime: string) => (mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg');

/** Uploads one image to the public photo bucket and returns its public URL, or null on failure. */
export async function storePhoto(supabase: SupabaseClient, owner: string, data: Buffer, mime: string) {
  const folder = digitsOnly(owner) || owner.replace(/[^a-z0-9_-]/gi, '') || 'guest';
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extensionFor(mime)}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, data, { contentType: mime, upsert: true });
  if (error) {
    console.error('Storage upload error:', error);
    return null;
  }
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Keeps http(s) URLs, uploads data: URLs, drops anything else. At most MAX_PHOTOS items. */
export async function uploadPhotos(supabase: SupabaseClient, owner: string, photos: unknown): Promise<string[]> {
  if (!Array.isArray(photos)) return [];
  const urls: string[] = [];
  for (const photo of photos.slice(0, MAX_PHOTOS)) {
    if (typeof photo !== 'string') continue;
    if (/^https?:\/\//.test(photo)) {
      urls.push(photo);
      continue;
    }
    const match = photo.match(/^data:([^;]+);base64,(.+)$/);
    const url = match && (await storePhoto(supabase, owner, Buffer.from(match[2], 'base64'), match[1]));
    if (url) urls.push(url);
  }
  return urls;
}
