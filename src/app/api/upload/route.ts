import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { MEMBER_LOGIN_REQUIRED, errorMessage, fail, json } from '@/lib/http';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';
import { getMemberPhone } from '@/lib/memberAuth';
import { storePhoto, uploadPhotos } from '@/lib/profiles';

/**
 * Uploads images to Supabase Storage and returns their public URLs.
 * Accepts multipart `files`, or JSON `{ images | image }` with data: URLs.
 * Members upload into their own phone folder; admins (event posters) may name the folder via `phone`.
 */
export async function POST(request: Request) {
  const memberPhone = getMemberPhone(request);
  const isAdmin = !memberPhone && getAdminSessionFromRequest(request).authenticated;
  if (!memberPhone && !isAdmin) return fail(MEMBER_LOGIN_REQUIRED, 401);
  const ownerFor = (requested: unknown) => memberPhone ?? String(requested || 'admin');

  if (!isSupabaseConfigured) return fail('Supabase 연결 정보가 설정되지 않았습니다.', 500);

  try {
    const supabase = createServerSupabaseClient();
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const owner = ownerFor(form.get('phone'));
      const urls: string[] = [];
      for (const file of form.getAll('files')) {
        if (!(file instanceof File)) continue;
        const url = await storePhoto(supabase, owner, Buffer.from(await file.arrayBuffer()), file.type || 'image/jpeg');
        if (url) urls.push(url);
      }
      return json({ success: true, urls });
    }

    const body = await request.json();
    const images = Array.isArray(body.images) ? body.images : body.image ? [body.image] : [];
    if (images.length === 0) return fail('업로드할 이미지가 없습니다.', 400);

    return json({ success: true, urls: await uploadPhotos(supabase, ownerFor(body.phone), images) });
  } catch (err) {
    console.error('Upload API handler error:', err);
    return fail(errorMessage(err, '이미지 업로드 중 오류가 발생했습니다.'), 500);
  }
}
