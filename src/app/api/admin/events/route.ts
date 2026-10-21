import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/adminAuth';
import { getAllEvents, upsertEvent, getLocalEvents, saveLocalEvents } from '@/lib/events';
import { supabase } from '@/lib/supabase';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const verification = verifyAdminSessionToken(sessionToken);
  return verification.valid;
}

export async function GET() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const events = await getAllEvents();
    return NextResponse.json({ success: true, events });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load events' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.slug) {
      return NextResponse.json(
        { success: false, error: 'Slug (e.g. vol01) is required' },
        { status: 400 }
      );
    }

    const updatedEvent = await upsertEvent(body);
    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save event' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 });
    }

    const events = getLocalEvents().filter((e) => e.slug.toLowerCase() !== slug.toLowerCase());
    saveLocalEvents(events);

    if (supabase) {
      try {
        await supabase.from('events').delete().eq('slug', slug);
      } catch (e) {
        // ignore
      }
    }

    return NextResponse.json({ success: true, message: 'Event deleted successfully' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete event' },
      { status: 500 }
    );
  }
}
