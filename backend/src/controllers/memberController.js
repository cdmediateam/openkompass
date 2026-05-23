import { getTodayEntries } from '../services/openkompassService.js'

export const getMemberTodayEvents = async (c) => {
  const entries = await getTodayEntries()
  return c.json({ events: entries })
}
