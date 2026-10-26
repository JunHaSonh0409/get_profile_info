import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ''
).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseKey.includes('your-anon-key')
);

// Supabase client instance with realtime websocket enabled
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// Per-request server client for API routes (no session persistence)
export function createServerSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}
