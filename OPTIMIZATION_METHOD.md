# Performance Optimization Method

## Endpoint selected
`GET /api/posts?page=1&limit=20`, represented by `/api/before/posts` and `/api/after/posts`.

## Controlled setup
- Node.js and npm installed.
- SQLite database seeded with 50,000 synthetic posts using `npm run seed`.
- API bound to localhost on port 3000.
- Load generator sends 1,000 requests with 25 concurrent workers by default.
- Run before and after benchmarks on the same machine, with the same seed size and request settings.

## Baseline bottlenecks
The baseline endpoint executes an unrestricted `SELECT`, transfers all rows from SQLite into Node.js, sorts the entire result set in JavaScript, and only then slices the requested page. Work and memory use therefore grow with the full table size rather than the page size. This wastes database-to-application transfer and repeats sorting for every request.

## Optimizations
1. Push ordering and pagination into SQLite using `ORDER BY id DESC LIMIT ? OFFSET ?`.
2. Use a parameterized statement for limit and offset.
3. Cache identical page responses for 10 seconds, with a maximum of 100 entries to bound memory.
4. Return an explicit cache status (`HIT` or `MISS`) for observation.
5. Keep the same response data contract (`page`, `limit`, `total`, `data`) so clients can migrate without redesign.

## Measurement
The load script reports request count, failures, elapsed time, throughput, mean latency, p50/p95/p99/max latency, client process CPU time, and client process RSS. These are client-side process measurements; they are not a substitute for monitoring the API server process. For stronger server-side profiling, run the server in a separate terminal and capture its CPU/RSS using Windows Task Manager, `Get-Process node`, or `pidstat`/`top` on Linux.

## Reproducible procedure
1. `npm install`
2. `npm run seed`
3. `npm start` in terminal A
4. `npm run bench:before` in terminal B
5. `npm run bench:after` in terminal B
6. Repeat each run at least three times and compare medians; alternate before/after order to reduce warm-up bias.
7. Preserve the generated JSON files under `reports/` and record environment details.

## Interpretation and limitations
The after endpoint should reduce per-request database transfer and JavaScript sorting. Cache hits should reduce repeated database work further. Actual improvements depend on hardware, SQLite build, database size, operating system, and request concurrency. Do not report an improvement percentage until the benchmark is run on the target machine. OFFSET pagination can become expensive at very deep pages; keyset pagination is a possible next step.
