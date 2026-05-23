import jwt from 'jsonwebtoken'

function ghostUrl() {
  return process.env.GHOST_URL?.replace(/\/$/, '')
}

function makeAdminJWT() {
  const key = process.env.GHOST_ADMIN_API_KEY
  if (!key?.includes(':')) throw new Error('GHOST_ADMIN_API_KEY must be in format id:hexsecret')
  const [id, secret] = key.split(':')
  return jwt.sign({}, Buffer.from(secret, 'hex'), {
    keyid: id,
    algorithm: 'HS256',
    expiresIn: '5m',
    audience: '/ghost/api/admin/',
  })
}

export async function authenticateGhostMember(email) {
  const adminToken = makeAdminJWT()
  const filter = encodeURIComponent(`email:'${email}'`)
  const url = `${ghostUrl()}/ghost/api/admin/members/?filter=${filter}&include=subscriptions&limit=1`

  const res = await fetch(url, {
    headers: {
      Authorization: `Ghost ${adminToken}`,
      'Accept-Version': 'v5.0',
    },
  })

  if (!res.ok) throw new Error(`Ghost Admin API error: HTTP ${res.status}`)

  const { members } = await res.json()
  if (!members?.length) {
    const err = new Error('Member not found')
    err.code = 'NOT_FOUND'
    throw err
  }

  const member = members[0]
  const isPaid = member.subscriptions?.some(s => s.status === 'active')
  if (!isPaid) {
    const err = new Error('No active paid subscription')
    err.code = 'NOT_PAID'
    throw err
  }

  return { ghostId: member.id, email: member.email, name: member.name }
}
