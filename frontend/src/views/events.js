import { api } from '../api.js'
import { layout, bindNav, escHtml } from '../layout.js'

export function renderEvents(container) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowLabel = tomorrow.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  container.innerHTML = layout(`
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-white">Events</h2>
      <p class="text-slate-400 mt-1 text-sm">Tomorrow · ${escHtml(tomorrowLabel)}</p>
    </div>

    <div id="events-list" class="space-y-3">
      <div class="flex items-center gap-3 text-slate-400 py-2">
        <div class="w-4 h-4 rounded-full border-2 border-slate-600 border-t-indigo-400 animate-spin flex-shrink-0"></div>
        <span class="text-sm">Loading events…</span>
      </div>
    </div>
  `)

  bindNav()

  let loadedEvents = []

  api.getTomorrowEvents()
    .then((events) => {
      loadedEvents = events
      const el = document.getElementById('events-list')
      if (!el) return
      if (events.length === 0) {
        el.innerHTML = `
          <div class="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
            <p class="text-slate-400 text-sm">No events tomorrow.</p>
          </div>`
        return
      }
      el.innerHTML = events.map((e, i) => renderCard(e, i)).join('')
      el.querySelectorAll('.ok-btn').forEach((btn) => {
        const idx = Number(btn.dataset.idx)
        btn.addEventListener('click', () => convertToOpenKompass(loadedEvents[idx]))
      })
    })
    .catch((err) => {
      const el = document.getElementById('events-list')
      if (el) el.innerHTML = `<p class="text-red-400 text-sm">${escHtml(err.message)}</p>`
    })
}

function renderCard(event, index) {
  if (event.notChecked) {
    return `
      <div class="bg-slate-800 border border-amber-800/50 rounded-xl p-4">
        <div class="flex items-start gap-3">
          <div class="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5"></div>
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-medium">${escHtml(event.title)}</p>
            <span class="inline-block mt-1 px-2 py-0.5 bg-amber-900/50 text-amber-400 text-xs rounded font-medium">not checked</span>
          </div>
        </div>
      </div>`
  }

  const dot = event.internal ? 'bg-emerald-400' : 'bg-indigo-400'
  const timeLabel = event.allDay ? 'All day' : formatTime(event.start, event.end)
  return `
    <div class="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div class="flex items-start gap-3">
        <div class="w-2 h-2 rounded-full ${dot} flex-shrink-0 mt-1.5"></div>
        <div class="flex-1 min-w-0">
          <p class="text-white text-sm font-medium">${escHtml(event.title)}</p>
          <p class="text-slate-400 text-xs mt-0.5">${escHtml(timeLabel)}</p>
          ${event.location ? `<p class="text-slate-400 text-xs mt-1">${escHtml(event.location)}</p>` : ''}
          <p class="text-slate-600 text-xs mt-1">${escHtml(event.feedName)}</p>
        </div>
        <button class="ok-btn flex-shrink-0 text-xs px-2 py-1 rounded bg-slate-700 hover:bg-indigo-700 text-slate-300 hover:text-white transition-colors" data-idx="${index}">
          + OpenKompass
        </button>
      </div>
    </div>`
}

function formatTime(startIso, endIso) {
  const opts = { hour: '2-digit', minute: '2-digit' }
  const start = new Date(startIso).toLocaleTimeString(undefined, opts)
  if (!endIso) return start
  const end = new Date(endIso).toLocaleTimeString(undefined, opts)
  return `${start} – ${end}`
}

function convertToOpenKompass(event) {
  const d = new Date(event.start)
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const time = event.allDay ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  sessionStorage.setItem('ok-prefill', JSON.stringify({
    title: event.title,
    event_date: date,
    event_time: time,
    location: event.location || '',
    description: event.description || '',
  }))
  window.location.hash = '#/openkompass'
}
