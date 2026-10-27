import { deleteApplication, getApplicationStats, getApplications, updateApplicationStatus } from '@/lib/applications';
import { errorMessage, fail, json, requireAdmin } from '@/lib/http';

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const slug = new URL(request.url).searchParams.get('slug') || undefined;
    const applications = await getApplications(slug);
    return json({ success: true, applications, stats: slug ? getApplicationStats(applications) : null });
  } catch (err) {
    return fail(errorMessage(err, 'Failed'), 500);
  }
}

export async function PATCH(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const { id, status } = await request.json();
    if (!id || !['pending', 'confirmed', 'cancelled'].includes(status)) {
      return fail('id and a valid status are required', 400);
    }
    await updateApplicationStatus(id, status);
    return json({ success: true });
  } catch (err) {
    return fail(errorMessage(err, 'Failed'), 500);
  }
}

export async function DELETE(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return fail('id required', 400);

  try {
    await deleteApplication(id);
    return json({ success: true });
  } catch (err) {
    return fail(errorMessage(err, 'Failed'), 500);
  }
}
