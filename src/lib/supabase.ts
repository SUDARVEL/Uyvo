import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { createAuthStorage } from '@/lib/auth-storage';

let client: SupabaseClient | null | undefined;

export function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';
  if (!url || !key) return null;
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return supabaseConfig() !== null;
}

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const config = supabaseConfig();
  if (!config) {
    client = null;
    return client;
  }
  client = createClient(config.url, config.key, {
    auth: {
      storage: createAuthStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}
