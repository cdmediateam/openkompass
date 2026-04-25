import { listUpcomingEvents, createEvent, updateEvent, deleteEvent } from '../services/eventService.js'

export const getEvents = async (c) => {
  const events = await listUpcomingEvents()
  return c.json(events)
}

export const addEvent = async (c) => {
  const body = await c.req.json()
  if (!body.title || !body.start_at) return c.json({ error: 'title and start_at are required' }, 400)
  const event = await createEvent(body)
  return c.json(event, 201)
}

export const editEvent = async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  if (!body.title || !body.start_at) return c.json({ error: 'title and start_at are required' }, 400)
  const event = await updateEvent(id, body)
  if (!event) return c.json({ error: 'Not found' }, 404)
  return c.json(event)
}

export const removeEvent = async (c) => {
  const id = Number(c.req.param('id'))
  const deleted = await deleteEvent(id)
  if (!deleted) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
}
