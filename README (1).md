# Week 4 – Performance Optimization and Load Testing

A reproducible Node.js + Express + SQLite exercise comparing an intentionally inefficient posts endpoint with an optimized version.

## Requirements
- Node.js 18 or later
- npm

## Run
```bash
npm install
npm run seed
npm start
```
In another terminal:
```bash
npm run bench:before
npm run bench:after
```

Optional load settings:
```powershell
$env:REQUESTS=3000
$env:CONCURRENCY=50
npm run bench:after
```
To change dataset size before starting the server:
```powershell
$env:SEED_COUNT=100000
npm run seed
```

## Endpoints
- `GET http://127.0.0.1:3000/health`
- `GET http://127.0.0.1:3000/api/before/posts?page=1&limit=20`
- `GET http://127.0.0.1:3000/api/after/posts?page=1&limit=20`

## Important
The before endpoint is intentionally inefficient and exists only for this local learning exercise. Do not expose it publicly. Benchmark JSON is generated on your machine; no benchmark figures are pre-filled or represented as measured results. Run both modes under identical conditions and attach the generated JSON files as evidence.
