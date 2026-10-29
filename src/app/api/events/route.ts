import { connection } from 'next/server';
import { resolveEvents } from '@/lib/eventFlow';
import { failWith, json } from '@/lib/http';

export async function GET() {
  await connection(); // events change at runtime; never prerender this response
  try {
    return json({ success: true, events: await resolveEvents() });
  } catch (err) {
    return failWith(err, '이벤트를 불러오지 못했어요.');
  }
}
