import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Server-only. Every table is locked by row level security, so only the service-role key works;
// there is deliberately no anon-key fallback and no demo mode (a misconfigured deploy fails loudly).
let client: SupabaseClient | null = null;

export function createServerSupabaseClient(): SupabaseClient {
  if (client) return client;
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url.startsWith('https://') || !key) throw new Error('Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
