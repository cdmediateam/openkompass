import { Hono } from 'hono'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { fetchProfile, editProfile } from '../controllers/profileController.js'

const profile = new Hono()

profile.get('/profile', authMiddleware, fetchProfile)
profile.put('/profile', authMiddleware, editProfile)

export default profile
