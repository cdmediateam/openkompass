import { defineConfig } from 'vite'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

function loadBackendPort() {
  try {
    const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../backend/.env')
    const env = readFileSync(envPath, 'utf8')
    const match = env.match(/^PORT=(\d+)/m)
    return match ? match[1] : '3000'
  } catch {
    return '3000'
  }
}

export default defineConfig({
  server: {
    proxy: {
      '/api': `http://localhost:${loadBackendPort()}`,
    },
  },
})
