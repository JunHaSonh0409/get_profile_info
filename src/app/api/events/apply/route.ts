import { NextResponse } from 'next/server';
import { createApplication } from '@/lib/applications';
import { getEventBySlug } from '@/lib/events';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventSlug, name, phone, gender, age, memo } = body;

    if (!eventSlug) {
      return NextResponse.json({ success: false, error: '이벤트 슬러그가 필요합니다.' }, { status: 400 });
    }

    const event = await getEventBySlug(eventSlug);
    if (!event) {
      return NextResponse.json({ success: false, error: '존재하지 않는 이벤트입니다.' }, { status: 404 });
    }

    if (event.status !== 'ongoing') {
      return NextResponse.json(
        { success: false, error: '현재 신청 접수 중인 이벤트가 아닙니다. (오픈 대기중이거나 마감됨)' },
        { status: 400 }
      );
    }

    const result = await createApplication({
      eventSlug,
      volNumber: event.volNumber,
      name,
      phone,
      gender: gender || '',
      age: age || '',
      status: 'confirmed',
      memo: memo || '',
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${event.volNumber} 이벤트 참가 신청이 완료되었습니다!`,
      application: result.application,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || '신청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
