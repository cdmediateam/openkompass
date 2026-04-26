import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profile.js'
import calendarRoutes from './routes/calendars.js'
import internalEventRoutes from './routes/internalEvents.js'
import openkompassRoutes from './routes/openkompass.js'

const app = new Hono()

app.use('/api/*', cors())

app.route('/api', authRoutes)
app.route('/api', profileRoutes)
app.route('/api', calendarRoutes)
app.route('/api', internalEventRoutes)
app.route('/api', openkompassRoutes)

export default app
