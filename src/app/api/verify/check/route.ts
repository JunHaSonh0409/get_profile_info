import { fail, failWith, json } from '@/lib/http';
import { digitsOnly } from '@/lib/format';
import { challengeText, clearChallengeCookie, createMemberSessionToken, isMemberAuthConfigured, memberCookie, readChallenge } from '@/lib/memberAuth';
import { getClientIp, hit } from '@/lib/rateLimit';

const OCTOMO_API_KEY = (process.env.OCTOMO_API_KEY || '').trim();

/** Success response that logs the member in with a signed session cookie and spends the challenge. */
function verifiedResponse(phone: string, body: Record<string, unknown>) {
  const response = json({ success: true, verified: true, ...body });
  response.headers.append('Set-Cookie', memberCookie(createMemberSessionToken(phone)));
  response.headers.append('Set-Cookie', clearChallengeCookie());
  return response;
}

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    const clean = digitsOnly(phone);
    if (!clean) return fail('휴대폰 번호가 필요해요.', 400);

    if (!isMemberAuthConfigured()) {
      console.error('Member auth is not configured: set MEMBER_SESSION_SECRET.');
      return fail('로그인이 서버에 설정되지 않았어요. 관리자에게 문의해주세요.', 503);
    }

    // The login screen polls every 3 seconds for 5 minutes; this caps anything beyond that.
    const wait = hit(`verify-check:ip:${getClientIp(request)}`, 150, 10 * 60 * 1000);
    if (wait) return fail('확인 요청이 너무 잦아요. 잠시 뒤에 다시 시도해주세요.', 429);

    const code = readChallenge(request, clean);
    if (!code) return fail('인증 시간이 끝났거나 다른 번호의 요청이에요. 인증을 다시 받아주세요.', 400);

    if (!OCTOMO_API_KEY) {
      // Demo pass lets anyone log in as any number, so it must never run in production.
      if (process.env.NODE_ENV === 'production') {
        console.error('OCTOMO_API_KEY not configured in production. Refusing to verify.');
        return fail('휴대폰 인증이 서버에 설정되지 않았어요. 관리자에게 문의해주세요.', 503);
      }
      console.warn('OCTOMO_API_KEY not configured. Running in demo pass mode (development only).');
      return verifiedResponse(clean, { isDemo: true });
    }

    const response = await fetch('https://api.octoverse.kr/octomo/v1/public/message/exists', {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Octomo ${OCTOMO_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNum: clean, text: challengeText(code), withinMinutes: 5 }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error('Octomo API call error:', response.status, await response.text());
      return fail('인증 서버와 통신하지 못했어요. 잠시 뒤에 다시 시도해주세요.', 502);
    }

    if ((await response.json())?.exists !== true) {
      return json({ success: true, verified: false, message: '아직 인증 문자가 도착하지 않았어요. 문자를 보낸 뒤 다시 확인해주세요.' });
    }
    return verifiedResponse(clean, {});
  } catch (err) {
    return failWith(err, '인증을 확인하지 못했어요.');
  }
}
