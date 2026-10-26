import { NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';

const securityHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

export interface AdminProfileRecord {
  id: string;
  name?: string;
  nickname?: string;
  phone?: string;
  gender?: string;
  age?: string | number;
  height?: number;
  location?: string;
  mbti?: string;
  preferred_animals?: string[];
  preferredAnimals?: string[];
  preferred_appearance_detail?: string;
  preferredAppearanceDetail?: string;
  preferred_partner_detail?: string;
  preferredPartnerDetail?: string;
  self_intro?: string;
  selfIntro?: string;
  photos?: string[];
  created_at?: string;
  [key: string]: any;
}

function normalizeAdminProfile(row: Record<string, any>): AdminProfileRecord {
  if (!row) return row as AdminProfileRecord;
  return {
    ...row,
    id: row.id,
    mbti: row.mbti || '',
    preferredAnimals: row.preferred_animals || row.preferredAnimals || [],
    preferredAppearanceDetail: row.preferred_appearance_detail || row.preferredAppearanceDetail || '',
    preferredPartnerDetail: row.preferred_partner_detail || row.preferredPartnerDetail || '',
    selfIntro: row.self_intro || row.selfIntro || '',
    photos: Array.isArray(row.photos) ? row.photos : [],
  };
}

/**
 * GET: Fetch all profiles + comprehensive statistics (Admin Only)
 */
export async function GET(request: Request) {
  // 1. Strict Admin Session Check
  const session = getAdminSessionFromRequest(request);
  if (!session.authenticated) {
    return NextResponse.json(
      { success: false, error: '접근 권한이 없습니다. 관리자 로그인이 필요합니다.' },
      { status: 401, headers: securityHeaders }
    );
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json(
      {
        success: true,
        data: [],
        stats: {
          total: 0,
          male: 0,
          female: 0,
          withPhotos: 0,
          withoutPhotos: 0,
          today: 0,
        },
        message: 'Supabase가 구성되지 않은 데모 모드입니다.',
      },
      { status: 200, headers: securityHeaders }
    );
  }

  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error for admin:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500, headers: securityHeaders }
      );
    }

    const profiles = (data || []).map(normalizeAdminProfile);

    // Compute live stats
    const todayStr = new Date().toISOString().slice(0, 10);
    const stats = {
      total: profiles.length,
      male: profiles.filter((p) => p.gender === 'male' || p.gender === '남성').length,
      female: profiles.filter((p) => p.gender === 'female' || p.gender === '여성').length,
      withPhotos: profiles.filter((p) => Array.isArray(p.photos) && p.photos.length > 0).length,
      withoutPhotos: profiles.filter((p) => !Array.isArray(p.photos) || p.photos.length === 0).length,
      today: profiles.filter((p) => String(p.created_at || '').startsWith(todayStr)).length,
    };

    return NextResponse.json(
      {
        success: true,
        data: profiles,
        stats,
        adminUser: session.username,
      },
      { status: 200, headers: securityHeaders }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500, headers: securityHeaders }
    );
  }
}

/**
 * DELETE: Delete a profile by ID (Admin Only)
 */
export async function DELETE(request: Request) {
  // 1. Strict Admin Session Check
  const session = getAdminSessionFromRequest(request);
  if (!session.authenticated) {
    return NextResponse.json(
      { success: false, error: '접근 권한이 없습니다. 관리자 로그인이 필요합니다.' },
      { status: 401, headers: securityHeaders }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '삭제할 프로필의 고유 ID가 필요합니다.' },
        { status: 400, headers: securityHeaders }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { success: true, message: '데모 모드: 삭제 요청이 성공적으로 처리되었습니다.' },
        { status: 200, headers: securityHeaders }
      );
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase profile deletion error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500, headers: securityHeaders }
      );
    }

    return NextResponse.json(
      { success: true, message: '해당 프로필이 안전하게 삭제되었습니다.' },
      { status: 200, headers: securityHeaders }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '서버 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500, headers: securityHeaders }
    );
  }
}
