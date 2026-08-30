#!/usr/bin/env node

const BASE_URL = process.env.LOAD_TEST_URL ?? 'http://localhost:3001';
const PATH = process.env.LOAD_TEST_PATH ?? '/api/v1/health';
const CONCURRENCY = Number(process.env.LOAD_TEST_CONCURRENCY ?? 25);
const DURATION_SEC = Number(process.env.LOAD_TEST_DURATION_SEC ?? 20);

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

async function requestOnce(url) {
  const started = performance.now();
  const response = await fetch(url);
  const elapsed = performance.now() - started;
  const body = await response.text();
  return { ok: response.ok, status: response.status, elapsed, bodyLength: body.length };
}

async function worker(url, stopAt, results) {
  while (Date.now() < stopAt) {
    try {
      results.push(await requestOnce(url));
    } catch (error) {
      results.push({
        ok: false,
        status: 0,
        elapsed: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

async function main() {
  const url = new URL(PATH, BASE_URL).toString();
  const stopAt = Date.now() + DURATION_SEC * 1000;
  const results = [];

  console.log(`Load test: ${url}`);
  console.log(`Concurrency: ${CONCURRENCY}, duration: ${DURATION_SEC}s`);

  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker(url, stopAt, results)),
  );

  const successes = results.filter((item) => item.ok);
  const failures = results.length - successes.length;
  const latencies = successes.map((item) => item.elapsed);
  const durationMs = DURATION_SEC * 1000;
  const rps = results.length / (durationMs / 1000);

  console.log('\nResults');
  console.log(`Total requests: ${results.length}`);
  console.log(`Success: ${successes.length}`);
  console.log(`Failures: ${failures}`);
  console.log(`Throughput: ${rps.toFixed(1)} req/s`);
  if (latencies.length > 0) {
    console.log(`Latency p50: ${percentile(latencies, 50).toFixed(1)} ms`);
    console.log(`Latency p95: ${percentile(latencies, 95).toFixed(1)} ms`);
    console.log(`Latency p99: ${percentile(latencies, 99).toFixed(1)} ms`);
  }

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
