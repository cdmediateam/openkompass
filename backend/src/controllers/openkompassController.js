import { getTodayEntries, listEntries, createEntry, updateEntry, deleteEntry } from '../services/openkompassService.js'

export const todayEntries = async (c) => {
  const entries = await getTodayEntries()
  return c.json(entries)
}

export const getEntries = async (c) => {
  const entries = await listEntries()
  return c.json(entries)
}

export const addEntry = async (c) => {
  const body = await c.req.json()
  if (!body.type || !body.country || !body.title || !body.event_date) {
    return c.json({ error: 'type, country, title, and event_date are required' }, 400)
  }
  const entry = await createEntry(body)
  return c.json(entry, 201)
}

export const editEntry = async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  if (!body.type || !body.country || !body.title || !body.event_date) {
    return c.json({ error: 'type, country, title, and event_date are required' }, 400)
  }
  const entry = await updateEntry(id, body)
  if (!entry) return c.json({ error: 'Not found' }, 404)
  return c.json(entry)
}

export const removeEntry = async (c) => {
  const id = Number(c.req.param('id'))
  const deleted = await deleteEntry(id)
  if (!deleted) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
}
