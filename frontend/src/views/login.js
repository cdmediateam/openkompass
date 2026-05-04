import { api, setToken } from '../api.js'

export function renderLogin(container) {
  container.innerHTML = `
    <div class="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div class="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-slate-700">
        <div class="mb-8 text-center">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-white tracking-tight">OpenKompass</h1>
          <p class="text-slate-400 mt-1 text-sm">Sign in to your instance</p>
        </div>

        <form id="login-form" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input id="username" type="text" autocomplete="username"
              class="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                     placeholder-slate-500 transition"
              placeholder="admin">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input id="password" type="password" autocomplete="current-password"
              class="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                     placeholder-slate-500 transition"
              placeholder="••••••••">
          </div>

          <div id="error-msg" class="hidden rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-sm"></div>

          <button type="submit"
            class="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold
                   rounded-lg px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2
                   focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800
                   disabled:opacity-50 disabled:cursor-not-allowed">
            Sign in
          </button>
        </form>
      </div>
    </div>
  `

  const form = document.getElementById('login-form')
  const errorMsg = document.getElementById('error-msg')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const username = document.getElementById('username').value.trim()
    const password = document.getElementById('password').value
    const btn = form.querySelector('button[type="submit"]')

    if (!username || !password) return

    errorMsg.classList.add('hidden')
    btn.disabled = true
    btn.textContent = 'Signing in…'

    try {
      const { token } = await api.login(username, password)
      setToken(token)
      window.location.hash = '#/events'
    } catch (err) {
      errorMsg.textContent = 'Invalid credentials'
      errorMsg.classList.remove('hidden')
      btn.disabled = false
      btn.textContent = 'Sign in'
    }
  })
}
