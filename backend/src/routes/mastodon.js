import { Hono } from 'hono'
import { startAuth, handleCallback, getFeed, boostPost } from '../controllers/mastodonController.js'

const router = new Hono()

router.get('/mastodon/auth', startAuth)
router.get('/mastodon/callback', handleCallback)
router.get('/mastodon/feed', getFeed)
router.post('/mastodon/boost', boostPost)

export default router
