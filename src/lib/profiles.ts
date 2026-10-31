import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { digitsOnly } from '@/lib/format';
import { FlowError } from '@/lib/errors';

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

const GENDERS = ['남성', '여성'];
const MBTI = /^[EI][NS][TF][JP]$/;
const LIMITS = { name: 20, nickname: 20, location: 40, appearance: 300, partner: 1000, self: 1000, animal: 20, animals: 10 };

const text = (value: unknown, max: number, label: string) => {
  const s = typeof value === 'string' ? value.trim() : '';
  if (s.length > max) throw new FlowError(`${label}은(는) ${max}자까지 쓸 수 있어요.`);
  return s;
};

/**
 * Client profile payload -> validated DB columns. Unknown keys are dropped; phone and photos are set by
 * the caller. With `partial`, absent fields are left out (edit); gender can never change after signup.
 */
export function toProfileRow(body: Row, { partial = false } = {}): Row {
  const row: Row = {};
  const has = (key: string) => !partial || body[key] !== undefined;
  const required = (key: string, value: string, label: string) => {
    if (!value) throw new FlowError(`${label}을(를) 입력해주세요.`);
    row[key] = value;
  };

  if (has('name')) required('name', text(body.name, LIMITS.name, '이름'), '이름');
  if (has('nickname')) required('nickname', text(body.nickname, LIMITS.nickname, '닉네임'), '닉네임');
  if (!partial) {
    if (!GENDERS.includes(body.gender)) throw new FlowError('성별을 골라주세요.');
    row.gender = body.gender;
  }
  if (has('age')) {
    // "98년생" or "1998년생"; stored in the short form. Members must be adults (만 19세 이상).
    const digits = digitsOnly(body.age);
    const thisYear = new Date().getFullYear();
    const year = digits.length === 4 ? Number(digits) : digits.length === 2 ? Number(digits) + (Number(digits) > thisYear % 100 ? 1900 : 2000) : 0;
    if (year < 1950 || year > thisYear - 19) throw new FlowError('태어난 해를 확인해주세요. 만 19세 이상만 가입할 수 있어요.');
    row.age = `${String(year).slice(-2)}년생`;
  }
  if (has('height')) {
    const height = Number(body.height);
    if (!Number.isInteger(height) || height < 120 || height > 230) throw new FlowError('키를 120~230cm 사이로 입력해주세요.');
    row.height = height;
  }
  if (has('location')) required('location', text(body.location, LIMITS.location, '사는 곳'), '사는 곳');
  if (body.mbti !== undefined) {
    const mbti = String(body.mbti ?? '').trim().toUpperCase();
    if (mbti && !MBTI.test(mbti)) throw new FlowError('MBTI를 확인해주세요.');
    row.mbti = mbti;
  }
  if (has('preferredAnimals')) {
    const animals = Array.isArray(body.preferredAnimals) ? body.preferredAnimals : [];
    if (animals.length > LIMITS.animals || animals.some((a: unknown) => typeof a !== 'string' || a.length > LIMITS.animal)) {
      throw new FlowError('끌리는 인상을 다시 골라주세요.');
    }
    row.preferred_animals = animals;
  }
  if (has('preferredAppearanceDetail')) row.preferred_appearance_detail = text(body.preferredAppearanceDetail, LIMITS.appearance, '바라는 인상');
  if (has('preferredPartnerDetail')) required('preferred_partner_detail', text(body.preferredPartnerDetail, LIMITS.partner, '바라는 사람'), '바라는 사람');
  if (has('selfIntro')) required('self_intro', text(body.selfIntro, LIMITS.self, '자기소개'), '자기소개');
  return row;
}

/* ---------------- photos ---------------- */

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Identifies the image type from its first bytes; the browser-sent MIME type is not trusted. */
function sniffImage(data: Buffer): { mime: string; ext: string } | null {
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', ext: 'png' };
  if (data.subarray(0, 4).toString('latin1') === 'RIFF' && data.subarray(8, 12).toString('latin1') === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  return null;
}

/** Public URL prefix of our own bucket: the only photo URLs a profile may point at. */
const bucketPrefix = () => `${(process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '')}/storage/v1/object/public/${PHOTO_BUCKET}/`;
const isOwnPhoto = (url: string) => url.startsWith(bucketPrefix());

/**
 * Stores one JPEG/PNG/WebP (max 10MB) under a random name and returns its public URL, or null when
 * rejected. Names carry no phone number or other personal data, since photo URLs are shown to others.
 */
export async function storePhoto(supabase: SupabaseClient, folder: 'photos' | 'events', data: Buffer) {
  const type = data.length <= MAX_IMAGE_BYTES ? sniffImage(data) : null;
  if (!type) return null;
  const path = `${folder}/${randomUUID()}.${type.ext}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, data, { contentType: type.mime, upsert: false });
  if (error) {
    console.error('Storage upload error:', error);
    return null;
  }
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Keeps URLs of our own bucket, uploads data: URLs, drops anything else. At most MAX_PHOTOS items. */
export async function uploadPhotos(supabase: SupabaseClient, photos: unknown): Promise<string[]> {
  if (!Array.isArray(photos)) return [];
  const urls: string[] = [];
  for (const photo of photos.slice(0, MAX_PHOTOS)) {
    if (typeof photo !== 'string') continue;
    if (isOwnPhoto(photo)) {
      urls.push(photo);
      continue;
    }
    const match = photo.match(/^data:image\/[a-z+]+;base64,(.+)$/);
    const url = match && (await storePhoto(supabase, 'photos', Buffer.from(match[1], 'base64')));
    if (url) urls.push(url);
  }
  return urls;
}

/** Removes stored files for photo URLs that are no longer used. Never throws. */
export async function deletePhotos(supabase: SupabaseClient, urls: unknown): Promise<void> {
  const paths = (Array.isArray(urls) ? urls : []).filter((u): u is string => typeof u === 'string' && isOwnPhoto(u)).map((u) => decodeURIComponent(u.slice(bucketPrefix().length)));
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove(paths);
  if (error) console.error('Storage delete error:', error);
}
