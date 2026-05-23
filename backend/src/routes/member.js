import { Hono } from 'hono'
import { memberMiddleware } from '../middleware/memberMiddleware.js'
import { getMemberTodayEvents } from '../controllers/memberController.js'

const router = new Hono()

router.use('/*', memberMiddleware)

router.get('/member/today', getMemberTodayEvents)

export default router
