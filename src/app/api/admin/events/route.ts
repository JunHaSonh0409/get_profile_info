import { deleteEvent, getAllEvents, upsertEvent } from '@/lib/events';
import { errorMessage, fail, json, requireAdmin } from '@/lib/http';

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    return json({ success: true, events: await getAllEvents() });
  } catch (err) {
    return fail(errorMessage(err, 'Failed to load events'), 500);
  }
}

export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    if (!body.slug) return fail('Slug (e.g. vol01) is required', 400);
    return json({ success: true, event: await upsertEvent(body) });
  } catch (err) {
    return fail(errorMessage(err, 'Failed to save event'), 500);
  }
}

export async function DELETE(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug) return fail('Slug is required', 400);

  try {
    await deleteEvent(slug);
    return json({ success: true });
  } catch (err) {
    return fail(errorMessage(err, 'Failed to delete event'), 500);
  }
}
