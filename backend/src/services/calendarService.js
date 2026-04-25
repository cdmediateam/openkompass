import pool from '../../config/db.js'
import ical from 'node-ical'
import { getTomorrowInternalEvents } from './eventService.js'

export async function listFeeds() {
  const [rows] = await pool.query(
    'SELECT * FROM calendar_feeds ORDER BY sort_order ASC, id ASC'
  )
  return rows
}

export async function addFeed({ name, url }) {
  const [[{ maxOrder }]] = await pool.query(
    'SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM calendar_feeds'
  )
  const [result] = await pool.query(
    'INSERT INTO calendar_feeds (name, url, sort_order) VALUES (?, ?, ?)',
    [name, url || null, maxOrder + 1]
  )
  const [rows] = await pool.query('SELECT * FROM calendar_feeds WHERE id = ?', [result.insertId])
  return rows[0]
}

export async function deleteFeed(id) {
  const [result] = await pool.query('DELETE FROM calendar_feeds WHERE id = ?', [id])
  return result.affectedRows > 0
}

export async function reorderFeeds(ids) {
  await Promise.all(
    ids.map((id, index) =>
      pool.query('UPDATE calendar_feeds SET sort_order = ? WHERE id = ?', [index, id])
    )
  )
  return listFeeds()
}

export async function getTomorrowEvents() {
  const feeds = await listFeeds()
  const { start: tomorrowStart, end: tomorrowEnd } = getTomorrowRange()

  // Collect internal calendar events and external feed events in parallel
  const [internalEvents] = await Promise.all([getTomorrowInternalEvents()])
  const allEvents = [...internalEvents]

  await Promise.allSettled(
    feeds.map(async (feed) => {
      // Feeds without a URL become "not checked" reminder entries
      if (!feed.url) {
        allEvents.push({
          feedName: feed.name,
          feedId: feed.id,
          title: feed.name,
          start: tomorrowStart.toISOString(),
          end: null,
          allDay: true,
          location: null,
          description: null,
          notChecked: true,
        })
        return
      }

      try {
        const events = await ical.async.fromURL(feed.url)
        for (const event of Object.values(events)) {
          if (event.type !== 'VEVENT') continue
          const occurrences = getOccurrencesInRange(event, tomorrowStart, tomorrowEnd)
          for (const occStart of occurrences) {
            allEvents.push({
              feedName: feed.name,
              feedId: feed.id,
              title: event.summary || '(No title)',
              start: occStart.toISOString(),
              end: event.end ? new Date(event.end).toISOString() : null,
              allDay: event.datetype === 'date',
              location: event.location || null,
              description: event.description || null,
              notChecked: false,
            })
          }
        }
      } catch {
        // skip feeds that fail to load or parse
      }
    })
  )

  allEvents.sort((a, b) => {
    if (a.notChecked && !b.notChecked) return 1   // notChecked reminders last
    if (!a.notChecked && b.notChecked) return -1
    if (a.allDay && !b.allDay) return -1           // all-day before timed
    if (!a.allDay && b.allDay) return 1
    return new Date(a.start) - new Date(b.start)
  })

  return allEvents
}

function getTomorrowRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999)
  return { start, end }
}

function getOccurrencesInRange(event, start, end) {
  if (event.rrule) {
    return event.rrule.between(start, end, true)
  }

  const eStart = new Date(event.start)
  const eEnd = event.end ? new Date(event.end) : eStart

  // all-day events: DTSTART/DTEND are UTC midnight; compare calendar dates
  if (event.datetype === 'date') {
    const tomorrow = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const evStartDay = new Date(eStart.getUTCFullYear(), eStart.getUTCMonth(), eStart.getUTCDate())
    const evEndDay = new Date(eEnd.getUTCFullYear(), eEnd.getUTCMonth(), eEnd.getUTCDate())
    // DTEND is exclusive for all-day events
    if (evStartDay <= tomorrow && evEndDay > tomorrow) return [eStart]
    return []
  }

  // timed event: overlap check
  if (eStart <= end && eEnd >= start) return [eStart]
  return []
}
