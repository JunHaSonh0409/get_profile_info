import { createServerSupabaseClient } from '@/lib/supabase';
import { fail, failWith, isUuid, json, requireAdmin } from '@/lib/http';
import { deletePhotos, normalizeProfile } from '@/lib/profiles';

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { data, error } = await createServerSupabaseClient().from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    const profiles = data.map(normalizeProfile);
    const today = new Date().toISOString().slice(0, 10);
    const withPhotos = profiles.filter((p) => p.photos.length > 0).length;
    return json({
      success: true,
      data: profiles,
      stats: {
        total: profiles.length,
        male: profiles.filter((p) => p.gender === '남성').length,
        female: profiles.filter((p) => p.gender === '여성').length,
        withPhotos,
        withoutPhotos: profiles.length - withPhotos,
        today: profiles.filter((p) => String(p.created_at || '').startsWith(today)).length,
      },
    });
  } catch (err) {
    return failWith(err, '프로필 목록을 불러오지 못했어요.');
  }
}

/** Deletes a profile (its applications, likes and matches cascade) and its stored photos. */
export async function DELETE(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const id = new URL(request.url).searchParams.get('id');
  if (!isUuid(id)) return fail('삭제할 프로필을 찾을 수 없어요.', 400);
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.from('profiles').delete().eq('id', id).select('photos');
    if (error) throw new Error(error.message);
    await deletePhotos(supabase, data[0]?.photos);
    return json({ success: true });
  } catch (err) {
    return failWith(err, '프로필을 삭제하지 못했어요.');
  }
}
