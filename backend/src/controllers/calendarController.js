import { listFeeds, addFeed, deleteFeed, reorderFeeds, getTomorrowEvents, getPreviewEvents } from '../services/calendarService.js'

export const getFeeds = async (c) => {
  const feeds = await listFeeds()
  return c.json(feeds)
}

export const createFeed = async (c) => {
  const { name, url } = await c.req.json()
  if (!name) return c.json({ error: 'name is required' }, 400)
  const feed = await addFeed({ name, url })
  return c.json(feed, 201)
}

export const removeFeed = async (c) => {
  const id = Number(c.req.param('id'))
  const deleted = await deleteFeed(id)
  if (!deleted) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
}

export const updateOrder = async (c) => {
  const { ids } = await c.req.json()
  if (!Array.isArray(ids)) return c.json({ error: 'ids must be an array' }, 400)
  const feeds = await reorderFeeds(ids)
  return c.json(feeds)
}

export const tomorrowEvents = async (c) => {
  const events = await getTomorrowEvents()
  return c.json(events)
}

export const previewFeed = async (c) => {
  const id = Number(c.req.param('id'))
  try {
    const events = await getPreviewEvents(id)
    if (events === null) return c.json({ error: 'Not found' }, 404)
    return c.json(events)
  } catch {
    return c.json({ error: 'Failed to fetch calendar feed' }, 502)
  }
}
