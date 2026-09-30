import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vitest/config'

// Vercel serves embed.html at /embed (cleanUrls); mirror that for the dev and preview servers.
const embedRoute = (): Plugin => {
  const rewrite = (req: { url?: string }) => {
    if (req.url && /^\/embed(\?|$)/.test(req.url)) req.url = req.url.replace('/embed', '/embed.html')
  }
  return {
    name: 'embed-route',
    configureServer: (s) => void s.middlewares.use((req, _res, next) => (rewrite(req), next())),
    configurePreviewServer: (s) => void s.middlewares.use((req, _res, next) => (rewrite(req), next())),
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), embedRoute()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  build: {
    rolldownOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        embed: path.resolve(import.meta.dirname, 'embed.html'),
      },
      output: {
        // Long-lived vendor chunks: cached across deploys and fetched in parallel with app code.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\/](react|react-dom|scheduler)[\/]/ },
            { name: 'motion', test: /node_modules[\/](motion|framer-motion|motion-dom|motion-utils)[\/]/ },
          ],
        },
      },
    },
  },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
})
