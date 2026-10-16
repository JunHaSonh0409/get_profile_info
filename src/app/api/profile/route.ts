import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here'
);

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
      preferredPartnerDetail,
      selfIntro,
    } = body;

    // Validate required fields
    if (!name?.trim() || !nickname?.trim() || !phone?.trim() || !gender || !age || !height || !location?.trim()) {
      return NextResponse.json(
        { success: false, error: '필수 기본 인적사항이 모두 입력되지 않았습니다.' },
        { status: 400 }
      );
    }

    if (!preferredPartnerDetail?.trim() || !selfIntro?.trim()) {
      return NextResponse.json(
        { success: false, error: '선호하는 이성과 자기소개 내용을 상세히 입력해주세요.' },
        { status: 400 }
      );
    }

    // If Supabase is configured, insert into the profiles table
    if (isConfigured) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            name: name.trim(),
            nickname: nickname.trim(),
            phone: phone.trim(),
            gender,
            age: Number(age),
            height: Number(height),
            location: location.trim(),
            preferred_animals: preferredAnimals || [],
            preferred_partner_detail: preferredPartnerDetail.trim(),
            self_intro: selfIntro.trim(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return NextResponse.json(
          { success: false, error: `Supabase 저장 실패: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '프로필이 성공적으로 저장되었습니다.',
        data,
        source: 'supabase',
      });
    }

    // Fallback mode when Supabase is not yet connected
    console.warn('Supabase credentials not configured. Running in local simulated mode.');
    return NextResponse.json({
      success: true,
      message: '프로필이 성공적으로 접수되었습니다. (데모 모드: Supabase 환경변수 설정 시 DB에 자동 저장됩니다.)',
      data: {
        id: 'demo-' + Date.now(),
        ...body,
        created_at: new Date().toISOString(),
      },
      source: 'demo_local',
      isDemo: true,
    });
  } catch (err: unknown) {
    console.error('Profile submission error:', err);
    const errorMessage = err instanceof Error ? err.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch latest profiles (for checking/testing)
export async function GET() {
  if (!isConfigured) {
    return NextResponse.json({
      success: true,
      isDemo: true,
      data: [],
      message: 'Supabase가 아직 연결되지 않았습니다.',
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
