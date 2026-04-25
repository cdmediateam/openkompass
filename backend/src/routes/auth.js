import { Hono } from 'hono'
import { login } from '../controllers/authController.js'

const auth = new Hono()

auth.post('/login', login)

export default auth
