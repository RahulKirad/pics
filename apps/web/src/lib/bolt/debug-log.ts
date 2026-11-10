import { getBoltEnv } from '@/lib/bolt/config';

export type DebugLevel = 'info' | 'warn' | 'error';

export interface DebugEntry {
  id: string;
  level: DebugLevel;
  message: string;
  detail?: string;
  stack?: string;
  context?: Record<string, unknown>;
  at: string;
  url: string;
}

const STORAGE_KEY = 'picsharenow:debug-log';
const MAX_ENTRIES = 200;

function read(): DebugEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DebugEntry[];
  } catch {
    return [];
  }
}

function write(entries: DebugEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // quota — ignore
  }
}

export function logDebug(
  level: DebugLevel,
  message: string,
  options?: { detail?: string; error?: unknown; context?: Record<string, unknown> },
) {
  const err = options?.error;
  const entry: DebugEntry = {
    id: crypto.randomUUID(),
    level,
    message,
    detail: options?.detail,
    stack: err instanceof Error ? err.stack : undefined,
    context: options?.context,
    at: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
  };

  const next = [...read(), entry];
  write(next);

  const prefix = `[PicShareNow ${level}]`;
  if (level === 'error') console.error(prefix, message, err ?? options?.detail);
  else if (level === 'warn') console.warn(prefix, message, options?.detail);
  else console.info(prefix, message);
}

export function getDebugEntries(): DebugEntry[] {
  return [...read()].reverse();
}

export function clearDebugEntries() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportDebugBundle() {
  const env = getBoltEnv();
  return {
    generatedAt: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    origin: env.hostingUrl,
    runtimeMode: env.mode,
    boltConfigured: env.configured,
    buildId: env.buildId,
    geminiConfigured: Boolean(import.meta.env.VITE_GEMINI_API_KEY),
    entries: getDebugEntries(),
  };
}
