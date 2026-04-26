const BASE = '/api'

function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token) {
  localStorage.setItem('token', token)
}

export function clearToken() {
  localStorage.removeItem('token')
}

export function isAuthenticated() {
  return !!getToken()
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    clearToken()
    window.location.hash = '#/login'
    throw new Error('Unauthorized')
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }

  return data
}

export const api = {
  login: (username, password) =>
    request('POST', '/login', { username, password }),
  getProfile: () => request('GET', '/profile'),
  updateProfile: (data) => request('PUT', '/profile', data),
  listCalendars: () => request('GET', '/calendars'),
  addCalendar: (data) => request('POST', '/calendars', data),
  deleteCalendar: (id) => request('DELETE', `/calendars/${id}`),
  reorderCalendars: (ids) => request('PUT', '/calendars/order', { ids }),
  getTomorrowEvents: () => request('GET', '/events/tomorrow'),
  listEvents: () => request('GET', '/internal-events'),
  createEvent: (data) => request('POST', '/internal-events', data),
  updateEvent: (id, data) => request('PUT', `/internal-events/${id}`, data),
  deleteEvent: (id) => request('DELETE', `/internal-events/${id}`),
  listOpenKompass: () => request('GET', '/openkompass'),
  createOpenKompass: (data) => request('POST', '/openkompass', data),
  updateOpenKompass: (id, data) => request('PUT', `/openkompass/${id}`, data),
  deleteOpenKompass: (id) => request('DELETE', `/openkompass/${id}`),
}
