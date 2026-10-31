import { publishSelection } from '@/lib/eventFlow';
import { fail, failWith, isUuid, json, requireAdmin } from '@/lib/http';

/** Saves the selected applicants and publishes them on the lineup page (one-shot). */
export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { slug, ids } = await request.json();
    if (!slug || !Array.isArray(ids) || !ids.every(isUuid)) return fail('slug와 선별 목록이 필요해요.', 400);
    const event = await publishSelection(slug, ids);
    return json({ success: true, event });
  } catch (err) {
    return failWith(err, '선별을 공개하지 못했어요.');
  }
}
