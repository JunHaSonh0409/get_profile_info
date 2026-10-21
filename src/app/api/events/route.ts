import { NextResponse } from 'next/server';
import { getAllEvents } from '@/lib/events';

export async function GET() {
  try {
    const events = await getAllEvents();
    return NextResponse.json({ success: true, events });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
