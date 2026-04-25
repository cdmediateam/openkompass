import { api } from '../api.js'
import { layout, bindNav, escHtml } from '../layout.js'

export function renderProfile(container) {
  container.innerHTML = layout(`
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">Edit Profile</h2>
        <p class="text-slate-400 mt-1 text-sm">Update your public identity.</p>
      </div>
    </div>

    <div class="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
      <div id="form-area" class="flex items-center gap-3 text-slate-400">
        <div class="w-5 h-5 rounded-full border-2 border-slate-600 border-t-indigo-400 animate-spin"></div>
        <span class="text-sm">Loading…</span>
      </div>
    </div>
  `)

  bindNav()

  api.getProfile()
    .then((profile) => {
      const area = document.getElementById('form-area')

      area.innerHTML = `
        <form id="profile-form" class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input id="display_name" type="text"
                value="${escHtml(profile.display_name)}"
                class="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       placeholder-slate-500 transition"
                placeholder="Your Name">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Fediverse Handle
              </label>
              <input id="fediverse_handle" type="text"
                value="${escHtml(profile.fediverse_handle)}"
                class="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       placeholder-slate-500 transition"
                placeholder="@you@instance.social">
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Avatar URL
            </label>
            <input id="avatar_url" type="url"
              value="${escHtml(profile.avatar_url)}"
              class="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                     placeholder-slate-500 transition"
              placeholder="https://example.com/avatar.jpg">
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Bio
            </label>
            <textarea id="bio" rows="4"
              class="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                     placeholder-slate-500 transition resize-none"
              placeholder="Tell the world about yourself…">${escHtml(profile.bio)}</textarea>
          </div>

          <div class="flex items-center gap-4 pt-1">
            <button type="submit"
              class="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold
                     rounded-lg px-5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2
                     focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800
                     disabled:opacity-50 disabled:cursor-not-allowed">
              Save changes
            </button>
            <span id="save-status" class="text-sm"></span>
          </div>
        </form>
      `

      const form = document.getElementById('profile-form')
      const status = document.getElementById('save-status')

      form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const btn = form.querySelector('button[type="submit"]')
        btn.disabled = true
        btn.textContent = 'Saving…'
        status.textContent = ''
        status.className = 'text-sm'

        try {
          await api.updateProfile({
            display_name: document.getElementById('display_name').value.trim() || null,
            fediverse_handle: document.getElementById('fediverse_handle').value.trim() || null,
            avatar_url: document.getElementById('avatar_url').value.trim() || null,
            bio: document.getElementById('bio').value.trim() || null,
          })
          status.textContent = 'Saved!'
          status.className = 'text-sm text-green-400'
          setTimeout(() => { status.textContent = '' }, 3000)
        } catch (err) {
          status.textContent = err.message
          status.className = 'text-sm text-red-400'
        } finally {
          btn.disabled = false
          btn.textContent = 'Save changes'
        }
      })
    })
    .catch((err) => {
      const area = document.getElementById('form-area')
      if (area) area.innerHTML = `<p class="text-red-400 text-sm">${escHtml(err.message)}</p>`
    })
}
