function getHashParams() {
  const hash = window.location.hash
  const qIdx = hash.indexOf('?')
  if (qIdx === -1) return {}
  return Object.fromEntries(new URLSearchParams(hash.slice(qIdx + 1)))
}

function stripHtml(html) {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || ''
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function postCardHtml(post) {
  const spoiler = post.spoiler_text
    ? `<div class="text-slate-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
        ${post.spoiler_text}
      </div>` : ''

  const mediaHtml = post.media_attachments?.length
    ? `<div class="mt-2 grid ${post.media_attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5 rounded-lg overflow-hidden">
        ${post.media_attachments.slice(0, 4).map(m =>
          m.type === 'image'
            ? `<img src="${m.preview_url}" alt="${m.description || ''}"
                class="w-full h-32 object-cover bg-slate-700">`
            : `<div class="h-32 bg-slate-700 flex items-center justify-center text-slate-500 text-xs">[${m.type}]</div>`
        ).join('')}
      </div>` : ''

  return `
    <article class="post-card bg-slate-800 rounded-xl border border-slate-700 p-4" data-url="${post.url}">
      ${spoiler}
      <div class="text-slate-300 text-sm leading-relaxed
                  [&_p]:mb-2 [&_p:last-child]:mb-0
                  [&_a]:text-indigo-400 [&_a:hover]:text-indigo-300">
        ${post.content}
      </div>
      ${mediaHtml}
      <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/60">
        <div class="flex items-center gap-4 text-slate-500 text-xs">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            ${post.replies_count ?? 0}
          </span>
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            ${post.reblogs_count ?? 0}
          </span>
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
            ${post.favourites_count ?? 0}
          </span>
          <span>${timeAgo(post.created_at)}</span>
        </div>
        <button class="boost-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                       bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white
                       transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                data-ap-id="${post.ap_id || post.url}">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Boost
        </button>
      </div>
    </article>
  `
}

async function loadFeed(feedEl, user) {
  feedEl.innerHTML = `
    <div class="flex items-center justify-center py-10 text-slate-500 text-sm">
      <svg class="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      Loading posts…
    </div>`

  let posts
  try {
    const res = await fetch('/api/mastodon/feed')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    posts = await res.json()
  } catch {
    feedEl.innerHTML = `<p class="text-red-400 text-sm text-center py-6">Could not load posts.</p>`
    return
  }

  if (!posts.length) {
    feedEl.innerHTML = `<p class="text-slate-500 text-sm text-center py-6">No posts found.</p>`
    return
  }

  feedEl.innerHTML = posts.map(postCardHtml).join('')

  if (!user.access_token) {
    feedEl.querySelectorAll('.boost-btn').forEach(btn => {
      btn.disabled = true
      btn.title = 'Sign out and re-authenticate to enable boosting'
    })
    return
  }

  feedEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('.boost-btn')
    if (!btn || btn.disabled) return

    const statusUrl = btn.dataset.apId
    btn.disabled = true
    btn.innerHTML = `
      <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      Boosting…`

    try {
      const res = await fetch('/api/mastodon/boost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mastodon-token': user.access_token,
          'x-mastodon-server': user.server,
        },
        body: JSON.stringify({ statusUrl }),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}))
        throw new Error(error || `HTTP ${res.status}`)
      }
      btn.innerHTML = `
        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Boosted!`
      btn.classList.remove('bg-slate-700', 'hover:bg-indigo-600', 'text-slate-300', 'hover:text-white')
      btn.classList.add('bg-green-600/20', 'text-green-400')
    } catch (err) {
      btn.disabled = false
      btn.innerHTML = `
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Boost`
      const card = btn.closest('.post-card')
      let errEl = card.querySelector('.boost-error')
      if (!errEl) {
        errEl = document.createElement('p')
        errEl.className = 'boost-error text-red-400 text-xs mt-2 text-right'
        card.appendChild(errEl)
      }
      errEl.textContent = err.message
    }
  })
}

function renderProfile(container, user) {
  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : ''

  container.innerHTML = `
    <div class="min-h-screen bg-slate-900 p-4">
      <div class="max-w-xl mx-auto space-y-4">

        ${user.header ? `
        <div class="rounded-2xl overflow-hidden h-40 bg-slate-800">
          <img src="${user.header}" alt="" class="w-full h-full object-cover">
        </div>` : ''}

        <div class="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-6
                    ${user.header ? '-mt-10 pt-8' : ''}">
          <div class="flex items-start gap-4 mb-6">
            ${user.avatar ? `
            <img src="${user.avatar}" alt="${user.display_name || user.username}"
              class="w-16 h-16 rounded-xl border-2 border-slate-700 flex-shrink-0">
            ` : `
            <div class="w-16 h-16 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl font-bold text-white">${(user.display_name || user.username || '?')[0].toUpperCase()}</span>
            </div>
            `}
            <div class="min-w-0">
              <h2 class="text-xl font-bold text-white truncate">${user.display_name || user.username}</h2>
              <a href="${user.url}" target="_blank" rel="noopener noreferrer"
                class="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
                @${user.username}@${new URL(user.server).hostname}
              </a>
              ${joined ? `<p class="text-slate-500 text-xs mt-1">Joined ${joined}</p>` : ''}
            </div>
          </div>

          ${user.note ? `
          <p class="text-slate-300 text-sm leading-relaxed mb-6 border-l-2 border-indigo-600 pl-3">
            ${stripHtml(user.note)}
          </p>` : ''}

          <div class="grid grid-cols-3 gap-3 mb-6">
            <div class="bg-slate-700/50 rounded-xl p-3 text-center">
              <div class="text-white font-bold text-lg">${(user.statuses_count ?? 0).toLocaleString()}</div>
              <div class="text-slate-400 text-xs mt-0.5">Posts</div>
            </div>
            <div class="bg-slate-700/50 rounded-xl p-3 text-center">
              <div class="text-white font-bold text-lg">${(user.followers_count ?? 0).toLocaleString()}</div>
              <div class="text-slate-400 text-xs mt-0.5">Followers</div>
            </div>
            <div class="bg-slate-700/50 rounded-xl p-3 text-center">
              <div class="text-white font-bold text-lg">${(user.following_count ?? 0).toLocaleString()}</div>
              <div class="text-slate-400 text-xs mt-0.5">Following</div>
            </div>
          </div>

          <div class="flex gap-3">
            <a href="${user.url}" target="_blank" rel="noopener noreferrer"
              class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold
                     rounded-lg px-4 py-2.5 text-center transition-colors">
              View on Mastodon
            </a>
            <button id="switch-account"
              class="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold
                     rounded-lg transition-colors">
              Switch
            </button>
          </div>
        </div>

        <div class="pb-1">
          <h3 class="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 px-1">
            Recent posts by @index@vsport.online
          </h3>
          <div id="feed-container" class="space-y-3"></div>
        </div>

      </div>
    </div>
  `

  document.getElementById('switch-account').addEventListener('click', () => {
    clearUser()
    window.location.hash = '#/upvote'
  })

  loadFeed(document.getElementById('feed-container'), user)
}

function renderForm(container, errorCode) {
  const errorMessages = {
    missing_params: 'Authentication was cancelled or incomplete.',
    expired: 'Login session expired — please try again.',
    token_exchange: 'Failed to complete login. The server may not support this flow.',
    user_fetch: 'Logged in but could not retrieve your profile.',
  }
  const errorText = errorMessages[errorCode] || null

  container.innerHTML = `
    <div class="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div class="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-slate-700">
        <div class="mb-8 text-center">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.327 8.566c0-4.339-2.843-5.61-2.843-5.61-1.433-.658-3.894-.935-6.451-.956h-.063c-2.557.021-5.016.298-6.45.956 0 0-2.843 1.272-2.843 5.61 0 .993-.019 2.181.012 3.441.103 4.243.778 8.425 4.701 9.463 1.809.479 3.362.579 4.612.51 2.268-.126 3.541-.809 3.541-.809l-.075-1.646s-1.621.511-3.441.449c-1.804-.062-3.707-.194-3.999-2.409a4.523 4.523 0 0 1-.04-.621s1.77.433 4.014.536c1.372.063 2.658-.08 3.965-.236 2.506-.299 4.688-1.843 4.962-3.254.434-2.223.398-5.424.398-5.424zm-3.353 5.59h-2.081V9.057c0-1.075-.452-1.62-1.357-1.62-1 0-1.501.647-1.501 1.927v2.791h-2.069V9.364c0-1.28-.501-1.927-1.502-1.927-.905 0-1.357.546-1.357 1.62v5.099H6.026V8.903c0-1.074.273-1.927.823-2.558.566-.631 1.307-.955 2.228-.955 1.065 0 1.872.409 2.405 1.228l.518.869.519-.869c.533-.819 1.34-1.228 2.405-1.228.92 0 1.662.324 2.228.955.549.631.822 1.484.822 2.558v5.253z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Sign in with Mastodon</h1>
          <p class="text-slate-400 mt-1 text-sm">Enter your Mastodon server to continue</p>
        </div>

        ${errorText ? `
        <div class="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-sm mb-4">
          ${errorText}
        </div>` : ''}

        <form id="mastodon-form" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Server
            </label>
            <input id="server-input" type="text" autocomplete="off" spellcheck="false"
              class="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                     placeholder-slate-500 transition"
              placeholder="mastodon.social">
          </div>

          <div id="form-error" class="hidden rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-sm"></div>

          <button type="submit"
            class="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold
                   rounded-lg px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2
                   focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800
                   disabled:opacity-50 disabled:cursor-not-allowed">
            Continue
          </button>
        </form>

        <p class="text-slate-600 text-xs text-center mt-6">
          Read and write access is requested. No data is stored server-side.
        </p>
      </div>
    </div>
  `

  const form = document.getElementById('mastodon-form')
  const formError = document.getElementById('form-error')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const server = document.getElementById('server-input').value.trim()
    const btn = form.querySelector('button[type="submit"]')

    if (!server) return

    formError.classList.add('hidden')
    btn.disabled = true
    btn.textContent = 'Connecting…'

    try {
      const res = await fetch(`/api/mastodon/auth?server=${encodeURIComponent(server)}&callback_origin=${encodeURIComponent(window.location.origin)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      window.location.href = data.authorizeUrl
    } catch (err) {
      formError.textContent = err.message || 'Could not connect to that server.'
      formError.classList.remove('hidden')
      btn.disabled = false
      btn.textContent = 'Continue'
    }
  })
}

const STORAGE_KEY = 'mastodon_user'

function saveUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

function clearUser() {
  localStorage.removeItem(STORAGE_KEY)
}

export function renderUpvote(container) {
  const params = getHashParams()

  // Returning from OAuth — decode, persist, clean up the URL
  if (params.user) {
    try {
      const user = JSON.parse(atob(params.user.replace(/-/g, '+').replace(/_/g, '/')))
      saveUser(user)
      history.replaceState(null, '', '/#/upvote')
      renderProfile(container, user)
    } catch {
      renderForm(container, null)
    }
    return
  }

  // Already logged in from a previous session
  const stored = loadUser()
  if (stored) {
    renderProfile(container, stored)
    return
  }

  renderForm(container, params.error || null)
}
