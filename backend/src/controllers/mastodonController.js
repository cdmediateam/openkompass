import crypto from 'crypto'

// In-memory state store: state token -> { serverUrl, client_id, client_secret, callbackUrl }
const pendingAuth = new Map()

function scheduleCleanup(state) {
  setTimeout(() => pendingAuth.delete(state), 10 * 60 * 1000)
}

export async function startAuth(c) {
  let server = c.req.query('server')?.trim().toLowerCase()
  if (!server) return c.json({ error: 'server parameter required' }, 400)

  const callbackOrigin = c.req.query('callback_origin')
  if (!callbackOrigin) return c.json({ error: 'callback_origin parameter required' }, 400)

  const serverUrl = server.startsWith('http') ? server : `https://${server}`
  const callbackUrl = `${callbackOrigin}/api/mastodon/callback`
  console.log('[mastodon] startAuth', { serverUrl, callbackUrl })

  let regData
  try {
    const res = await fetch(`${serverUrl}/api/v1/apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_name: 'OpenKompass',
        redirect_uris: callbackUrl,
        scopes: 'read write',
        website: callbackOrigin,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[mastodon] app registration failed', res.status, body)
      throw new Error(`HTTP ${res.status}`)
    }
    regData = await res.json()
  } catch (err) {
    console.error('[mastodon] app registration error', err.message)
    return c.json({ error: `Could not reach Mastodon server — check the domain and try again` }, 502)
  }

  const { client_id, client_secret } = regData
  const state = crypto.randomBytes(16).toString('hex')
  pendingAuth.set(state, { serverUrl, client_id, client_secret, callbackUrl })
  scheduleCleanup(state)

  const authorizeUrl = new URL(`${serverUrl}/oauth/authorize`)
  authorizeUrl.searchParams.set('client_id', client_id)
  authorizeUrl.searchParams.set('redirect_uri', callbackUrl)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('scope', 'read write')
  authorizeUrl.searchParams.set('state', state)

  return c.json({ authorizeUrl: authorizeUrl.toString() })
}

export async function handleCallback(c) {
  const code = c.req.query('code')
  const state = c.req.query('state')

  const pending = state ? pendingAuth.get(state) : null
  const frontendOrigin = pending
    ? pending.callbackUrl.replace('/api/mastodon/callback', '')
    : 'http://localhost:5173'

  console.log('[mastodon] callback received', {
    code: code ? code.slice(0, 10) + '…' : 'MISSING',
    state: state ? state.slice(0, 8) + '…' : 'MISSING',
    pendingFound: !!pending,
  })

  if (!code || !state) {
    return c.redirect(`${frontendOrigin}/#/upvote?error=missing_params`)
  }

  if (!pending) {
    return c.redirect(`${frontendOrigin}/#/upvote?error=expired`)
  }
  pendingAuth.delete(state)

  const { serverUrl, client_id, client_secret, callbackUrl } = pending

  console.log('[mastodon] token exchange', { serverUrl, redirect_uri: callbackUrl, client_id })

  let access_token
  try {
    const body =
      `grant_type=authorization_code` +
      `&code=${encodeURIComponent(code)}` +
      `&client_id=${encodeURIComponent(client_id)}` +
      `&client_secret=${encodeURIComponent(client_secret)}` +
      `&redirect_uri=${encodeURIComponent(callbackUrl)}`

    const tokenRes = await fetch(`${serverUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!tokenRes.ok) {
      const resBody = await tokenRes.text().catch(() => '')
      console.error('[mastodon] token exchange failed', tokenRes.status, resBody)
      throw new Error(`HTTP ${tokenRes.status}`)
    }
    ;({ access_token } = await tokenRes.json())
  } catch (err) {
    console.error('[mastodon] token exchange error', err.message)
    return c.redirect(`${frontendOrigin}/#/upvote?error=token_exchange`)
  }

  let user
  try {
    const userRes = await fetch(`${serverUrl}/api/v1/accounts/verify_credentials`, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    if (!userRes.ok) throw new Error(`HTTP ${userRes.status}`)
    user = await userRes.json()
  } catch {
    return c.redirect(`${frontendOrigin}/#/upvote?error=user_fetch`)
  }

  const userData = {
    username: user.username,
    display_name: user.display_name,
    avatar: user.avatar,
    header: user.header,
    note: user.note,
    url: user.url,
    followers_count: user.followers_count,
    following_count: user.following_count,
    statuses_count: user.statuses_count,
    created_at: user.created_at,
    server: serverUrl,
    access_token,
  }

  const encoded = Buffer.from(JSON.stringify(userData)).toString('base64url')
  return c.redirect(`${frontendOrigin}/#/upvote?user=${encoded}`)
}

const FEED_ACCT = 'index'
const FEED_HOST = 'vsport.online'

const AP_HEADERS = { Accept: 'application/activity+json, application/ld+json' }

async function fetchActivityPubFeed() {
  // 1. WebFinger — discover the actor URL
  const wfRes = await fetch(
    `https://${FEED_HOST}/.well-known/webfinger?resource=acct:${FEED_ACCT}@${FEED_HOST}`,
    { headers: { Accept: 'application/json' } }
  )
  if (!wfRes.ok) throw new Error(`webfinger ${wfRes.status}`)
  const wf = await wfRes.json()
  const actorUrl = wf.links?.find(l => l.rel === 'self')?.href
  if (!actorUrl) throw new Error('no self link in webfinger response')

  // 2. Fetch actor to get outbox URL
  const actorRes = await fetch(actorUrl, { headers: AP_HEADERS })
  if (!actorRes.ok) throw new Error(`actor ${actorRes.status}`)
  const actor = await actorRes.json()
  if (!actor.outbox) throw new Error('actor has no outbox')

  // 3. Fetch outbox (may be a collection or a first-page reference)
  const outboxRes = await fetch(actor.outbox, { headers: AP_HEADERS })
  if (!outboxRes.ok) throw new Error(`outbox ${outboxRes.status}`)
  const outbox = await outboxRes.json()

  let items = outbox.orderedItems || outbox.items || []

  // If the collection only contains a summary and links to pages, follow `first`
  if (!items.length && outbox.first) {
    const firstUrl = typeof outbox.first === 'string' ? outbox.first : outbox.first?.id
    const pageRes = await fetch(firstUrl, { headers: AP_HEADERS })
    if (pageRes.ok) {
      const page = await pageRes.json()
      items = page.orderedItems || page.items || []
    }
  }

  return items
}

function normalizeApItem(item) {
  // Unwrap Create activities; skip Announce (boosts) and anything without a Note/Article object
  const obj = item.type === 'Create' ? item.object : item
  if (!obj || typeof obj !== 'object') return null
  if (!['Note', 'Article', 'Page'].includes(obj.type)) return null

  const attachments = (obj.attachment || [])
    .filter(a => a.mediaType?.startsWith('image/') || a.mediaType?.startsWith('video/'))
    .map(a => ({
      type: a.mediaType?.startsWith('video/') ? 'video' : 'image',
      preview_url: a.url,
      description: a.name || '',
    }))

  return {
    ap_id: obj.id,                   // canonical AP URL — used for federation/boost
    url: obj.url || obj.id,          // human-readable web URL — used for links
    content: obj.content || (obj.contentMap && Object.values(obj.contentMap)[0]) || '',
    spoiler_text: obj.summary || '',
    created_at: obj.published || item.published,
    replies_count: obj.replies?.totalItems ?? 0,
    reblogs_count: obj.shares?.totalItems ?? 0,
    favourites_count: obj.likes?.totalItems ?? 0,
    media_attachments: attachments,
  }
}

export async function getFeed(c) {
  try {
    const items = await fetchActivityPubFeed()
    const posts = items.map(normalizeApItem).filter(Boolean).slice(0, 20)
    return c.json(posts)
  } catch (err) {
    console.error('[mastodon] getFeed error', err.message)
    return c.json({ error: 'Could not fetch feed' }, 502)
  }
}

export async function boostPost(c) {
  const token = c.req.header('x-mastodon-token')
  const userServer = c.req.header('x-mastodon-server')
  let statusUrl
  try {
    ;({ statusUrl } = await c.req.json())
  } catch {
    return c.json({ error: 'Invalid request body' }, 400)
  }

  if (!token || !userServer || !statusUrl) return c.json({ error: 'Missing parameters' }, 400)

  try {
    // Resolve the remote status to a local ID on the user's server
    const searchRes = await fetch(
      `${userServer}/api/v2/search?q=${encodeURIComponent(statusUrl)}&resolve=true&type=statuses&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!searchRes.ok) throw new Error(`search ${searchRes.status}`)
    const { statuses } = await searchRes.json()
    if (!statuses?.length) return c.json({ error: 'Post not found on your server' }, 404)

    const reblogRes = await fetch(`${userServer}/api/v1/statuses/${statuses[0].id}/reblog`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!reblogRes.ok) throw new Error(`reblog ${reblogRes.status}`)

    return c.json({ ok: true })
  } catch (err) {
    console.error('[mastodon] boostPost error', err.message)
    return c.json({ error: 'Boost failed' }, 502)
  }
}
