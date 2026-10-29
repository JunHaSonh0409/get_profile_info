import type { OrbitEvent } from '@/types/event';
import { createEvent, deleteEvent, getEventBySlug, updateEvent } from '@/lib/events';
import { resolveEvents } from '@/lib/eventFlow';
import { fail, failWith, json, requireAdmin } from '@/lib/http';

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    return json({ success: true, events: await resolveEvents() });
  } catch (err) {
    return failWith(err, '이벤트를 불러오지 못했어요.');
  }
}

/** Creates or edits an event card. Stage changes go through /status and /selection, never here. */
export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as Partial<OrbitEvent>;
    const slug = String(body.slug || '').toLowerCase();
    if (!/^[a-z0-9_-]{2,40}$/.test(slug)) return fail('페이지 주소는 영문 소문자, 숫자, -, _ 로 2~40자예요.', 400);
    if (!body.title?.trim() || !body.volNumber?.trim()) return fail('회차와 제목은 꼭 입력해야 해요.', 400);

    const fields: Partial<OrbitEvent> = {
      volNumber: body.volNumber.trim(),
      title: body.title.trim(),
      subtitle: body.subtitle ?? '',
      imageUrl: body.imageUrl ?? '',
      date: body.date ?? '',
      location: body.location ?? '',
      capacity: body.capacity ?? '',
      content: body.content ?? '',
      description: body.content ?? body.description ?? '',
      applyEndsAt: body.applyEndsAt || null,
      likeEndsAt: body.likeEndsAt || null,
      chooseEndsAt: body.chooseEndsAt || null,
    };
    const event = (await getEventBySlug(slug)) ? await updateEvent(slug, fields) : await createEvent({ ...fields, slug });
    return json({ success: true, event });
  } catch (err) {
    return failWith(err, '이벤트를 저장하지 못했어요.');
  }
}

export async function DELETE(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug) return fail('slug가 필요해요.', 400);
  try {
    await deleteEvent(slug);
    return json({ success: true });
  } catch (err) {
    return failWith(err, '이벤트를 삭제하지 못했어요.');
  }
}
