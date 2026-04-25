import pool from '../../config/db.js'

function toMysqlDatetime(d) {
  if (!d) return null
  const date = d instanceof Date ? d : new Date(d)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function normalise(isoStr) {
  if (!isoStr) return null
  return isoStr.replace('T', ' ').slice(0, 19)
}

function toIso(val) {
  if (!val) return null
  return val instanceof Date ? val.toISOString() : new Date(val).toISOString()
}

function rowToEvent(row) {
  return {
    id: row.id,
    title: row.title,
    start_at: toIso(row.start_at),
    location: row.location || null,
    description: row.description || null,
  }
}

export async function listUpcomingEvents() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const [rows] = await pool.query(
    'SELECT * FROM internal_events WHERE start_at >= ? ORDER BY start_at ASC',
    [toMysqlDatetime(todayStart)]
  )
  return rows.map(rowToEvent)
}

export async function createEvent({ title, start_at, location, description }) {
  const [result] = await pool.query(
    'INSERT INTO internal_events (title, start_at, location, description) VALUES (?, ?, ?, ?)',
    [title, normalise(start_at), location || null, description || null]
  )
  const [rows] = await pool.query('SELECT * FROM internal_events WHERE id = ?', [result.insertId])
  return rowToEvent(rows[0])
}

export async function updateEvent(id, { title, start_at, location, description }) {
  const [result] = await pool.query(
    'UPDATE internal_events SET title = ?, start_at = ?, location = ?, description = ? WHERE id = ?',
    [title, normalise(start_at), location || null, description || null, id]
  )
  if (result.affectedRows === 0) return null
  const [rows] = await pool.query('SELECT * FROM internal_events WHERE id = ?', [id])
  return rowToEvent(rows[0])
}

export async function deleteEvent(id) {
  const [result] = await pool.query('DELETE FROM internal_events WHERE id = ?', [id])
  return result.affectedRows > 0
}

export async function getTomorrowInternalEvents() {
  const now = new Date()
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
  const tomorrowEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 0, 0, 0, 0)

  const [rows] = await pool.query(
    'SELECT * FROM internal_events WHERE start_at >= ? AND start_at < ? ORDER BY start_at ASC',
    [toMysqlDatetime(tomorrowStart), toMysqlDatetime(tomorrowEnd)]
  )

  return rows.map((ev) => ({
    feedName: 'Internal Calendar',
    feedId: null,
    internalId: ev.id,
    title: ev.title,
    start: toIso(ev.start_at),
    end: null,
    allDay: false,
    location: ev.location || null,
    description: ev.description || null,
    notChecked: false,
    internal: true,
  }))
}
