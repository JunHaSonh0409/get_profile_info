import { json } from '@/lib/http';
import { memberCookie } from '@/lib/memberAuth';

export async function POST() {
  const response = json({ success: true });
  response.headers.set('Set-Cookie', memberCookie(''));
  return response;
}
