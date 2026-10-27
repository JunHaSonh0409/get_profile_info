import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { errorMessage, fail, json } from '@/lib/http';
import { digitsOnly } from '@/lib/format';
import { normalizeProfile, toProfileRow, uploadPhotos } from '@/lib/profiles';

const DUPLICATE_PHONE = '이미 등록된 전화번호입니다. 1인당 1개의 프로필만 등록하실 수 있습니다.';

// Older rows may store the phone with separators, so match on digits only.
async function findProfileId(supabase: SupabaseClient, phone: string): Promise<string | null> {
  const { data, error } = await supabase.from('profiles').select('id, phone');
  if (error) throw new Error(error.message);
  return data?.find((row) => digitsOnly(row.phone) === phone)?.id ?? null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, nickname, phone, gender, age, height, location, preferredPartnerDetail, selfIntro } = body;

    if (!name?.trim() || !nickname?.trim() || !phone?.trim() || !gender || !age || !height || !location?.trim()) {
      return fail('필수 기본 인적사항이 모두 입력되지 않았습니다.', 400);
    }
    if (!preferredPartnerDetail?.trim() || !selfIntro?.trim()) {
      return fail('선호하는 이성과 자기소개 내용을 상세히 입력해주세요.', 400);
    }

    if (!isSupabaseConfigured) {
      return json({
        success: true,
        message: '프로필이 정상 접수되었습니다. (데모 모드)',
        data: { id: `demo-${Date.now()}`, ...body, created_at: new Date().toISOString() },
        isDemo: true,
      });
    }

    const supabase = createServerSupabaseClient();
    const cleanPhone = digitsOnly(phone);
    if (await findProfileId(supabase, cleanPhone)) return fail(DUPLICATE_PHONE, 409);

    const { data, error } = await supabase
      .from('profiles')
      .insert([{ ...toProfileRow(body), phone: cleanPhone, photos: await uploadPhotos(supabase, cleanPhone, body.photos) }])
      .select();

    if (error) {
      console.error('Supabase DB Insert Error:', error);
      if (error.code === '23505') return fail(DUPLICATE_PHONE, 409);
      return fail(`Supabase 저장 실패 [${error.code || 'DB_ERROR'}]: ${error.message}`, 500);
    }

    return json({ success: true, message: '프로필이 저장되었습니다.', data });
  } catch (err) {
    console.error('Profile API handler error:', err);
    return fail(errorMessage(err), 500);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const cleanPhone = digitsOnly(body.phone);

    if (!cleanPhone && !body.id) {
      return fail('수정할 프로필의 전화번호 또는 식별자가 필요합니다.', 400);
    }

    if (!isSupabaseConfigured) {
      return json({ success: true, message: '프로필이 수정되었습니다. (데모 모드)', data: body, isDemo: true });
    }

    const supabase = createServerSupabaseClient();
    const id = body.id || (await findProfileId(supabase, cleanPhone));
    if (!id) return fail('수정할 프로필을 찾을 수 없습니다.', 404);

    const row = toProfileRow(body);
    if (body.photos !== undefined) row.photos = await uploadPhotos(supabase, cleanPhone, body.photos);

    const { data, error } = await supabase.from('profiles').update(row).eq('id', id).select();
    if (error) {
      console.error('Supabase Profile Update Error:', error);
      return fail(`프로필 수정 실패: ${error.message}`, 500);
    }
    if (!data?.length) return fail('프로필이 수정되지 않았습니다. 잠시 후 다시 시도해주세요.', 500);

    return json({ success: true, message: '프로필이 성공적으로 수정되었습니다.', data: normalizeProfile(data[0]) });
  } catch (err) {
    return fail(errorMessage(err), 500);
  }
}

export async function GET(request: Request) {
  const phone = digitsOnly(new URL(request.url).searchParams.get('phone'));

  if (!isSupabaseConfigured) {
    return json({ success: true, isDemo: true, data: null, exists: false, message: 'Supabase 연결 정보가 설정되지 않았습니다.' });
  }
  if (!phone) return fail('조회할 전화번호가 필요합니다.', 400);

  try {
    const supabase = createServerSupabaseClient();
    const id = await findProfileId(supabase, phone);
    if (!id) return json({ success: true, exists: false, data: null });

    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) return fail(error.message, 500);
    return json({ success: true, exists: true, data: normalizeProfile(data) });
  } catch (err) {
    return fail(errorMessage(err, '알 수 없는 서버 오류'), 500);
  }
}
