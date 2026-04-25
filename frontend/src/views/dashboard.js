import { api } from '../api.js'
import { layout, bindNav, escHtml } from '../layout.js'

export function renderDashboard(container) {
  container.innerHTML = layout(`
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-white">Dashboard</h2>
      <p class="text-slate-400 mt-1 text-sm">Your OpenKompass instance.</p>
    </div>

    <div id="profile-card" class="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
      <div class="flex items-center gap-3 text-slate-400">
        <div class="w-5 h-5 rounded-full border-2 border-slate-600 border-t-indigo-400 animate-spin"></div>
        <span class="text-sm">Loading profile…</span>
      </div>
    </div>
  `)

  bindNav()

  api.getProfile()
    .then((profile) => {
      const card = document.getElementById('profile-card')
      const initial = (profile.display_name || '?')[0].toUpperCase()

      card.innerHTML = `
        <div class="flex items-start gap-5">
          <div class="flex-shrink-0">
            ${profile.avatar_url
              ? `<img src="${escHtml(profile.avatar_url)}" alt="Avatar"
                   class="w-16 h-16 rounded-full object-cover ring-2 ring-slate-600">`
              : `<div class="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center
                            text-white text-xl font-bold ring-2 ring-slate-600">
                   ${escHtml(initial)}
                 </div>`
            }
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-white truncate">
              ${escHtml(profile.display_name || 'No display name set')}
            </h3>
            ${profile.fediverse_handle
              ? `<p class="text-indigo-400 text-sm mt-0.5">${escHtml(profile.fediverse_handle)}</p>`
              : '<p class="text-slate-500 text-sm mt-0.5 italic">No fediverse handle set</p>'
            }
            ${profile.bio
              ? `<p class="text-slate-300 text-sm mt-3 leading-relaxed">${escHtml(profile.bio)}</p>`
              : '<p class="text-slate-500 text-sm mt-3 italic">No bio yet.</p>'
            }
            <a href="#/profile"
               class="inline-flex items-center gap-1 mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
              Edit profile
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>
      `
    })
    .catch((err) => {
      const card = document.getElementById('profile-card')
      if (card) card.innerHTML = `<p class="text-red-400 text-sm">${escHtml(err.message)}</p>`
    })
}
