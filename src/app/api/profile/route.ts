import { createServerSupabaseClient } from '@/lib/supabase';
import { fail, failWith, json, requireMember } from '@/lib/http';
import { memberCookie } from '@/lib/memberAuth';
import { deletePhotos, findProfileByPhone, normalizeProfile, toProfileRow, uploadPhotos } from '@/lib/profiles';

const DUPLICATE_PHONE = '이미 등록된 전화번호예요. 1인당 1개의 프로필만 등록할 수 있어요.';

// Every handler acts only on the profile of the phone in the member session cookie;
// phone/id sent by the client are ignored.

/** The logged-in member's own profile. `phone` is the session's phone, for starting registration. */
export async function GET(request: Request) {
  const phone = requireMember(request);
  if (typeof phone !== 'string') return phone;
  try {
    const profile = await findProfileByPhone(createServerSupabaseClient(), phone);
    return json({ success: true, phone, exists: Boolean(profile), data: profile ? normalizeProfile(profile) : null });
  } catch (err) {
    return failWith(err, '프로필을 불러오지 못했어요.');
  }
}

export async function POST(request: Request) {
  const phone = requireMember(request);
  if (typeof phone !== 'string') return phone;
  try {
    const body = await request.json();
    const row = toProfileRow(body);
    const supabase = createServerSupabaseClient();
    if (await findProfileByPhone(supabase, phone)) return fail(DUPLICATE_PHONE, 409);

    const { data, error } = await supabase
      .from('profiles')
      .insert({ ...row, phone, photos: await uploadPhotos(supabase, body.photos) })
      .select()
      .single();
    if (error?.code === '23505') return fail(DUPLICATE_PHONE, 409);
    if (error) throw new Error(error.message);
    return json({ success: true, data: normalizeProfile(data) });
  } catch (err) {
    return failWith(err, '프로필을 저장하지 못했어요.');
  }
}

export async function PUT(request: Request) {
  const phone = requireMember(request);
  if (typeof phone !== 'string') return phone;
  try {
    const body = await request.json();
    const row = toProfileRow(body, { partial: true });
    const supabase = createServerSupabaseClient();
    const current = await findProfileByPhone(supabase, phone);
    if (!current) return fail('수정할 프로필을 찾을 수 없어요.', 404);
    if (body.photos !== undefined) row.photos = await uploadPhotos(supabase, body.photos);

    const { data, error } = await supabase.from('profiles').update(row).eq('id', current.id).select().single();
    if (error) throw new Error(error.message);
    if (row.photos) await deletePhotos(supabase, (current.photos || []).filter((url: string) => !row.photos.includes(url)));
    return json({ success: true, data: normalizeProfile(data) });
  } catch (err) {
    return failWith(err, '프로필을 수정하지 못했어요.');
  }
}

/** 회원 탈퇴: deletes the profile (applications, likes and matches cascade), its photos, and the session. */
export async function DELETE(request: Request) {
  const phone = requireMember(request);
  if (typeof phone !== 'string') return phone;
  try {
    const supabase = createServerSupabaseClient();
    const current = await findProfileByPhone(supabase, phone);
    if (current) {
      const { error } = await supabase.from('profiles').delete().eq('id', current.id);
      if (error) throw new Error(error.message);
      await deletePhotos(supabase, current.photos);
    }
    const response = json({ success: true });
    response.headers.set('Set-Cookie', memberCookie(''));
    return response;
  } catch (err) {
    return failWith(err, '탈퇴를 처리하지 못했어요.');
  }
}
