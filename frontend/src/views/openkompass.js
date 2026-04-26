import { api } from '../api.js'
import { layout, bindNav, escHtml } from '../layout.js'

const TYPE_EMOJIS = [
  '⚽','🏀','🎾','🏐','🏈','⚾','🏒','🏑','🏓','🏸',
  '🥊','🤼','🤸','🏋️','🚴','🏃','⛷️','🏂','🏊','🤽',
  '🤾','🎯','🎱','⛳','🏇','🛹','🥋','🎽','🏌️','🎣',
  '🤿','🏹',
]
const COUNTRY_EMOJIS = [
  '🌐','🇩🇪','🇫🇷','🇬🇧','🇺🇸','🇪🇸','🇮🇹','🇵🇹',
  '🇳🇱','🇧🇪','🇨🇭','🇦🇹','🇵🇱','🇨🇿','🇸🇰','🇸🇪',
  '🇳🇴','🇩🇰','🇫🇮','🇭🇺','🇷🇴','🇷🇺','🇺🇦','🇧🇬',
  '🇭🇷','🇸🇮','🇷🇸','🇬🇷','🇹🇷','🇦🇺','🇳🇿','🇨🇦',
  '🇯🇵','🇰🇷','🇨🇳','🇧🇷','🇦🇷','🇲🇽','🇿🇦','🇮🇱',
]

function pickerBtns(id, emojis, selected) {
  return emojis.map((e) => `
    <button type="button" data-picker="${id}" data-emoji="${e}"
      class="picker-btn w-8 h-8 text-base rounded transition-colors hover:bg-slate-600
             ${e === selected ? 'ring-2 ring-inset ring-indigo-500 bg-slate-700' : ''}">
      ${e}
    </button>`).join('')
}

export function renderOpenKompass(container) {
  container.innerHTML = layout(`
    <div class="mb-8 flex items-start justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">OpenKompass</h2>
        <p class="text-slate-400 mt-1 text-sm">Curated events and entries.</p>
      </div>
      <button id="ok-toggle-form"
        class="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors mt-1">
        + Add Entry
      </button>
    </div>

    <form id="ok-form" class="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6 hidden">
      <h4 id="ok-form-heading" class="text-sm font-medium text-white mb-4">New Entry</h4>
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Type *</label>
          <div id="ok-type-picker" class="flex flex-wrap gap-1 max-h-24 overflow-y-auto bg-slate-900/50 rounded-lg p-1.5">
            ${pickerBtns('ok-type', TYPE_EMOJIS, TYPE_EMOJIS[0])}
          </div>
          <input type="hidden" id="ok-type" value="${TYPE_EMOJIS[0]}">
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Country *</label>
          <div id="ok-country-picker" class="flex flex-wrap gap-1 max-h-24 overflow-y-auto bg-slate-900/50 rounded-lg p-1.5">
            ${pickerBtns('ok-country', COUNTRY_EMOJIS, COUNTRY_EMOJIS[0])}
          </div>
          <input type="hidden" id="ok-country" value="${COUNTRY_EMOJIS[0]}">
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Title *</label>
          <input id="ok-title" type="text" placeholder="Event title" autocomplete="off"
            class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                   placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Subtitle</label>
          <input id="ok-subtitle" type="text" placeholder="Optional"
            class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                   placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">Date *</label>
            <input id="ok-date" type="date"
              class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">Time</label>
            <input id="ok-time" type="time"
              class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Location</label>
          <input id="ok-location" type="text" placeholder="Optional"
            class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                   placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Description</label>
          <textarea id="ok-description" rows="2" placeholder="Optional"
            class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                   placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">Link label</label>
            <input id="ok-link-text" type="text" placeholder="Optional"
              class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                     placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">Link URL</label>
            <input id="ok-link-url" type="url" placeholder="https://…"
              class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                     placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          </div>
        </div>
      </div>
      <div id="ok-form-error" class="text-red-400 text-xs mt-3 hidden"></div>
      <div class="flex items-center gap-3 mt-4">
        <button type="submit" id="ok-form-submit"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium
                 rounded-lg transition-colors disabled:opacity-50">
          Add Entry
        </button>
        <button type="button" id="ok-form-cancel"
          class="text-sm text-slate-400 hover:text-white transition-colors px-2 py-2">
          Cancel
        </button>
      </div>
    </form>

    <div id="ok-list" class="space-y-3">
      <div class="flex items-center gap-3 text-slate-400 py-2">
        <div class="w-4 h-4 rounded-full border-2 border-slate-600 border-t-indigo-400 animate-spin flex-shrink-0"></div>
        <span class="text-sm">Loading…</span>
      </div>
    </div>

    <div class="mt-10">
      <h3 class="text-base font-semibold text-slate-500 mb-3">Sportkompass</h3>
      <div class="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5 text-center">
        <p class="text-slate-600 text-sm">Sportkompass entries will appear here.</p>
      </div>
    </div>
  `)

  bindNav()
  loadEntries()
  bindForm()
  checkPrefill()
}

// ── Entries list ──────────────────────────────────────────────────────────────

function loadEntries() {
  api.listOpenKompass()
    .then(renderList)
    .catch((err) => {
      const el = document.getElementById('ok-list')
      if (el) el.innerHTML = `<p class="text-red-400 text-sm">${escHtml(err.message)}</p>`
    })
}

function renderList(entries) {
  const el = document.getElementById('ok-list')
  if (!el) return

  if (entries.length === 0) {
    el.innerHTML = `<p class="text-slate-500 text-sm italic">No entries yet.</p>`
    return
  }

  el.innerHTML = ''
  entries.forEach((entry) => {
    const row = document.createElement('div')
    row.className = 'bg-slate-800 border border-slate-700 rounded-xl p-4'

    const timeStr = entry.event_time ? ` · ${entry.event_time}` : ''
    const locationLine = entry.location
      ? `<p class="text-slate-400 text-xs mt-0.5">${escHtml(entry.location)}</p>` : ''
    const descLine = entry.description
      ? `<p class="text-slate-500 text-xs mt-1 line-clamp-2">${escHtml(entry.description)}</p>` : ''
    const linkLine = buildLinkHtml(entry.link_url, entry.link_text)

    row.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="text-2xl leading-none flex-shrink-0 mt-0.5">${entry.type}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-base leading-none">${entry.country}</span>
            <p class="text-white text-sm font-medium">${escHtml(entry.title)}</p>
          </div>
          ${entry.subtitle ? `<p class="text-slate-300 text-xs mt-0.5">${escHtml(entry.subtitle)}</p>` : ''}
          <p class="text-slate-400 text-xs mt-0.5">${escHtml(formatDate(entry.event_date))}${escHtml(timeStr)}</p>
          ${locationLine}
          ${descLine}
          ${linkLine}
        </div>
        <div class="flex-shrink-0 flex gap-1">
          <button class="edit-btn text-slate-500 hover:text-indigo-400 transition-colors text-xs px-2 py-1 rounded">Edit</button>
          <button class="del-btn text-slate-500 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded">Delete</button>
        </div>
      </div>
    `

    row.querySelector('.edit-btn').addEventListener('click', () => {
      fillForm(entry)
      showForm()
      document.getElementById('ok-title').focus()
    })
    row.querySelector('.del-btn').addEventListener('click', async () => {
      const btn = row.querySelector('.del-btn')
      btn.disabled = true
      btn.textContent = '…'
      try {
        await api.deleteOpenKompass(entry.id)
        loadEntries()
      } catch (err) {
        btn.disabled = false
        btn.textContent = 'Delete'
        alert(err.message)
      }
    })

    el.appendChild(row)
  })
}

function buildLinkHtml(url, text) {
  if (!url && !text) return ''
  if (!url) return `<p class="text-slate-400 text-xs mt-1">${escHtml(text)}</p>`
  try {
    const u = new URL(url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return text ? `<p class="text-slate-400 text-xs mt-1">${escHtml(text)}</p>` : ''
    }
  } catch {
    return text ? `<p class="text-slate-400 text-xs mt-1">${escHtml(text)}</p>` : ''
  }
  const label = text || url
  return `<a href="${escHtml(url)}" target="_blank" rel="noopener noreferrer"
    class="text-indigo-400 hover:text-indigo-300 text-xs mt-1 inline-block">${escHtml(label)}</a>`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  })
}

// ── Form ──────────────────────────────────────────────────────────────────────

let editingId = null

function showForm() { document.getElementById('ok-form')?.classList.remove('hidden') }
function hideForm() { document.getElementById('ok-form')?.classList.add('hidden'); resetForm() }

function resetForm() {
  editingId = null
  document.getElementById('ok-form')?.reset()
  setPickerValue('ok-type', TYPE_EMOJIS[0])
  setPickerValue('ok-country', COUNTRY_EMOJIS[0])
  const h = document.getElementById('ok-form-heading')
  const s = document.getElementById('ok-form-submit')
  if (h) h.textContent = 'New Entry'
  if (s) s.textContent = 'Add Entry'
  const err = document.getElementById('ok-form-error')
  if (err) { err.classList.add('hidden'); err.textContent = '' }
}

function fillForm(entry) {
  editingId = entry.id || null
  setPickerValue('ok-type', entry.type || TYPE_EMOJIS[0])
  setPickerValue('ok-country', entry.country || COUNTRY_EMOJIS[0])
  document.getElementById('ok-title').value = entry.title || ''
  document.getElementById('ok-subtitle').value = entry.subtitle || ''
  document.getElementById('ok-date').value = entry.event_date || ''
  document.getElementById('ok-time').value = entry.event_time || ''
  document.getElementById('ok-location').value = entry.location || ''
  document.getElementById('ok-description').value = entry.description || ''
  document.getElementById('ok-link-text').value = entry.link_text || ''
  document.getElementById('ok-link-url').value = entry.link_url || ''
  if (entry.id) {
    const h = document.getElementById('ok-form-heading')
    const s = document.getElementById('ok-form-submit')
    if (h) h.textContent = 'Edit Entry'
    if (s) s.textContent = 'Save Changes'
  }
}

function setPickerValue(id, emoji) {
  const input = document.getElementById(id)
  if (input) input.value = emoji
  const containerId = id === 'ok-type' ? 'ok-type-picker' : 'ok-country-picker'
  document.querySelectorAll(`#${containerId} [data-picker="${id}"]`).forEach((btn) => {
    const sel = btn.dataset.emoji === emoji
    btn.classList.toggle('ring-2', sel)
    btn.classList.toggle('ring-inset', sel)
    btn.classList.toggle('ring-indigo-500', sel)
    btn.classList.toggle('bg-slate-700', sel)
  })
}

function checkPrefill() {
  const raw = sessionStorage.getItem('ok-prefill')
  if (!raw) return
  sessionStorage.removeItem('ok-prefill')
  try {
    fillForm(JSON.parse(raw))
    showForm()
  } catch {}
}

function bindForm() {
  document.getElementById('ok-toggle-form')?.addEventListener('click', () => {
    const form = document.getElementById('ok-form')
    if (form?.classList.contains('hidden')) { resetForm(); showForm() }
    else hideForm()
  })

  document.getElementById('ok-form-cancel')?.addEventListener('click', hideForm)

  document.querySelectorAll('[data-picker]').forEach((btn) => {
    btn.addEventListener('click', () => setPickerValue(btn.dataset.picker, btn.dataset.emoji))
  })

  document.getElementById('ok-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()

    const type        = document.getElementById('ok-type').value
    const country     = document.getElementById('ok-country').value
    const title       = document.getElementById('ok-title').value.trim()
    const subtitle    = document.getElementById('ok-subtitle').value.trim() || null
    const event_date  = document.getElementById('ok-date').value
    const event_time  = document.getElementById('ok-time').value || null
    const location    = document.getElementById('ok-location').value.trim() || null
    const description = document.getElementById('ok-description').value.trim() || null
    const link_text   = document.getElementById('ok-link-text').value.trim() || null
    const link_url    = document.getElementById('ok-link-url').value.trim() || null
    const errorEl     = document.getElementById('ok-form-error')
    const submitBtn   = document.getElementById('ok-form-submit')

    errorEl.classList.add('hidden')
    errorEl.textContent = ''

    if (!type || !country || !title || !event_date) {
      errorEl.textContent = 'Type, country, title, and date are required.'
      errorEl.classList.remove('hidden')
      return
    }

    submitBtn.disabled = true
    try {
      const payload = { type, country, title, subtitle, event_date, event_time, location, description, link_text, link_url }
      if (editingId) {
        await api.updateOpenKompass(editingId, payload)
      } else {
        await api.createOpenKompass(payload)
      }
      hideForm()
      loadEntries()
    } catch (err) {
      errorEl.textContent = err.message
      errorEl.classList.remove('hidden')
    } finally {
      submitBtn.disabled = false
    }
  })
}
