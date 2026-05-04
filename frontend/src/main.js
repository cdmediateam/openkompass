import './main.css'
import { isAuthenticated } from './api.js'
import { renderLogin } from './views/login.js'
import { renderDashboard } from './views/dashboard.js'
import { renderProfile } from './views/profile.js'
import { renderEvents } from './views/events.js'
import { renderInternalCalendar } from './views/internalCalendar.js'
import { renderExternalCalendars } from './views/externalCalendars.js'
import { renderOpenKompass } from './views/openkompass.js'
import { renderUpvote } from './views/upvote.js'

const routes = {
  '/login':              { render: renderLogin,             public: true  },
  '/upvote':             { render: renderUpvote,            public: true  },
  '/dashboard':          { render: renderDashboard,         public: false },
  '/events':             { render: renderEvents,            public: false },
  '/openkompass':        { render: renderOpenKompass,       public: false },
  '/internal-calendar':  { render: renderInternalCalendar,  public: false },
  '/external-calendars': { render: renderExternalCalendars, public: false },
  '/profile':            { render: renderProfile,           public: false },
}

function navigate(hash) {
  const full = hash.replace('#', '') || '/login'
  const path = full.split('?')[0]
  const route = routes[path]

  if (!route) {
    window.location.hash = isAuthenticated() ? '#/events' : '#/login'
    return
  }

  if (!route.public && !isAuthenticated()) {
    window.location.hash = '#/login'
    return
  }

  if (path === '/login' && isAuthenticated()) {
    window.location.hash = '#/events'
    return
  }

  const app = document.getElementById('app')
  route.render(app)
}

window.addEventListener('hashchange', () => navigate(window.location.hash))
navigate(window.location.hash)
