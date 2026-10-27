import { errorMessage, fail, json } from '@/lib/http';
import { digitsOnly } from '@/lib/format';
import { createMemberSessionToken, isMemberAuthConfigured, memberCookie } from '@/lib/memberAuth';

const OCTOMO_API_KEY = (process.env.OCTOMO_API_KEY || '').trim();

/** Success response that also logs the member in with a signed session cookie. */
function verifiedResponse(phone: string, body: Record<string, unknown>) {
  const response = json({ success: true, verified: true, ...body });
  response.headers.set('Set-Cookie', memberCookie(createMemberSessionToken(phone)));
  return response;
}

export async function POST(request: Request) {
  try {
    const { phone, text } = await request.json();
    const clean = digitsOnly(phone);
    if (!clean || !text) return fail('전화번호와 인증 문구가 필요합니다.', 400);

    if (!isMemberAuthConfigured()) {
      console.error('Member auth is not configured: set MEMBER_SESSION_SECRET.');
      return fail('로그인이 서버에 설정되지 않았습니다. 관리자에게 문의해주세요.', 503);
    }

    if (!OCTOMO_API_KEY) {
      // Demo pass lets anyone log in as any number, so it must never run in production.
      if (process.env.NODE_ENV === 'production') {
        console.error('OCTOMO_API_KEY not configured in production. Refusing to verify.');
        return fail('휴대폰 인증이 서버에 설정되지 않았습니다. 관리자에게 문의해주세요.', 503);
      }
      console.warn('OCTOMO_API_KEY not configured. Running in demo pass mode (development only).');
      return verifiedResponse(clean, { isDemo: true, message: 'OCTOMO API 키가 없어 데모 모드로 인증되었습니다.' });
    }

    const response = await fetch('https://api.octoverse.kr/octomo/v1/public/message/exists', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Octomo ${OCTOMO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mobileNum: clean, text: String(text).trim(), withinMinutes: 5 }),
    });

    if (!response.ok) {
      console.error('Octomo API call error:', response.status, await response.text());
      return fail(`OCTOMO 서버 통신 실패 (${response.status})`, 502);
    }

    if ((await response.json())?.exists !== true) {
      return json({
        success: true,
        verified: false,
        message: '아직 수신된 인증 문자가 없습니다. 문자를 발송하신 후 다시 확인해주세요.',
      });
    }
    return verifiedResponse(clean, { message: '전화번호 인증이 성공적으로 완료되었습니다.' });
  } catch (err) {
    console.error('Verify check error:', err);
    return fail(errorMessage(err), 500);
  }
}
