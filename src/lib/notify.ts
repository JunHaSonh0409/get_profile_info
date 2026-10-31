import crypto from 'crypto';
import { readEnv } from '@/lib/sessionToken';

// KakaoTalk 알림톡 via SOLAPI (https://solapi.com). Templates must be registered and approved in the
// SOLAPI console first; their variables must match the keys sent below. Without configuration every
// send is skipped (returns false) so the event flow keeps working.

const ENDPOINT = 'https://api.solapi.com/messages/v4/send-many/detail';

// Only the match result is pushed; likes are shown on the lineup page instead.
export type AlimtalkTemplate = 'match';

const TEMPLATE_ENV: Record<AlimtalkTemplate, string> = {
  match: 'SOLAPI_TEMPLATE_MATCH',
};

/** Alimtalk allows 1,000 characters after substitution, so long profile fields are clipped. */
export const clip = (text: unknown, max = 180) => {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s || '-';
};

function authorization(apiKey: string, apiSecret: string) {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString('hex');
  const signature = crypto.createHmac('sha256', apiSecret).update(date + salt).digest('hex');
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

/** Sends one 알림톡. Returns true when SOLAPI accepted it. Never throws. */
export async function sendAlimtalk(template: AlimtalkTemplate, to: string, variables: Record<string, string>): Promise<boolean> {
  const apiKey = readEnv('SOLAPI_API_KEY');
  const apiSecret = readEnv('SOLAPI_API_SECRET');
  const pfId = readEnv('SOLAPI_PF_ID');
  const templateId = readEnv(TEMPLATE_ENV[template]);
  if (!apiKey || !apiSecret || !pfId || !templateId) {
    console.info(`[alimtalk] ${template} skipped: SOLAPI is not configured.`);
    return false;
  }

  // With a registered sender number, failed 알림톡 falls back to SMS/LMS.
  const from = readEnv('SOLAPI_SENDER');
  const message = {
    to,
    type: 'ATA',
    ...(from ? { from } : {}),
    kakaoOptions: {
      pfId,
      templateId,
      disableSms: !from,
      variables: Object.fromEntries(Object.entries(variables).map(([k, v]) => [`#{${k}}`, v])),
    },
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: authorization(apiKey, apiSecret), 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [message] }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`[alimtalk] ${template} failed:`, res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[alimtalk] ${template} error:`, err);
    return false;
  }
}
