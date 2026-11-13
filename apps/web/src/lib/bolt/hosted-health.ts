import { getBoltClient } from '@/lib/bolt/client';
import { getBoltEnv } from '@/lib/bolt/config';

export type HostedHealthResult = {
  ok: boolean;
  checks: Array<{ name: string; ok: boolean; detail?: string }>;
};

/** Quick smoke checks when `VITE_BOLT_*` is set (Bolt / Supabase hosted). */
export async function runHostedHealthChecks(): Promise<HostedHealthResult> {
  const checks: HostedHealthResult['checks'] = [];

  if (!getBoltEnv().configured) {
    return {
      ok: true,
      checks: [{ name: 'Runtime', ok: true, detail: 'local_demo — hosted DB checks skipped' }],
    };
  }

  const supabase = getBoltClient();
  if (!supabase) {
    return { ok: false, checks: [{ name: 'Client', ok: false, detail: 'Supabase client missing' }] };
  }

  try {
    const { error } = await supabase.from('events').select('id', { count: 'exact', head: true });
    checks.push({
      name: 'Database (events)',
      ok: !error,
      detail: error?.message,
    });
  } catch (err) {
    checks.push({
      name: 'Database (events)',
      ok: false,
      detail: err instanceof Error ? err.message : 'Unknown error',
    });
  }

  const env = getBoltEnv();
  try {
    const { error } = await supabase.storage.from(env.bucket).list('', { limit: 1 });
    checks.push({
      name: `Storage (${env.bucket})`,
      ok: !error,
      detail: error?.message,
    });
  } catch (err) {
    checks.push({
      name: `Storage (${env.bucket})`,
      ok: false,
      detail: err instanceof Error ? err.message : 'Unknown error',
    });
  }

  try {
    const { error } = await supabase.rpc('match_guest_faces', {
      p_event_token: '__health_probe__',
      p_query: toProbeVector(),
    });
    const ok = !error || /not found|no rows|invalid/i.test(error.message);
    checks.push({
      name: 'RPC match_guest_faces',
      ok,
      detail: error?.message ?? 'callable',
    });
  } catch (err) {
    checks.push({
      name: 'RPC match_guest_faces',
      ok: false,
      detail: err instanceof Error ? err.message : 'Unknown error',
    });
  }

  checks.push({
    name: 'Face gallery (browser)',
    ok: typeof indexedDB !== 'undefined',
    detail: 'IndexedDB stores face crops on this device',
  });

  return { ok: checks.every((c) => c.ok), checks };
}

function toProbeVector(): string {
  return `[${Array.from({ length: 128 }, () => 0).join(',')}]`;
}
