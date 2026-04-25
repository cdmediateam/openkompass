// Run with: node backend/scripts/migrate.js
// Creates all tables (idempotent — safe to run on every deploy).

import '../env.js'
import pool from '../config/db.js'

const steps = [
  {
    name: 'profile',
    sql: `
      CREATE TABLE IF NOT EXISTS profile (
        id INT PRIMARY KEY DEFAULT 1,
        display_name VARCHAR(255),
        bio TEXT,
        avatar_url TEXT,
        fediverse_handle VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
  },
  {
    name: 'profile seed row',
    sql: `INSERT IGNORE INTO profile (id) VALUES (1)`,
  },
  {
    name: 'calendar_feeds',
    sql: `
      CREATE TABLE IF NOT EXISTS calendar_feeds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url TEXT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
  },
  {
    name: 'internal_events',
    sql: `
      CREATE TABLE IF NOT EXISTS internal_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        start_at DATETIME NOT NULL,
        location VARCHAR(255) NULL,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
  },
]

for (const { name, sql } of steps) {
  await pool.query(sql)
  console.log(`✓ ${name}`)
}

console.log('Migration complete.')
await pool.end()
process.exit(0)
