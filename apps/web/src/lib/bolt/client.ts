import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getBoltEnv } from '@/lib/bolt/config';
import { logDebug } from '@/lib/bolt/debug-log';

let client: SupabaseClient | null = null;

export function getBoltClient(): SupabaseClient | null {
  const env = getBoltEnv();
  if (!env.configured) return null;
  if (!client) {
    client = createClient(env.url, env.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    logDebug('info', 'Bolt Database client initialized', {
      context: { url: env.url, bucket: env.bucket },
    });
  }
  return client;
}

export function publicPhotoUrl(storagePath: string): string | null {
  const env = getBoltEnv();
  const supabase = getBoltClient();
  if (!supabase || !storagePath) return null;
  const { data } = supabase.storage.from(env.bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}
