import { NextResponse } from 'next/server';

const OCTOMO_RECEIVING_NUMBER = '1666-3538';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');

    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return NextResponse.json(
        { success: false, error: "전화번호는 '-' 없이 10~11자리 숫자로 입력해주세요." },
        { status: 400 }
      );
    }

    // Generate random 4-digit code (e.g., 4920)
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const verificationText = `OCTOMO 인증 ${randomCode}`;

    return NextResponse.json({
      success: true,
      targetNumber: OCTOMO_RECEIVING_NUMBER,
      text: verificationText,
      code: String(randomCode),
      expiresInSeconds: 300,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
