import jwt from 'jsonwebtoken'

export const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'No token' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    c.set('user', decoded)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
}
