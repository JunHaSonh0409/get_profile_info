import { createServerSupabaseClient } from '@/lib/supabase';
import { MEMBER_LOGIN_REQUIRED, fail, failWith, json } from '@/lib/http';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';
import { getMemberPhone } from '@/lib/memberAuth';
import { MAX_PHOTOS, storePhoto } from '@/lib/profiles';
import { hit } from '@/lib/rateLimit';

const REJECTED = 'JPG, PNG, WebP 형식의 10MB 이하 사진만 올릴 수 있어요.';

/**
 * Stores images in Supabase Storage and returns their public URLs (random names, no personal data).
 * Members send JSON `{ images: dataUrl[] }` (edited photos, up to 3); admins send multipart `files`
 * (event posters). The image type is checked from the file bytes, not the declared type.
 */
export async function POST(request: Request) {
  const memberPhone = getMemberPhone(request);
  const isAdmin = !memberPhone && getAdminSessionFromRequest(request).authenticated;
  if (!memberPhone && !isAdmin) return fail(MEMBER_LOGIN_REQUIRED, 401);
  if (memberPhone && hit(`upload:${memberPhone}`, 30, 60 * 60 * 1000)) return fail('사진을 너무 많이 올렸어요. 잠시 뒤에 다시 시도해주세요.', 429);

  try {
    const supabase = createServerSupabaseClient();
    const buffers: Buffer[] = [];
    if (isAdmin && (request.headers.get('content-type') || '').includes('multipart/form-data')) {
      for (const file of (await request.formData()).getAll('files').slice(0, 5)) {
        if (file instanceof File) buffers.push(Buffer.from(await file.arrayBuffer()));
      }
    } else {
      const { images } = await request.json();
      for (const image of Array.isArray(images) ? images.slice(0, MAX_PHOTOS) : []) {
        const match = typeof image === 'string' && image.match(/^data:image\/[a-z+]+;base64,(.+)$/);
        if (match) buffers.push(Buffer.from(match[1], 'base64'));
      }
    }
    if (buffers.length === 0) return fail('올릴 사진이 없어요.', 400);

    const urls: string[] = [];
    for (const data of buffers) {
      const url = await storePhoto(supabase, isAdmin ? 'events' : 'photos', data);
      if (url) urls.push(url);
    }
    if (urls.length === 0) return fail(REJECTED, 400);
    return json({ success: true, urls, ...(urls.length < buffers.length ? { warning: REJECTED } : {}) });
  } catch (err) {
    return failWith(err, '사진을 올리지 못했어요.');
  }
}
