import jwt from 'jsonwebtoken'
import { authenticateGhostMember } from '../services/ghostAuthService.js'

export const ghostLogin = async (c) => {
  if (!process.env.GHOST_URL || !process.env.GHOST_ADMIN_API_KEY) {
    return c.json({ error: 'Ghost integration not configured' }, 503)
  }

  const body = await c.req.json().catch(() => null)
  if (!body?.identityToken || typeof body.identityToken !== 'string') {
    return c.json({ error: 'identityToken required' }, 400)
  }

  let memberInfo
  try {
    memberInfo = await authenticateGhostMember(body.identityToken)
  } catch (err) {
    if (err.code === 'NOT_PAID') {
      return c.json({ error: 'Active paid subscription required' }, 403)
    }
    console.error('[ghost-auth]', err.message)
    return c.json({ error: 'Authentication failed' }, 401)
  }

  const token = jwt.sign(
    { role: 'member', ghostId: memberInfo.ghostId, email: memberInfo.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  )

  return c.json({ token })
}
