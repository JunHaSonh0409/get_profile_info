import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { errorMessage, fail, json, requireAdmin } from '@/lib/http';
import { normalizeProfile } from '@/lib/profiles';

const isMale = (gender?: string) => gender === 'male' || gender === '남성';
const isFemale = (gender?: string) => gender === 'female' || gender === '여성';

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  if (!isSupabaseConfigured) {
    return json({
      success: true,
      data: [],
      stats: { total: 0, male: 0, female: 0, withPhotos: 0, withoutPhotos: 0, today: 0 },
      message: 'Supabase가 구성되지 않은 데모 모드입니다.',
    });
  }

  try {
    const { data, error } = await createServerSupabaseClient()
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return fail(error.message, 500);

    const profiles = (data || []).map(normalizeProfile);
    const today = new Date().toISOString().slice(0, 10);
    const withPhotos = profiles.filter((p) => p.photos.length > 0).length;

    return json({
      success: true,
      data: profiles,
      stats: {
        total: profiles.length,
        male: profiles.filter((p) => isMale(p.gender)).length,
        female: profiles.filter((p) => isFemale(p.gender)).length,
        withPhotos,
        withoutPhotos: profiles.length - withPhotos,
        today: profiles.filter((p) => String(p.created_at || '').startsWith(today)).length,
      },
    });
  } catch (err) {
    return fail(errorMessage(err), 500);
  }
}

export async function DELETE(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return fail('삭제할 프로필의 고유 ID가 필요합니다.', 400);

  if (!isSupabaseConfigured) {
    return json({ success: true, message: '데모 모드: 삭제 요청이 성공적으로 처리되었습니다.' });
  }

  try {
    const { error } = await createServerSupabaseClient().from('profiles').delete().eq('id', id);
    if (error) return fail(error.message, 500);
    return json({ success: true, message: '해당 프로필이 삭제되었습니다.' });
  } catch (err) {
    return fail(errorMessage(err), 500);
  }
}
