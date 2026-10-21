import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/adminAuth';
import { upsertEvent, getEventBySlug } from '@/lib/events';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const verification = verifyAdminSessionToken(sessionToken);
  return verification.valid;
}

export async function PATCH(request: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, status } = body;

    if (!slug || !status) {
      return NextResponse.json({ success: false, error: 'slug and status are required' }, { status: 400 });
    }

    const event = await getEventBySlug(slug);
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    const updated = await upsertEvent({
      ...event,
      slug,
      status,
    });

    return NextResponse.json({
      success: true,
      event: updated,
      message: `${updated.volNumber} 이벤트 상태가 [${status === 'ongoing' ? '공식 오픈' : status === 'ended' ? '종료' : '오픈 대기'}]으로 변경되었습니다.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed' }, { status: 500 });
  }
}
