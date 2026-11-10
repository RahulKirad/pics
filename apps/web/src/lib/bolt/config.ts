export type BoltRuntimeMode = 'bolt' | 'local_demo';

export function getBoltEnv() {
  const url =
    import.meta.env.VITE_BOLT_DATABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL ||
    '';
  const anonKey =
    import.meta.env.VITE_BOLT_DATABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    '';
  const bucket =
    import.meta.env.VITE_BOLT_STORAGE_BUCKET ||
    import.meta.env.VITE_SUPABASE_STORAGE_BUCKET ||
    'event-photos';

  const configured = Boolean(url && anonKey);

  return {
    url,
    anonKey,
    bucket,
    configured,
    mode: (configured ? 'bolt' : 'local_demo') as BoltRuntimeMode,
    hostingUrl: typeof window !== 'undefined' ? window.location.origin : '',
    buildId: import.meta.env.VITE_APP_BUILD_ID ?? 'dev',
  };
}
