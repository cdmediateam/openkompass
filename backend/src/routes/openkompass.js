import { Hono } from 'hono'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { todayEntries, getEntries, addEntry, editEntry, removeEntry } from '../controllers/openkompassController.js'

const router = new Hono()

// Public — no auth required
router.get('/openkompass/today', todayEntries)

router.get('/openkompass', authMiddleware, getEntries)
router.post('/openkompass', authMiddleware, addEntry)
router.put('/openkompass/:id', authMiddleware, editEntry)
router.delete('/openkompass/:id', authMiddleware, removeEntry)

export default router
