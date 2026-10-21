import { NextResponse } from 'next/server';
import { getAllEvents } from '@/lib/events';

export async function GET(request: Request) {
  try {
    const events = await getAllEvents();
    return NextResponse.json(
      { success: true, events },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
