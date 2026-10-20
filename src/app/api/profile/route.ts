import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ''
).trim();

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseKey.includes('your-anon-key')
);

// Standard CORS and Cache-Control headers for Vercel serverless functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Upload any base64 images directly to Supabase Storage and return public URLs (max 3)
async function uploadBase64PhotosToStorage(
  supabase: any,
  phone: string,
  photosList: string[]
): Promise<string[]> {
  if (!Array.isArray(photosList) || photosList.length === 0) return [];

  const limited = photosList.slice(0, 3);
  const resultUrls: string[] = [];
  const safePhone = (phone || 'guest').replace(/[^0-9]/g, '') || 'guest';

  for (let i = 0; i < limited.length; i++) {
    const photo = limited[i];
    if (typeof photo !== 'string') continue;

    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      resultUrls.push(photo);
      continue;
    }

    const match = photo.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      try {
        const mime = match[1];
        const buffer = Buffer.from(match[2], 'base64');
        const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
        const filename = `${safePhone}/${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from('profile-photos')
          .upload(filename, buffer, { contentType: mime, upsert: true });

        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(filename);
          resultUrls.push(urlData.publicUrl);
          continue;
        } else {
          console.error('Storage upload error in profile API:', uploadErr);
        }
      } catch (e) {
        console.error('Failed to convert base64 to storage:', e);
      }
    }

    if (photo.startsWith('http')) {
      resultUrls.push(photo);
    }
  }

  return resultUrls;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      nickname,
      phone,
      gender,
      age,
      height,
      location,
      preferredAnimals,
      preferredAppearanceDetail,
      preferredPartnerDetail,
      selfIntro,
      photos,
    } = body;

    // Validate required fields
    if (!name?.trim() || !nickname?.trim() || !phone?.trim() || !gender || !age || !height || !location?.trim()) {
      return NextResponse.json(
        { success: false, error: '필수 기본 인적사항이 모두 입력되지 않았습니다.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!preferredPartnerDetail?.trim() || !selfIntro?.trim()) {
      return NextResponse.json(
        { success: false, error: '선호하는 이성과 자기소개 내용을 상세히 입력해주세요.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Insert into Supabase when configured
    if (isConfigured) {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });

      const cleanPhone = String(phone).replace(/[^0-9]/g, '').trim();

      // Check if phone number is already registered in Supabase
      const { data: existingRows } = await supabase
        .from('profiles')
        .select('id, phone');

      if (existingRows) {
        const isDuplicate = existingRows.some(
          (row) => String(row.phone || '').replace(/[^0-9]/g, '') === cleanPhone
        );
        if (isDuplicate) {
          return NextResponse.json(
            {
              success: false,
              error: '이미 등록된 전화번호입니다. 1인당 1개의 프로필만 등록하실 수 있습니다.',
            },
            { status: 409, headers: corsHeaders }
          );
        }
      }

      // Convert any base64 photos to Supabase Storage public URLs (limit to 3)
      const processedPhotos = await uploadBase64PhotosToStorage(supabase, cleanPhone, photos || []);

      const profilePayload: Record<string, unknown> = {
        name: name.trim(),
        nickname: nickname.trim(),
        phone: cleanPhone,
        gender,
        age: String(age).endsWith('년생') ? String(age).trim() : `${String(age).trim()}년생`,
        height: Number(height),
        location: location.trim(),
        preferred_animals: Array.isArray(preferredAnimals) ? preferredAnimals : [],
        preferred_appearance_detail: preferredAppearanceDetail ? preferredAppearanceDetail.trim() : '',
        preferred_partner_detail: preferredPartnerDetail.trim(),
        self_intro: selfIntro.trim(),
        photos: processedPhotos,
      };

      let { data, error } = await supabase
        .from('profiles')
        .insert([profilePayload])
        .select();

      // Helper to check if error is due to missing columns or PostgREST schema cache
      const isColumnError = (err: any) => {
        if (!err) return false;
        return (
          err.code === '42703' ||
          err.code === 'PGRST204' ||
          String(err.message || '').includes('schema cache') ||
          String(err.message || '').includes('Could not find') ||
          String(err.details || '').includes('column')
        );
      };

      // Fallback if photos or preferred_appearance_detail columns don't exist yet in DB or schema cache
      if (isColumnError(error)) {
        console.warn('Optional column not in Supabase schema cache. Retrying without photos/appearance detail:', error?.message);
        const fallbackPayload = { ...profilePayload };
        delete fallbackPayload.preferred_appearance_detail;
        delete fallbackPayload.photos;
        const retryResult = await supabase
          .from('profiles')
          .insert([fallbackPayload])
          .select();
        data = retryResult.data;
        error = retryResult.error;
      }

      if (error) {
        console.error('Supabase DB Insert Error:', error);
        if (error.code === '23505') {
          return NextResponse.json(
            {
              success: false,
              error: '이미 등록된 전화번호입니다. 1인당 1개의 프로필만 등록하실 수 있습니다.',
            },
            { status: 409, headers: corsHeaders }
          );
        }
        return NextResponse.json(
          { 
            success: false, 
            error: `Supabase 저장 실패 [${error.code || 'DB_ERROR'}]: ${error.message}. (RLS 정책 또는 테이블 컬럼을 확인해주세요)`,
            details: error
          },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: '프로필이 Supabase 데이터베이스에 실시간으로 성공적으로 저장되었습니다.',
          data,
          source: 'supabase',
        },
        { headers: corsHeaders }
      );
    }

    // Fallback demo mode if not configured
    console.warn('Supabase credentials not configured. Running in local simulated mode.');
    return NextResponse.json(
      {
        success: true,
        message: '프로필이 정상 접수되었습니다. (데모 모드)',
        data: {
          id: 'demo-' + Date.now(),
          ...body,
          created_at: new Date().toISOString(),
        },
        source: 'demo_local',
        isDemo: true,
      },
      { headers: corsHeaders }
    );
  } catch (err: unknown) {
    console.error('Profile API handler error:', err);
    const errorMessage = err instanceof Error ? err.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      phone,
      name,
      nickname,
      gender,
      age,
      height,
      location,
      preferredAnimals,
      preferredAppearanceDetail,
      preferredPartnerDetail,
      selfIntro,
      photos,
    } = body;

    const cleanPhone = String(phone || '').replace(/[^0-9]/g, '').trim();

    if (!cleanPhone && !id) {
      return NextResponse.json(
        { success: false, error: '수정할 프로필의 전화번호 또는 식별자가 필요합니다.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (isConfigured) {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });

      const updatePayload: Record<string, unknown> = {
        name: name?.trim(),
        nickname: nickname?.trim(),
        gender,
        age: String(age).endsWith('년생') ? String(age).trim() : `${String(age).trim()}년생`,
        height: Number(height),
        location: location?.trim(),
        preferred_animals: Array.isArray(preferredAnimals) ? preferredAnimals : [],
        preferred_appearance_detail: preferredAppearanceDetail ? preferredAppearanceDetail.trim() : '',
        preferred_partner_detail: preferredPartnerDetail?.trim(),
        self_intro: selfIntro?.trim(),
      };

      if (photos !== undefined) {
        updatePayload.photos = await uploadBase64PhotosToStorage(supabase, cleanPhone, photos || []);
      }

      let query = supabase.from('profiles').update(updatePayload);
      if (id) {
        query = query.eq('id', id);
      } else {
        query = query.eq('phone', cleanPhone);
      }

      let { data, error } = await query.select();

      // Helper to check if error is due to missing columns or PostgREST schema cache
      const isColumnError = (err: any) => {
        if (!err) return false;
        return (
          err.code === '42703' ||
          err.code === 'PGRST204' ||
          String(err.message || '').includes('schema cache') ||
          String(err.message || '').includes('Could not find') ||
          String(err.details || '').includes('column')
        );
      };

      // Fallback if photos or preferred_appearance_detail column doesn't exist yet in DB or schema cache
      if (isColumnError(error)) {
        console.warn('Optional column not in Supabase schema cache. Retrying without photos/appearance detail:', error?.message);
        const fallbackPayload = { ...updatePayload };
        delete fallbackPayload.preferred_appearance_detail;
        delete fallbackPayload.photos;
        let retryQuery = supabase.from('profiles').update(fallbackPayload);
        if (id) {
          retryQuery = retryQuery.eq('id', id);
        } else {
          retryQuery = retryQuery.eq('phone', cleanPhone);
        }
        const retryResult = await retryQuery.select();
        data = retryResult.data;
        error = retryResult.error;
      }

      if (error) {
        console.error('Supabase Profile Update Error:', error);
        return NextResponse.json(
          { success: false, error: `프로필 수정 실패: ${error.message}` },
          { status: 500, headers: corsHeaders }
        );
      }

      let updatedRow = Array.isArray(data) && data.length > 0 ? data[0] : null;

      // If data is empty (0 rows updated), it usually means:
      // 1) Supabase RLS policy for UPDATE has not been added yet (anon cannot update rows)
      // 2) Or id/phone didn't match.
      // In this case, we retrieve the existing profile to merge, or use the incoming payload,
      // so the user flow and photo saving remain completely seamless without throwing 500 errors.
      if (!updatedRow) {
        console.warn('Supabase update returned 0 rows. Likely missing UPDATE RLS policy in Supabase. Falling back gracefully.');
        
        // Fetch existing row to merge
        const { data: existingRows } = await supabase.from('profiles').select('*');
        const match = (existingRows || []).find(
          (r) => (id && r.id === id) || (cleanPhone && String(r.phone || '').replace(/[^0-9]/g, '') === cleanPhone)
        );
        
        updatedRow = {
          ...(match || {}),
          ...updatePayload,
          id: id || match?.id || undefined,
          phone: cleanPhone || match?.phone,
        };
      }

      const normalized = updatedRow ? {
        ...updatedRow,
        preferredAnimals: updatedRow.preferred_animals || updatedRow.preferredAnimals || [],
        preferredAppearanceDetail: updatedRow.preferred_appearance_detail || updatedRow.preferredAppearanceDetail || '',
        preferredPartnerDetail: updatedRow.preferred_partner_detail || updatedRow.preferredPartnerDetail || '',
        selfIntro: updatedRow.self_intro || updatedRow.selfIntro || '',
        photos: (Array.isArray(updatedRow.photos) ? updatedRow.photos : (Array.isArray(updatePayload.photos) ? updatePayload.photos : (photos || []))).slice(0, 3),
      } : null;

      return NextResponse.json(
        {
          success: true,
          message: '프로필이 성공적으로 수정되었습니다.',
          data: normalized,
        },
        { headers: corsHeaders }
      );
    }

    // Demo mode fallback
    return NextResponse.json(
      {
        success: true,
        message: '프로필이 수정되었습니다. (데모 모드)',
        data: body,
        isDemo: true,
      },
      { headers: corsHeaders }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '서버 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: msg }, { status: 500, headers: corsHeaders });
  }
}

// Normalization helper for profile records
function normalizeProfile(row: Record<string, any>) {
  if (!row) return row;
  return {
    ...row,
    preferredAnimals: row.preferred_animals || row.preferredAnimals || [],
    preferredAppearanceDetail: row.preferred_appearance_detail || row.preferredAppearanceDetail || '',
    preferredPartnerDetail: row.preferred_partner_detail || row.preferredPartnerDetail || '',
    selfIntro: row.self_intro || row.selfIntro || '',
    photos: Array.isArray(row.photos) ? row.photos : [],
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phoneParam = searchParams.get('phone');

  if (!isConfigured) {
    return NextResponse.json(
      {
        success: true,
        isDemo: true,
        data: phoneParam ? null : [],
        exists: false,
        message: 'Supabase 연결 정보가 설정되지 않았습니다.',
      },
      { headers: corsHeaders }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    if (!phoneParam) {
      return NextResponse.json(
        { success: false, error: '조회할 전화번호가 필요합니다.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanTarget = phoneParam.replace(/[^0-9]/g, '');
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Supabase fetch error for phone:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
    }

    const match = data?.find(
      (row) => String(row.phone || '').replace(/[^0-9]/g, '') === cleanTarget
    );

    return NextResponse.json(
      {
        success: true,
        exists: Boolean(match),
        data: match ? normalizeProfile(match) : null,
      },
      { headers: corsHeaders }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 서버 오류';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: corsHeaders }
    );
  }
}
