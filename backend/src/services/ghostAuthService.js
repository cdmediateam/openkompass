import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWKS_TTL_MS = 5 * 60 * 1000

let _jwksCache = null
let _jwksCacheAt = 0

function ghostUrl() {
  return process.env.GHOST_URL?.replace(/\/$/, '')
}

async function fetchGhostPublicKeys() {
  const now = Date.now()
  if (_jwksCache && now - _jwksCacheAt < JWKS_TTL_MS) return _jwksCache

  const res = await fetch(`${ghostUrl()}/.well-known/jwks.json`)
  if (!res.ok) throw new Error(`Ghost JWKS unavailable: HTTP ${res.status}`)

  const { keys } = await res.json()
  _jwksCache = keys
  _jwksCacheAt = now
  return keys
}

async function verifyGhostToken(identityToken) {
  const decoded = jwt.decode(identityToken, { complete: true })
  if (!decoded?.header?.kid) throw new Error('Token missing key ID')

  const keys = await fetchGhostPublicKeys()
  const keyData = keys.find(k => k.kid === decoded.header.kid)
  if (!keyData) throw new Error('No matching signing key in Ghost JWKS')

  const publicKey = crypto.createPublicKey({ key: keyData, format: 'jwk' })
  return jwt.verify(identityToken, publicKey, { algorithms: ['RS512', 'RS256'] })
}

function makeAdminJWT() {
  const [id, secret] = process.env.GHOST_ADMIN_API_KEY.split(':')
  return jwt.sign({}, Buffer.from(secret, 'hex'), {
    keyid: id,
    algorithm: 'HS256',
    expiresIn: '5m',
    audience: '/ghost/api/admin/',
  })
}

async function fetchGhostMember(memberUUID) {
  const adminToken = makeAdminJWT()
  const url = `${ghostUrl()}/ghost/api/admin/members/?filter=uuid:${memberUUID}&include=subscriptions`

  const res = await fetch(url, {
    headers: {
      Authorization: `Ghost ${adminToken}`,
      'Accept-Version': 'v5.0',
    },
  })

  if (!res.ok) throw new Error(`Ghost Admin API error: HTTP ${res.status}`)

  const { members } = await res.json()
  if (!members?.length) throw new Error('Member not found')
  return members[0]
}

export async function authenticateGhostMember(identityToken) {
  const payload = await verifyGhostToken(identityToken)

  const member = await fetchGhostMember(payload.sub)

  const isPaid = member.subscriptions?.some(s => s.status === 'active')
  if (!isPaid) {
    const err = new Error('No active paid subscription')
    err.code = 'NOT_PAID'
    throw err
  }

  return { ghostId: member.id, email: member.email, name: member.name }
}
