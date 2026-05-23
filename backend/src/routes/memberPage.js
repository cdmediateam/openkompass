import { Hono } from 'hono'

const router = new Hono()

router.get('/member', (c) => {
  const ghostUrl = (process.env.GHOST_URL || '/').replace(/\/$/, '')

  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenKompass · Member Area</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: #f4f4f5;
      color: #18181b;
      min-height: 100vh;
    }
    header {
      background: #18181b;
      color: #fff;
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    header h1 { font-size: 17px; font-weight: 700; letter-spacing: -0.2px; }
    header a { color: #a1a1aa; font-size: 13px; text-decoration: none; }
    header a:hover { color: #fff; }
    main { max-width: 640px; margin: 32px auto; padding: 0 16px 80px; }
    .member-card {
      background: #fff;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 24px;
      border: 1px solid #e4e4e7;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .member-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: #18181b; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 700; flex-shrink: 0;
    }
    .member-info { flex: 1; min-width: 0; }
    .member-name { font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .member-email { font-size: 13px; color: #71717a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .member-badge {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.07em; background: #dcfce7; color: #16a34a;
      padding: 2px 8px; border-radius: 99px; flex-shrink: 0;
    }
    .logout-btn {
      font-size: 12px; color: #71717a; background: none; border: none;
      cursor: pointer; padding: 4px 0; text-decoration: underline;
      display: block; margin-top: 2px;
    }
    .logout-btn:hover { color: #18181b; }
    .date-heading {
      font-size: 12px; font-weight: 600; color: #71717a;
      text-transform: uppercase; letter-spacing: 0.08em;
      margin-bottom: 14px;
    }
    .card {
      background: #fff;
      border-radius: 10px;
      padding: 18px 20px;
      margin-bottom: 10px;
      border: 1px solid #e4e4e7;
    }
    .meta { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .badge {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.07em; background: #f4f4f5; color: #52525b;
      padding: 2px 7px; border-radius: 99px;
    }
    .country { font-size: 16px; line-height: 1; }
    .time { font-size: 12px; color: #71717a; margin-left: auto; font-variant-numeric: tabular-nums; }
    .title { font-size: 16px; font-weight: 600; line-height: 1.3; margin-bottom: 4px; }
    .subtitle { font-size: 14px; color: #52525b; margin-bottom: 6px; }
    .location { font-size: 13px; color: #71717a; margin-bottom: 8px; }
    .desc { font-size: 14px; color: #3f3f46; line-height: 1.5; margin-bottom: 10px; }
    .link { font-size: 13px; font-weight: 500; color: #2563eb; text-decoration: none; }
    .link:hover { text-decoration: underline; }
    .empty { text-align: center; padding: 60px 0; color: #71717a; font-size: 15px; }
    .state { text-align: center; padding: 80px 16px; }
    .state p { color: #71717a; margin-bottom: 20px; font-size: 15px; }
    .state a {
      color: #fff; background: #18181b; padding: 10px 20px;
      border-radius: 8px; font-size: 14px; font-weight: 600;
      text-decoration: none; display: inline-block;
    }
    .state a:hover { background: #27272a; }
  </style>
</head>
<body>
  <header>
    <h1>OpenKompass</h1>
    <a href="${ghostUrl}">← Back</a>
  </header>
  <main id="app">
    <div class="state"><p>Loading…</p></div>
  </main>
  <script>
    var GHOST_URL = ${JSON.stringify(ghostUrl)};

    function esc(s) {
      return s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
    }

    function fmtDate(str) {
      if (!str) return '';
      var d = new Date(str + 'T00:00:00');
      return d.toLocaleDateString('de-CH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    function decodeJwt(token) {
      try {
        var payload = token.split('.')[1];
        return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      } catch (e) { return null; }
    }

    function logout() {
      sessionStorage.removeItem('okm_token');
      window.location.href = GHOST_URL;
    }

    function renderMemberCard(user) {
      var initial = (user.name || user.email || '?')[0].toUpperCase();
      var name = user.name ? '<p class="member-name">' + esc(user.name) + '</p>' : '';
      var email = '<p class="member-email">' + esc(user.email) + '</p>';
      return '<div class="member-card">'
        + '<div class="member-avatar">' + esc(initial) + '</div>'
        + '<div class="member-info">' + name + email
        + '<button class="logout-btn" onclick="logout()">Log out</button>'
        + '</div>'
        + '<span class="member-badge">Member</span>'
        + '</div>';
    }

    function renderEvents(events, user) {
      var app = document.getElementById('app');
      var html = renderMemberCard(user);

      if (!events.length) {
        html += '<div class="empty">No events today.</div>';
        app.innerHTML = html;
        return;
      }

      html += '<p class="date-heading">Today &middot; ' + fmtDate(events[0].event_date) + '</p>';

      for (var i = 0; i < events.length; i++) {
        var e = events[i];
        var type     = e.type        ? '<span class="badge">'   + esc(e.type)       + '</span>' : '';
        var country  = e.country     ? '<span class="country">' + esc(e.country)    + '</span>' : '';
        var time     = e.event_time  ? '<span class="time">'    + esc(e.event_time) + '</span>' : '';
        var subtitle = e.subtitle    ? '<p class="subtitle">'   + esc(e.subtitle)   + '</p>' : '';
        var location = e.location    ? '<p class="location">&#128205; ' + esc(e.location) + '</p>' : '';
        var desc     = e.description ? '<p class="desc">'       + esc(e.description) + '</p>' : '';
        var link     = (e.link_url && e.link_text)
          ? '<a class="link" href="' + esc(e.link_url) + '" target="_blank" rel="noopener">' + esc(e.link_text) + ' &rarr;</a>'
          : '';

        html += '<div class="card">'
          + '<div class="meta">' + type + country + time + '</div>'
          + '<p class="title">' + esc(e.title) + '</p>'
          + subtitle + location + desc + link
          + '</div>';
      }

      app.innerHTML = html;
    }

    function showState(msg, linkText, linkHref) {
      var link = linkText ? '<a href="' + esc(linkHref) + '">' + esc(linkText) + '</a>' : '';
      document.getElementById('app').innerHTML = '<div class="state"><p>' + msg + '</p>' + link + '</div>';
    }

    (function () {
      // Pick up token from URL (cross-domain redirect from Ghost), then clean the URL
      var params = new URLSearchParams(window.location.search);
      var urlToken = params.get('token');
      if (urlToken) {
        sessionStorage.setItem('okm_token', urlToken);
        history.replaceState(null, '', '/member');
      }

      var token = sessionStorage.getItem('okm_token');
      if (!token) {
        showState('Please log in as a paid member on Ghost to access this area.', 'Go to Ghost →', GHOST_URL);
        return;
      }

      var user = decodeJwt(token) || {};

      fetch('/api/member/today', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(function (res) {
          if (res.status === 401) {
            sessionStorage.removeItem('okm_token');
            showState('Your session has expired. Please log in again.', 'Go to Ghost →', GHOST_URL);
            return null;
          }
          return res.json();
        })
        .then(function (data) {
          if (data) renderEvents(data.events, user);
        })
        .catch(function () {
          showState('Could not load events. Please try again later.');
        });
    })();
  </script>
</body>
</html>`)
})

export default router
