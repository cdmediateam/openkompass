import pool from '../../config/db.js'

function dateToStr(val) {
  if (!val) return null
  const d = val instanceof Date ? val : new Date(val)
  // mysql2 constructs DATE values at local midnight, so use local methods
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function rowToEntry(row) {
  return {
    id: row.id,
    type: row.type,
    country: row.country,
    title: row.title,
    subtitle: row.subtitle || null,
    event_date: dateToStr(row.event_date),
    event_time: row.event_time ? String(row.event_time).slice(0, 5) : null,
    location: row.location || null,
    description: row.description || null,
    link_text: row.link_text || null,
    link_url: row.link_url || null,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  }
}

export async function getTodayEntries() {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const [rows] = await pool.query(
    'SELECT * FROM openkompass WHERE event_date = ? ORDER BY event_time ASC, id ASC',
    [today]
  )
  return rows.map(rowToEntry)
}

export async function listEntries() {
  const [rows] = await pool.query(
    'SELECT * FROM openkompass ORDER BY event_date DESC, event_time DESC, id DESC'
  )
  return rows.map(rowToEntry)
}

export async function createEntry({ type, country, title, subtitle, event_date, event_time, location, description, link_text, link_url }) {
  const [result] = await pool.query(
    `INSERT INTO openkompass (type, country, title, subtitle, event_date, event_time, location, description, link_text, link_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [type, country, title, subtitle || null, event_date, event_time || null, location || null, description || null, link_text || null, link_url || null]
  )
  const [rows] = await pool.query('SELECT * FROM openkompass WHERE id = ?', [result.insertId])
  return rowToEntry(rows[0])
}

export async function updateEntry(id, { type, country, title, subtitle, event_date, event_time, location, description, link_text, link_url }) {
  const [result] = await pool.query(
    `UPDATE openkompass SET type = ?, country = ?, title = ?, subtitle = ?, event_date = ?, event_time = ?,
     location = ?, description = ?, link_text = ?, link_url = ? WHERE id = ?`,
    [type, country, title, subtitle || null, event_date, event_time || null, location || null, description || null, link_text || null, link_url || null, id]
  )
  if (result.affectedRows === 0) return null
  const [rows] = await pool.query('SELECT * FROM openkompass WHERE id = ?', [id])
  return rowToEntry(rows[0])
}

export async function deleteEntry(id) {
  const [result] = await pool.query('DELETE FROM openkompass WHERE id = ?', [id])
  return result.affectedRows > 0
}
