import { Hono } from 'hono'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { getFeeds, createFeed, removeFeed, updateOrder, tomorrowEvents } from '../controllers/calendarController.js'

const calendars = new Hono()

calendars.get('/calendars', authMiddleware, getFeeds)
calendars.post('/calendars', authMiddleware, createFeed)
calendars.delete('/calendars/:id', authMiddleware, removeFeed)
calendars.put('/calendars/order', authMiddleware, updateOrder)
calendars.get('/events/tomorrow', authMiddleware, tomorrowEvents)

export default calendars
