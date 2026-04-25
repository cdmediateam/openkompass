import './main.css'
import { isAuthenticated } from './api.js'
import { renderLogin } from './views/login.js'
import { renderDashboard } from './views/dashboard.js'
import { renderProfile } from './views/profile.js'
import { renderEvents } from './views/events.js'
import { renderInternalCalendar } from './views/internalCalendar.js'
import { renderExternalCalendars } from './views/externalCalendars.js'

const routes = {
  '/login':              { render: renderLogin,             public: true  },
  '/dashboard':          { render: renderDashboard,         public: false },
  '/events':             { render: renderEvents,            public: false },
  '/internal-calendar':  { render: renderInternalCalendar,  public: false },
  '/external-calendars': { render: renderExternalCalendars, public: false },
  '/profile':            { render: renderProfile,           public: false },
}

function navigate(hash) {
  const path = hash.replace('#', '') || '/login'
  const route = routes[path]

  if (!route) {
    window.location.hash = isAuthenticated() ? '#/dashboard' : '#/login'
    return
  }

  if (!route.public && !isAuthenticated()) {
    window.location.hash = '#/login'
    return
  }

  if (path === '/login' && isAuthenticated()) {
    window.location.hash = '#/dashboard'
    return
  }

  const app = document.getElementById('app')
  route.render(app)
}

window.addEventListener('hashchange', () => navigate(window.location.hash))
navigate(window.location.hash)
