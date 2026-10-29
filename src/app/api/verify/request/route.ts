import { errorMessage, fail, json } from '@/lib/http';
import { digitsOnly } from '@/lib/format';

const OCTOMO_RECEIVING_NUMBER = '1666-3538';

// The user sends this text by SMS to the OCTOMO number; /api/verify/check then
// asks OCTOMO whether that message arrived from the user's phone.
export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    const clean = digitsOnly(phone);
    if (clean.length < 10 || clean.length > 11) {
      return fail("전화번호는 '-' 없이 10~11자리 숫자로 입력해주세요.", 400);
    }

    const code = String(Math.floor(1000 + Math.random() * 9000));
    return json({
      success: true,
      targetNumber: OCTOMO_RECEIVING_NUMBER,
      text: `OCTOMO 인증 ${code}`,
      code,
      expiresInSeconds: 300,
    });
  } catch (err) {
    return fail(errorMessage(err, '알 수 없는 오류'), 500);
  }
}
