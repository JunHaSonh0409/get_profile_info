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
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
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

      const profilePayload: Record<string, unknown> = {
        name: name.trim(),
        nickname: nickname.trim(),
        phone: String(phone).replace(/[^0-9]/g, '').trim(),
        gender,
        age: String(age).endsWith('년생') ? String(age).trim() : `${String(age).trim()}년생`,
        height: Number(height),
        location: location.trim(),
        preferred_animals: Array.isArray(preferredAnimals) ? preferredAnimals : [],
        preferred_appearance_detail: preferredAppearanceDetail ? preferredAppearanceDetail.trim() : '',
        preferred_partner_detail: preferredPartnerDetail.trim(),
        self_intro: selfIntro.trim(),
      };

      let { data, error } = await supabase
        .from('profiles')
        .insert([profilePayload])
        .select()
        .single();

      // If preferred_appearance_detail column doesn't exist yet in DB (code 42703), retry without it
      if (error && error.code === '42703') {
        console.warn('preferred_appearance_detail column not yet created in Supabase. Retrying without it.');
        const fallbackPayload = { ...profilePayload };
        delete fallbackPayload.preferred_appearance_detail;
        const retryResult = await supabase
          .from('profiles')
          .insert([fallbackPayload])
          .select()
          .single();
        data = retryResult.data;
        error = retryResult.error;
      }

      if (error) {
        console.error('Supabase DB Insert Error:', error);
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

export async function GET() {
  if (!isConfigured) {
    return NextResponse.json(
      {
        success: true,
        isDemo: true,
        data: [],
        message: 'Supabase 연결 정보가 설정되지 않았습니다.',
      },
      { headers: corsHeaders }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Supabase DB Fetch Error:', error);
      return NextResponse.json(
        { success: false, error: error.message, details: error },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, count: data?.length || 0, data: data || [] },
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
