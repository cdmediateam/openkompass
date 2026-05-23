import { Hono } from 'hono'
import { ghostLogin } from '../controllers/memberAuthController.js'

const router = new Hono()

router.post('/auth/ghost', ghostLogin)

export default router
