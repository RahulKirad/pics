import { useMemo, useState } from 'react';
import { runHostedHealthChecks, type HostedHealthResult } from '@/lib/bolt/hosted-health';
import { Link } from 'react-router-dom';
import { Copy, RefreshCw, Trash2 } from 'lucide-react';
import { getBoltEnv } from '@/lib/bolt/config';
import {
  clearDebugEntries,
  exportDebugBundle,
  getDebugEntries,
  type DebugEntry,
} from '@/lib/bolt/debug-log';

export function DebugPage() {
  const env = getBoltEnv();
  const [tick, setTick] = useState(0);
  const [hostedHealth, setHostedHealth] = useState<HostedHealthResult | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const entries = useMemo(() => getDebugEntries(), [tick]);

  const bundle = useMemo(() => exportDebugBundle(), [tick]);

  const copyBundle = async () => {
    const text = JSON.stringify(bundle, null, 2);
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fd] text-[#0f172a]">
      <header className="border-b border-[#e6eaf3] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">PicShareNow Debug</h1>
            <p className="text-sm text-[#64748b]">Share this page output when hosted on Bolt AI.</p>
          </div>
          <Link to="/" className="text-sm font-semibold text-[#1d4ed8] hover:underline">
            Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <section className="rounded-xl border border-[#e6eaf3] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#64748b]">Runtime</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <ButtonRow label="Mode" value={env.mode} />
            <ButtonRow label="Bolt configured" value={String(env.configured)} />
            <ButtonRow label="Origin" value={env.hostingUrl} />
            <ButtonRow label="Storage bucket" value={env.bucket} />
            <ButtonRow label="Build" value={env.buildId} />
            <ButtonRow
              label="Gemini assistant"
              value={import.meta.env.VITE_GEMINI_API_KEY ? 'configured' : 'missing key'}
            />
          </dl>
        </section>

        {env.configured ? (
          <section className="rounded-xl border border-[#e6eaf3] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#64748b]">
              Hosted checks
            </h2>
            <p className="mb-3 text-xs text-[#64748b]">
              Uploads, previews, faces, slideshow, and guest match all use the same browser + Bolt
              stack when env vars are set. Run this on your published URL.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg bg-[#1d4ed8] px-3 py-2 text-xs font-semibold text-white"
              disabled={healthLoading}
              onClick={async () => {
                setHealthLoading(true);
                try {
                  setHostedHealth(await runHostedHealthChecks());
                } finally {
                  setHealthLoading(false);
                }
              }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
              {healthLoading ? 'Running…' : 'Run hosted smoke test'}
            </button>
            {hostedHealth ? (
              <ul className="mt-4 space-y-2 text-sm">
                {hostedHealth.checks.map((c) => (
                  <li key={c.name} className="flex flex-wrap gap-2">
                    <span className={c.ok ? 'text-green-700' : 'text-red-700'}>
                      {c.ok ? '✓' : '✗'} {c.name}
                    </span>
                    {c.detail ? <span className="text-[#64748b]">— {c.detail}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-xl border border-[#e6eaf3] bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#64748b]">Actions</h2>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-[#e6eaf3] px-3 py-1.5 text-xs font-semibold"
              onClick={() => setTick((n) => n + 1)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-[#e6eaf3] px-3 py-1.5 text-xs font-semibold"
              onClick={copyBundle}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy JSON bundle
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
              onClick={() => {
                clearDebugEntries();
                setTick((n) => n + 1);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear log
            </button>
          </div>
          <p className="text-xs text-[#64748b]">
            Paste the copied JSON in your repo chat so we can reproduce hosted errors.
          </p>
        </section>

        <section className="rounded-xl border border-[#e6eaf3] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#64748b]">
            Recent events ({entries.length})
          </h2>
          {entries.length === 0 ? (
            <p className="text-sm text-[#64748b]">No errors logged yet.</p>
          ) : (
            <ul className="max-h-[50vh] space-y-3 overflow-y-auto">
              {entries.map((entry: DebugEntry) => (
                <li key={entry.id} className="rounded-lg border border-[#e6eaf3] p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748b]">
                    <span
                      className={
                        entry.level === 'error'
                          ? 'font-bold text-red-600'
                          : entry.level === 'warn'
                            ? 'font-bold text-amber-600'
                            : 'font-bold text-[#1d4ed8]'
                      }
                    >
                      {entry.level}
                    </span>
                    <span>{new Date(entry.at).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 font-semibold">{entry.message}</p>
                  {entry.detail ? <p className="mt-1 text-[#64748b]">{entry.detail}</p> : null}
                  {entry.stack ? (
                    <pre className="mt-2 overflow-x-auto rounded bg-[#f7f9fd] p-2 text-xs">{entry.stack}</pre>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function ButtonRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="min-w-[8rem] text-[#64748b]">{label}</dt>
      <dd className="font-medium break-all">{value}</dd>
    </div>
  );
}
