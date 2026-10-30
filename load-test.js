const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(process.argv.slice(2).map(x => {
  const [k, v] = x.replace(/^--/, '').split('=');
  return [k, v || true];
}));
const mode = args.mode === 'before' ? 'before' : 'after';
const urlPath = `/api/${mode}/posts?page=1&limit=20`;
const totalRequests = Number(args.requests || process.env.REQUESTS || 1000);
const concurrency = Number(args.concurrency || process.env.CONCURRENCY || 25);
const durations = [];
let completed = 0, failed = 0, active = 0, nextId = 0;
const startedAt = process.hrtime.bigint();
const cpuStart = process.cpuUsage();

function requestOne() {
  return new Promise(resolve => {
    const start = process.hrtime.bigint();
    const req = http.get({ hostname: '127.0.0.1', port: Number(process.env.PORT || 3000), path: urlPath }, res => {
      res.resume();
      res.on('end', () => {
        durations.push(Number(process.hrtime.bigint() - start) / 1e6);
        if (res.statusCode < 200 || res.statusCode >= 300) failed++;
        completed++;
        resolve();
      });
    });
    req.on('error', () => { failed++; completed++; resolve(); });
    req.setTimeout(30000, () => { failed++; req.destroy(); });
  });
}
async function worker() {
  while (true) {
    const id = nextId++;
    if (id >= totalRequests) return;
    await requestOne();
  }
}
(async () => {
  await Promise.all(Array.from({ length: Math.min(concurrency, totalRequests) }, worker));
  const elapsedSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
  const cpu = process.cpuUsage(cpuStart);
  const sorted = durations.slice().sort((a,b) => a-b);
  const percentile = p => sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)] || 0;
  const result = {
    mode, endpoint: urlPath, requests: totalRequests, concurrency,
    completed, failed, duration_seconds: +elapsedSeconds.toFixed(3),
    throughput_requests_per_second: +(completed / elapsedSeconds).toFixed(2),
    latency_ms: {
      min: +(sorted[0] || 0).toFixed(2),
      mean: +(durations.reduce((a,b)=>a+b,0) / Math.max(1,durations.length)).toFixed(2),
      p50: +percentile(.50).toFixed(2), p95: +percentile(.95).toFixed(2),
      p99: +percentile(.99).toFixed(2), max: +(sorted[sorted.length-1] || 0).toFixed(2)
    },
    process_cpu_user_ms: +(cpu.user / 1000).toFixed(2),
    process_cpu_system_ms: +(cpu.system / 1000).toFixed(2),
    process_memory_rss_mb: +(process.memoryUsage().rss / 1024 / 1024).toFixed(2),
    host_total_memory_mb: +(os.totalmem() / 1024 / 1024).toFixed(0),
    note: 'Client-side process metrics; API server resource usage should be measured separately for production-grade profiling.'
  };
  const outDir = path.join(__dirname, '..', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `${mode}-benchmark-${Date.now()}.json`);
  fs.writeFileSync(out, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  console.log('Saved:', out);
})();
