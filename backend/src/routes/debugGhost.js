import { Hono } from 'hono'
import { authMiddleware } from '../middleware/authMiddleware.js'
import jwt from 'jsonwebtoken'

const router = new Hono()

router.use('/*', authMiddleware)

router.get('/debug/ghost', async (c) => {
  const result = {}

  // 1. Check env vars
  const ghostUrl = process.env.GHOST_URL?.replace(/\/$/, '')
  const adminKey = process.env.GHOST_ADMIN_API_KEY

  result.env = {
    GHOST_URL: ghostUrl || '(not set)',
    GHOST_ADMIN_API_KEY: adminKey
      ? `${adminKey.slice(0, 8)}… (${adminKey.split(':').length} segment(s), total length ${adminKey.length})`
      : '(not set)',
  }

  if (!ghostUrl || !adminKey) {
    return c.json({ ...result, error: 'Missing env vars' }, 500)
  }

  // 2. Try generating the Admin JWT
  let adminToken
  try {
    if (!adminKey.includes(':')) throw new Error('Key missing colon separator')
    const parts = adminKey.split(':')
    if (parts.length !== 2) throw new Error(`Expected 2 segments (id:secret), got ${parts.length}`)
    const [id, secret] = parts
    result.keyParsed = { idLength: id.length, secretLength: secret.length }
    adminToken = jwt.sign({}, Buffer.from(secret, 'hex'), {
      keyid: id,
      algorithm: 'HS256',
      expiresIn: '5m',
      audience: '/ghost/api/admin/',
    })
    result.adminJwt = 'generated OK'
  } catch (err) {
    return c.json({ ...result, error: `Admin JWT generation failed: ${err.message}` }, 500)
  }

  // 3. Call Ghost Admin API (list 1 member — no filter, just tests connectivity + auth)
  let ghostRes
  try {
    ghostRes = await fetch(`${ghostUrl}/ghost/api/admin/members/?limit=1`, {
      headers: {
        Authorization: `Ghost ${adminToken}`,
        'Accept-Version': 'v5.0',
      },
    })
    const body = await ghostRes.json()
    result.ghostApiStatus = ghostRes.status
    result.ghostApiResponse = ghostRes.ok
      ? { members: body.members?.length, meta: body.meta }
      : body
  } catch (err) {
    return c.json({ ...result, error: `Ghost API fetch failed: ${err.message}` }, 500)
  }

  if (!ghostRes.ok) {
    return c.json({ ...result, error: `Ghost API returned HTTP ${ghostRes.status}` }, 500)
  }

  // 4. Optionally look up a specific email
  const email = c.req.query('email')
  if (email) {
    try {
      const filter = encodeURIComponent(`email:'${email}'`)
      const memberRes = await fetch(
        `${ghostUrl}/ghost/api/admin/members/?filter=${filter}&include=subscriptions&limit=1`,
        {
          headers: {
            Authorization: `Ghost ${adminToken}`,
            'Accept-Version': 'v5.0',
          },
        }
      )
      const body = await memberRes.json()
      result.memberLookup = memberRes.ok
        ? {
            found: body.members?.length > 0,
            email: body.members?.[0]?.email,
            status: body.members?.[0]?.status,
            subscriptions: body.members?.[0]?.subscriptions?.map(s => ({
              status: s.status,
              tier: s.tier?.name,
            })),
          }
        : { error: body }
    } catch (err) {
      result.memberLookup = { error: err.message }
    }
  }

  return c.json({ ...result, ok: true })
})

export default router
