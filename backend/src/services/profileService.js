import pool from '../../config/db.js'

export async function getProfile() {
  await pool.query('INSERT IGNORE INTO profile (id) VALUES (1)')
  const [rows] = await pool.query('SELECT * FROM profile WHERE id = 1')
  return rows[0]
}

export async function updateProfile({ display_name, bio, avatar_url, fediverse_handle }) {
  await pool.query(
    `UPDATE profile
     SET display_name = ?, bio = ?, avatar_url = ?, fediverse_handle = ?
     WHERE id = 1`,
    [display_name || null, bio || null, avatar_url || null, fediverse_handle || null]
  )
  return getProfile()
}
