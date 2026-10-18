import { NextResponse } from 'next/server';

const OCTOMO_API_KEY = process.env.OCTOMO_API_KEY || '';

export async function POST(request: Request) {
  try {
    const { phone, text } = await request.json();
    const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');

    if (!cleanPhone || !text) {
      return NextResponse.json(
        { success: false, error: '전화번호와 인증 문구가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!OCTOMO_API_KEY) {
      console.warn('OCTOMO_API_KEY not configured. Running in demo pass mode.');
      return NextResponse.json({
        success: true,
        verified: true,
        isDemo: true,
        message: 'OCTOMO API 키가 없어 데모 모드로 인증되었습니다.',
      });
    }

    // Call Octomo API
    const response = await fetch('https://api.octoverse.kr/octomo/v1/public/message/exists', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Octomo ${OCTOMO_API_KEY.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mobileNum: cleanPhone,
        text: String(text).trim(),
        withinMinutes: 5,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Octomo API call error:', response.status, errText);
      return NextResponse.json(
        { success: false, error: `OCTOMO 서버 통신 실패 (${response.status})` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const isVerified = Boolean(data && data.exists === true);

    return NextResponse.json({
      success: true,
      verified: isVerified,
      message: isVerified
        ? '전화번호 인증이 성공적으로 완료되었습니다.'
        : '아직 수신된 인증 문자가 없습니다. 문자를 발송하신 후 다시 확인해주세요.',
    });
  } catch (err: unknown) {
    console.error('Verify check error:', err);
    const msg = err instanceof Error ? err.message : '서버 오류';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
