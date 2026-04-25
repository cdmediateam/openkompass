import { api } from '../api.js'
import { layout, bindNav, escHtml } from '../layout.js'

export function renderInternalCalendar(container) {
  container.innerHTML = layout(`
    <div class="mb-8 flex items-start justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">Internal Calendar</h2>
        <p class="text-slate-400 mt-1 text-sm">Your personal events.</p>
      </div>
      <button id="toggle-form"
        class="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors mt-1">
        + Add Event
      </button>
    </div>

    <form id="event-form" class="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6 hidden">
      <h4 id="form-heading" class="text-sm font-medium text-white mb-4">New Event</h4>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Title *</label>
          <input id="ev-title" type="text" placeholder="Event title" autocomplete="off"
            class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                   placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">Date *</label>
            <input id="ev-date" type="date"
              class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">Time *</label>
            <input id="ev-time" type="time"
              class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Location</label>
          <input id="ev-location" type="text" placeholder="Optional"
            class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                   placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Notes</label>
          <textarea id="ev-notes" rows="2" placeholder="Optional"
            class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                   placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"></textarea>
        </div>
      </div>
      <div id="form-error" class="text-red-400 text-xs mt-3 hidden"></div>
      <div class="flex items-center gap-3 mt-4">
        <button type="submit" id="form-submit"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium
                 rounded-lg transition-colors disabled:opacity-50">
          Add Event
        </button>
        <button type="button" id="form-cancel"
          class="text-sm text-slate-400 hover:text-white transition-colors px-2 py-2">
          Cancel
        </button>
      </div>
    </form>

    <div id="events-list" class="space-y-2">
      <div class="flex items-center gap-3 text-slate-400 py-2">
        <div class="w-4 h-4 rounded-full border-2 border-slate-600 border-t-indigo-400 animate-spin flex-shrink-0"></div>
        <span class="text-sm">Loading…</span>
      </div>
    </div>
  `)

  bindNav()
  loadEvents()
  bindForm()
}

// ── Event list ────────────────────────────────────────────────────────────────

function loadEvents() {
  api.listEvents()
    .then(renderList)
    .catch((err) => {
      const el = document.getElementById('events-list')
      if (el) el.innerHTML = `<p class="text-red-400 text-sm">${escHtml(err.message)}</p>`
    })
}

function renderList(events) {
  const el = document.getElementById('events-list')
  if (!el) return

  if (events.length === 0) {
    el.innerHTML = `<p class="text-slate-500 text-sm italic">No upcoming events.</p>`
    return
  }

  el.innerHTML = ''
  events.forEach((event) => {
    const row = document.createElement('div')
    row.className = 'flex items-start gap-3 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3'
    row.innerHTML = `
      <div class="flex-1 min-w-0">
        <p class="text-white text-sm font-medium">${escHtml(event.title)}</p>
        <p class="text-slate-400 text-xs mt-0.5">${escHtml(formatDatetime(event.start_at))}</p>
        ${event.location ? `<p class="text-slate-500 text-xs mt-0.5">${escHtml(event.location)}</p>` : ''}
      </div>
      <div class="flex-shrink-0 flex gap-1">
        <button class="edit-btn text-slate-500 hover:text-indigo-400 transition-colors text-xs px-2 py-1 rounded">Edit</button>
        <button class="del-btn text-slate-500 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded">Delete</button>
      </div>
    `
    row.querySelector('.edit-btn').addEventListener('click', () => fillForm(event))
    row.querySelector('.del-btn').addEventListener('click', async () => {
      const btn = row.querySelector('.del-btn')
      btn.disabled = true
      btn.textContent = '…'
      try {
        await api.deleteEvent(event.id)
        loadEvents()
      } catch (err) {
        btn.disabled = false
        btn.textContent = 'Delete'
        alert(err.message)
      }
    })
    el.appendChild(row)
  })
}

function formatDatetime(isoStr) {
  const d = new Date(isoStr)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

// ── Form ──────────────────────────────────────────────────────────────────────

let editingId = null

function showForm() { document.getElementById('event-form')?.classList.remove('hidden') }
function hideForm() { document.getElementById('event-form')?.classList.add('hidden'); resetForm() }

function resetForm() {
  editingId = null
  document.getElementById('event-form')?.reset()
  const h = document.getElementById('form-heading')
  const s = document.getElementById('form-submit')
  if (h) h.textContent = 'New Event'
  if (s) s.textContent = 'Add Event'
  const err = document.getElementById('form-error')
  if (err) { err.classList.add('hidden'); err.textContent = '' }
}

function fillForm(event) {
  editingId = event.id
  const d = new Date(event.start_at)
  document.getElementById('ev-title').value = event.title
  document.getElementById('ev-date').value = toDateInput(d)
  document.getElementById('ev-time').value = toTimeInput(d)
  document.getElementById('ev-location').value = event.location || ''
  document.getElementById('ev-notes').value = event.description || ''
  document.getElementById('form-heading').textContent = 'Edit Event'
  document.getElementById('form-submit').textContent = 'Save Changes'
  showForm()
  document.getElementById('ev-title').focus()
}

function toDateInput(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function toTimeInput(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function bindForm() {
  document.getElementById('toggle-form')?.addEventListener('click', () => {
    const form = document.getElementById('event-form')
    if (form?.classList.contains('hidden')) { resetForm(); showForm(); document.getElementById('ev-title').focus() }
    else hideForm()
  })

  document.getElementById('form-cancel')?.addEventListener('click', hideForm)

  document.getElementById('event-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()

    const title    = document.getElementById('ev-title').value.trim()
    const date     = document.getElementById('ev-date').value
    const time     = document.getElementById('ev-time').value
    const location = document.getElementById('ev-location').value.trim()
    const notes    = document.getElementById('ev-notes').value.trim()
    const errorEl  = document.getElementById('form-error')
    const btn      = document.getElementById('form-submit')

    errorEl.classList.add('hidden')
    errorEl.textContent = ''

    if (!title || !date || !time) {
      errorEl.textContent = 'Title, date, and time are required.'
      errorEl.classList.remove('hidden')
      return
    }

    const start_at = `${date}T${time}:00`
    btn.disabled = true

    try {
      const payload = { title, start_at, location: location || null, description: notes || null }
      if (editingId) {
        await api.updateEvent(editingId, payload)
      } else {
        await api.createEvent(payload)
      }
      hideForm()
      loadEvents()
    } catch (err) {
      errorEl.textContent = err.message
      errorEl.classList.remove('hidden')
    } finally {
      btn.disabled = false
    }
  })
}
