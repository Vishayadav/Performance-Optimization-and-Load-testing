const express = require('express');
const db = require('./db');
const app = express();
app.use(express.json());

const cache = new Map();
const CACHE_TTL_MS = 10_000;
const CACHE_MAX_ENTRIES = 100;

function getCached(key) {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}
function setCached(key, value) {
  if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value);
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Baseline: intentionally inefficient endpoint for comparison.
// It loads every matching row, sorts in JavaScript, then slices the page.
app.get('/api/before/posts', (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '20', 10) || 20));
  const rows = db.prepare('SELECT id, title, body, category, created_at FROM posts').all();
  const sorted = rows.sort((a, b) => b.id - a.id);
  const start = (page - 1) * limit;
  res.json({ page, limit, total: sorted.length, data: sorted.slice(start, start + limit) });
});

// Optimized endpoint: filtering, ordering and pagination happen in SQLite.
// A short bounded cache reduces repeated reads for identical pages.
app.get('/api/after/posts', (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '20', 10) || 20));
  const offset = (page - 1) * limit;
  const key = `${page}:${limit}`;
  const cached = getCached(key);
  if (cached) return res.json({ ...cached, cache: 'HIT' });

  const total = db.prepare('SELECT COUNT(*) AS count FROM posts').get().count;
  const data = db.prepare(
    'SELECT id, title, body, category, created_at FROM posts ORDER BY id DESC LIMIT ? OFFSET ?'
  ).all(limit, offset);
  const payload = { page, limit, total, data };
  setCached(key, payload);
  res.set('X-Cache', 'MISS');
  res.json({ ...payload, cache: 'MISS' });
});

module.exports = app;
