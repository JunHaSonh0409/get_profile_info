import { errorMessage, fail, json } from '@/lib/http';
import { digitsOnly } from '@/lib/format';

const OCTOMO_API_KEY = (process.env.OCTOMO_API_KEY || '').trim();

export async function POST(request: Request) {
  try {
    const { phone, text } = await request.json();
    const clean = digitsOnly(phone);
    if (!clean || !text) return fail('전화번호와 인증 문구가 필요합니다.', 400);

    if (!OCTOMO_API_KEY) {
      console.warn('OCTOMO_API_KEY not configured. Running in demo pass mode.');
      return json({ success: true, verified: true, isDemo: true, message: 'OCTOMO API 키가 없어 데모 모드로 인증되었습니다.' });
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

    const verified = (await response.json())?.exists === true;
    return json({
      success: true,
      verified,
      message: verified
        ? '전화번호 인증이 성공적으로 완료되었습니다.'
        : '아직 수신된 인증 문자가 없습니다. 문자를 발송하신 후 다시 확인해주세요.',
    });
  } catch (err) {
    console.error('Verify check error:', err);
    return fail(errorMessage(err), 500);
  }
}
