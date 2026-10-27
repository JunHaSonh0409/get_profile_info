import { connection } from 'next/server';
import { getAllEvents } from '@/lib/events';
import { errorMessage, fail, json } from '@/lib/http';

export async function GET() {
  await connection(); // events change at runtime; never prerender this response
  try {
    return json({ success: true, events: await getAllEvents() });
  } catch (err) {
    return fail(errorMessage(err, 'Failed to fetch events'), 500);
  }
}
