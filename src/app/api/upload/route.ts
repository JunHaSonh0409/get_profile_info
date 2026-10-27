import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { errorMessage, fail, json } from '@/lib/http';
import { storePhoto, uploadPhotos } from '@/lib/profiles';

/**
 * Uploads images to Supabase Storage and returns their public URLs.
 * Accepts multipart `files` + `phone`, or JSON `{ images | image, phone }` with data: URLs.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) return fail('Supabase 연결 정보가 설정되지 않았습니다.', 500);

  try {
    const supabase = createServerSupabaseClient();
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const owner = String(form.get('phone') || 'guest');
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

    return json({ success: true, urls: await uploadPhotos(supabase, String(body.phone || 'guest'), images) });
  } catch (err) {
    console.error('Upload API handler error:', err);
    return fail(errorMessage(err, '이미지 업로드 중 오류가 발생했습니다.'), 500);
  }
}
