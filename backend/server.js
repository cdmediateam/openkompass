import './env.js'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { fileURLToPath } from 'url'
import { dirname, resolve, relative } from 'path'
import app from './src/app.js'

const port = Number(process.env.PORT) || 3000

if (process.env.NODE_ENV === 'production') {
  // Resolve the built frontend directory relative to this file, then express it
  // relative to process.cwd() — required by serveStatic's root option.
  const __dir = dirname(fileURLToPath(import.meta.url))
  const distAbs = resolve(__dir, '../frontend/dist')
  const root = relative(process.cwd(), distAbs) || '.'

  // Serve static assets (JS, CSS, images …)
  app.use('/*', serveStatic({ root }))

  // SPA catch-all: any path that isn't an API route or a real file gets index.html.
  // Hash-based routing means the browser never sends /dashboard to the server,
  // but this covers direct deep-links and reloads just in case.
  app.use('/*', serveStatic({ root, path: 'index.html' }))
}

serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on port ${port}`)
})
