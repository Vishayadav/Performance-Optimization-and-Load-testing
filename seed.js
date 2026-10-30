const fs = require('fs');
const path = require('path');
const db = require('../src/db');
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
db.exec('DELETE FROM posts');
const insert = db.prepare('INSERT INTO posts (title, body, category, created_at) VALUES (?, ?, ?, ?)');
const seedMany = db.transaction((count) => {
  for (let i = 1; i <= count; i++) {
    insert.run(`Post ${i}`, `This is sample post body number ${i}. `.repeat(8),
      ['engineering', 'news', 'tutorial'][i % 3], new Date(Date.now() - i * 1000).toISOString());
  }
});
seedMany(Number(process.env.SEED_COUNT || 50000));
console.log('Seeded', db.prepare('SELECT COUNT(*) AS count FROM posts').get().count, 'posts');
db.close();
