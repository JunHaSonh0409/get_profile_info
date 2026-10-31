import { randomInt } from 'crypto';
import { fail, failWith, json } from '@/lib/http';
import { digitsOnly } from '@/lib/format';
import { CHALLENGE_SECONDS, challengeCookie, challengeText, isMemberAuthConfigured } from '@/lib/memberAuth';
import { getClientIp, hit } from '@/lib/rateLimit';

const OCTOMO_RECEIVING_NUMBER = '1666-3538';
const TEN_MINUTES = 10 * 60 * 1000;

// The user sends this text by SMS to the OCTOMO number; /api/verify/check then asks OCTOMO whether
// that message arrived from the user's phone. The code is random per request and bound to the phone.
export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    const clean = digitsOnly(phone);
    if (!/^01\d{8,9}$/.test(clean)) return fail("휴대폰 번호를 '-' 없이 10~11자리 숫자로 입력해주세요.", 400);
    if (!isMemberAuthConfigured()) {
      console.error('Member auth is not configured: set MEMBER_SESSION_SECRET.');
      return fail('로그인이 서버에 설정되지 않았어요. 관리자에게 문의해주세요.', 503);
    }

    const wait = hit(`verify-req:ip:${getClientIp(request)}`, 20, TEN_MINUTES) || hit(`verify-req:phone:${clean}`, 5, TEN_MINUTES);
    if (wait) return fail(`인증 요청이 너무 잦아요. ${Math.ceil(wait / 60)}분 뒤에 다시 시도해주세요.`, 429);

    const code = String(randomInt(100000, 1000000));
    const response = json({ success: true, targetNumber: OCTOMO_RECEIVING_NUMBER, text: challengeText(code), expiresInSeconds: CHALLENGE_SECONDS });
    response.headers.set('Set-Cookie', challengeCookie(clean, code));
    return response;
  } catch (err) {
    return failWith(err, '인증 요청에 실패했어요.');
  }
}
