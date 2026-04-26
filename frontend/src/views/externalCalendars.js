import { api } from '../api.js'
import { layout, bindNav, escHtml } from '../layout.js'

export function renderExternalCalendars(container) {
  container.innerHTML = layout(`
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-white">External Calendars</h2>
      <p class="text-slate-400 mt-1 text-sm">ICS feeds and manual reminders. Drag to reorder.</p>
    </div>

    <div id="feeds-list" class="space-y-2 mb-8">
      <div class="flex items-center gap-3 text-slate-400 py-2">
        <div class="w-4 h-4 rounded-full border-2 border-slate-600 border-t-indigo-400 animate-spin flex-shrink-0"></div>
        <span class="text-sm">Loading…</span>
      </div>
    </div>

    <form id="add-feed-form" class="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <h4 class="text-sm font-medium text-white mb-4">Add Calendar</h4>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Name</label>
          <input id="feed-name" type="text" placeholder="My Calendar"
            class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                   placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">
            ICS URL <span class="text-slate-600 font-normal">(optional — leave blank for a manual reminder)</span>
          </label>
          <input id="feed-url" type="url" placeholder="https://example.com/calendar.ics"
            class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                   placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
        </div>
      </div>
      <div id="add-feed-error" class="text-red-400 text-xs mt-3 hidden"></div>
      <button type="submit"
        class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium
               rounded-lg transition-colors disabled:opacity-50">
        Add Calendar
      </button>
    </form>
  `)

  bindNav()
  loadFeeds()
  bindAddForm()
}

// ── Feeds list with drag-and-drop ─────────────────────────────────────────────

function loadFeeds() {
  api.listCalendars()
    .then(renderFeeds)
    .catch((err) => {
      const el = document.getElementById('feeds-list')
      if (el) el.innerHTML = `<p class="text-red-400 text-sm">${escHtml(err.message)}</p>`
    })
}

function renderFeeds(feeds) {
  const el = document.getElementById('feeds-list')
  if (!el) return

  if (feeds.length === 0) {
    el.innerHTML = `<p class="text-slate-500 text-sm italic">No external calendars added yet.</p>`
    return
  }

  el.innerHTML = ''
  let dragSrcIdx = null

  feeds.forEach((feed, idx) => {
    const row = document.createElement('div')
    row.className =
      'flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 transition-colors'
    row.draggable = true
    row.innerHTML = `
      <div class="flex-shrink-0 cursor-grab text-slate-600 hover:text-slate-400 select-none px-0.5" title="Drag to reorder">
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
          <circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/>
          <circle cx="2" cy="7" r="1.5"/><circle cx="8" cy="7" r="1.5"/>
          <circle cx="2" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-white text-sm font-medium">${escHtml(feed.name)}</p>
        ${feed.url
          ? `<p class="text-slate-500 text-xs truncate mt-0.5">${escHtml(feed.url)}</p>`
          : `<p class="text-amber-600/80 text-xs mt-0.5">Manual reminder — no URL</p>`
        }
      </div>
      ${feed.url ? `
        <button class="prev-btn flex-shrink-0 text-slate-500 hover:text-indigo-400 transition-colors text-xs px-2 py-1 rounded">
          Preview
        </button>
      ` : ''}
      <button class="del-btn flex-shrink-0 text-slate-500 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded">
        Remove
      </button>
    `

    row.addEventListener('dragstart', (e) => {
      dragSrcIdx = idx
      e.dataTransfer.effectAllowed = 'move'
      setTimeout(() => row.classList.add('opacity-40'), 0)
    })
    row.addEventListener('dragend', () => row.classList.remove('opacity-40'))
    row.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      row.classList.add('border-indigo-500')
    })
    row.addEventListener('dragleave', () => row.classList.remove('border-indigo-500'))
    row.addEventListener('drop', (e) => {
      e.preventDefault()
      row.classList.remove('border-indigo-500')
      if (dragSrcIdx === null || dragSrcIdx === idx) { dragSrcIdx = null; return }
      const reordered = [...feeds]
      const [moved] = reordered.splice(dragSrcIdx, 1)
      reordered.splice(idx, 0, moved)
      dragSrcIdx = null
      renderFeeds(reordered)
      api.reorderCalendars(reordered.map((f) => f.id)).catch((err) => {
        alert(err.message)
        api.listCalendars().then(renderFeeds)
      })
    })

    const prevBtn = row.querySelector('.prev-btn')
    if (prevBtn) {
      prevBtn.addEventListener('click', () => showPreviewModal(feed))
    }

    row.querySelector('.del-btn').addEventListener('click', async () => {
      const btn = row.querySelector('.del-btn')
      btn.disabled = true
      btn.textContent = '…'
      try {
        await api.deleteCalendar(feed.id)
        const updated = await api.listCalendars()
        renderFeeds(updated)
      } catch (err) {
        btn.disabled = false
        btn.textContent = 'Remove'
        alert(err.message)
      }
    })

    el.appendChild(row)
  })
}

// ── Preview modal ─────────────────────────────────────────────────────────────

function showPreviewModal(feed) {
  const existing = document.getElementById('preview-modal')
  if (existing) existing.remove()

  const modal = document.createElement('div')
  modal.id = 'preview-modal'
  modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-16'
  modal.innerHTML = `
    <div class="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg flex flex-col" style="max-height:70vh">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-700 flex-shrink-0">
        <div>
          <h3 class="text-white font-semibold text-sm">${escHtml(feed.name)}</h3>
          <p class="text-slate-500 text-xs mt-0.5">Next 2 weeks</p>
        </div>
        <button id="preview-close" class="text-slate-400 hover:text-white transition-colors p-1 rounded" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M3.293 3.293a1 1 0 011.414 0L8 6.586l3.293-3.293a1 1 0 111.414 1.414L9.414 8l3.293 3.293a1 1 0 01-1.414 1.414L8 9.414l-3.293 3.293a1 1 0 01-1.414-1.414L6.586 8 3.293 4.707a1 1 0 010-1.414z"/>
          </svg>
        </button>
      </div>
      <div id="preview-body" class="overflow-y-auto p-5">
        <div class="flex items-center gap-3 text-slate-400">
          <div class="w-4 h-4 rounded-full border-2 border-slate-600 border-t-indigo-400 animate-spin flex-shrink-0"></div>
          <span class="text-sm">Loading…</span>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  const close = () => modal.remove()
  document.getElementById('preview-close').addEventListener('click', close)
  modal.addEventListener('click', (e) => { if (e.target === modal) close() })

  api.previewCalendar(feed.id)
    .then((events) => {
      const body = document.getElementById('preview-body')
      if (!body) return

      if (events.length === 0) {
        body.innerHTML = `<p class="text-slate-500 text-sm italic">No events in the next 2 weeks.</p>`
        return
      }

      const groups = groupEventsByDate(events)
      body.innerHTML = groups.map(({ label, events: dayEvents }) => `
        <div class="mb-5 last:mb-0">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">${escHtml(label)}</p>
          <div class="space-y-1.5">
            ${dayEvents.map((ev) => `
              <div class="bg-slate-800 rounded-lg px-3 py-2">
                <p class="text-white text-sm">${escHtml(ev.title)}</p>
                <p class="text-indigo-400 text-xs mt-0.5">${escHtml(formatEventTime(ev))}</p>
                ${ev.location ? `<p class="text-slate-500 text-xs mt-0.5">${escHtml(ev.location)}</p>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')
    })
    .catch((err) => {
      const body = document.getElementById('preview-body')
      if (body) body.innerHTML = `<p class="text-red-400 text-sm">${escHtml(err.message)}</p>`
    })
}

function groupEventsByDate(events) {
  const map = new Map()
  for (const ev of events) {
    const d = new Date(ev.start)
    const key = ev.allDay
      ? `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`
      : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!map.has(key)) map.set(key, { date: d, allDay: ev.allDay, events: [] })
    map.get(key).events.push(ev)
  }

  return Array.from(map.values()).map(({ date, allDay, events: dayEvents }) => ({
    label: formatGroupDate(date, allDay),
    events: dayEvents,
  }))
}

function formatGroupDate(date, allDay) {
  const d = allDay
    ? new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    : date
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatEventTime(ev) {
  if (ev.allDay) return 'All day'
  const start = new Date(ev.start)
  const opts = { hour: '2-digit', minute: '2-digit' }
  if (!ev.end) return start.toLocaleTimeString(undefined, opts)
  const end = new Date(ev.end)
  return `${start.toLocaleTimeString(undefined, opts)} – ${end.toLocaleTimeString(undefined, opts)}`
}

// ── Add feed form ─────────────────────────────────────────────────────────────

function bindAddForm() {
  const form = document.getElementById('add-feed-form')
  if (!form) return

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const name    = document.getElementById('feed-name').value.trim()
    const url     = document.getElementById('feed-url').value.trim()
    const errorEl = document.getElementById('add-feed-error')
    const btn     = form.querySelector('button[type="submit"]')

    errorEl.classList.add('hidden')
    errorEl.textContent = ''

    if (!name) {
      errorEl.textContent = 'A name is required.'
      errorEl.classList.remove('hidden')
      return
    }

    btn.disabled = true
    btn.textContent = 'Adding…'

    try {
      await api.addCalendar({ name, url: url || null })
      document.getElementById('feed-name').value = ''
      document.getElementById('feed-url').value = ''
      const feeds = await api.listCalendars()
      renderFeeds(feeds)
    } catch (err) {
      errorEl.textContent = err.message
      errorEl.classList.remove('hidden')
    } finally {
      btn.disabled = false
      btn.textContent = 'Add Calendar'
    }
  })
}
