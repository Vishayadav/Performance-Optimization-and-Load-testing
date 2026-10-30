# Benchmark reports

Run `npm run bench:before` and `npm run bench:after` while the server is running. Each command writes a timestamped JSON report in this directory.

No fabricated benchmark numbers are included. Populate the comparison sheet below from actual runs.

| Metric | Before median | After median | Change |
|---|---:|---:|---:|
| Throughput (requests/sec) | Run benchmark | Run benchmark | Calculate |
| Mean latency (ms) | Run benchmark | Run benchmark | Calculate |
| p95 latency (ms) | Run benchmark | Run benchmark | Calculate |
| p99 latency (ms) | Run benchmark | Run benchmark | Calculate |
| Client RSS (MB) | Run benchmark | Run benchmark | Calculate |
| Failed requests | Run benchmark | Run benchmark | Calculate |

For latency and memory, lower is generally better. For throughput, higher is generally better. Confirm failed requests remain zero before interpreting speed improvements.
