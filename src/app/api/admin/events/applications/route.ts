import { deleteApplication } from '@/lib/applications';
import { adminBoard } from '@/lib/eventFlow';
import { fail, failWith, json, requireAdmin } from '@/lib/http';

/** Applicants of one event (with profiles, selection flags and like counts) plus its matches. */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug) return fail('slug가 필요해요.', 400);
  try {
    return json({ success: true, ...(await adminBoard(slug)) });
  } catch (err) {
    return failWith(err, '신청자 목록을 불러오지 못했어요.');
  }
}

export async function DELETE(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return fail('id가 필요해요.', 400);
  try {
    await deleteApplication(id);
    return json({ success: true });
  } catch (err) {
    return failWith(err, '신청을 삭제하지 못했어요.');
  }
}
