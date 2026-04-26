import { clearToken } from './api.js'

export function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function layout(content) {
  const current = window.location.hash.replace('#', '') || '/dashboard'

  const navItem = (href, label) => {
    const active = href === current
    return `<a href="#${href}" data-nav
      class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
             ${active
               ? 'bg-slate-700 text-white'
               : 'text-slate-400 hover:text-white hover:bg-slate-700'}"
    >${label}</a>`
  }

  return `
    <div class="min-h-screen bg-slate-900 flex">
      <aside class="w-56 bg-slate-800 border-r border-slate-700 fixed inset-y-0 flex flex-col">
        <div class="px-5 py-4 border-b border-slate-700">
          <span class="text-white font-bold text-base tracking-tight">OpenKompass</span>
        </div>
        <nav class="flex-1 p-3 space-y-0.5">
          ${navItem('/dashboard', 'Dashboard')}
          ${navItem('/events', 'Events Tomorrow')}
          ${navItem('/openkompass', 'OpenKompass')}
          ${navItem('/internal-calendar', 'Internal Calendar')}
          ${navItem('/external-calendars', 'External Calendars')}
          ${navItem('/profile', 'Edit Profile')}
        </nav>
        <div class="p-3 border-t border-slate-700">
          <button id="logout-btn"
            class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-400
                   hover:text-red-400 hover:bg-slate-700 transition-colors">
            Sign out
          </button>
        </div>
      </aside>
      <main class="ml-56 flex-1 p-8 max-w-3xl">
        ${content}
      </main>
    </div>
  `
}

export function bindNav() {
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    clearToken()
    window.location.hash = '#/login'
  })
}
