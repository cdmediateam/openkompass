import { Hono } from 'hono'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { getEvents, addEvent, editEvent, removeEvent } from '../controllers/eventController.js'

const events = new Hono()

events.get('/internal-events', authMiddleware, getEvents)
events.post('/internal-events', authMiddleware, addEvent)
events.put('/internal-events/:id', authMiddleware, editEvent)
events.delete('/internal-events/:id', authMiddleware, removeEvent)

export default events
