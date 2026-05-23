import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ghostLogin } from '../controllers/memberAuthController.js'

const router = new Hono()

const ghostOrigin = process.env.GHOST_URL?.replace(/\/$/, '')

router.post(
  '/auth/ghost',
  cors({ origin: ghostOrigin, allowMethods: ['POST'], allowHeaders: ['Content-Type'] }),
  ghostLogin
)

export default router
