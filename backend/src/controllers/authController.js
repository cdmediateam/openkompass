import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const login = async (c) => {
  const { username, password } = await c.req.json()

  if (username !== process.env.ROOT_USERNAME) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const valid = await bcrypt.compare(password, process.env.ROOT_PASSWORD_HASH)

  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const token = jwt.sign({ role: 'owner' }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  })

  return c.json({ token })
}
