const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '..', 'data', 'performance.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);
module.exports = db;
