import withPWAInit from 'next-pwa';

// Generates the service worker + precache manifest at build time so the app
// is installable (Add to Home Screen / TWA-wrapped APK). Disabled in dev, and
// also disabled for the Electron desktop build (ELECTRON_BUILD=true) --
// Electron already gives the app its own window/process/local server, so a
// service worker intercepting fetches to localhost is redundant complexity
// with nothing to add.
const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development' || process.env.ELECTRON_BUILD === 'true',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      // Our own API data (tasks, agreements, GST rows, leases) -- try the
      // network first so data is fresh, but fall back to the last successful
      // response when offline so the tracker pages still show something.
      urlPattern: /^https?.*\/api\/(status-tracker|el-tracker|gst-reconciliation|lease-agreement)(\/.*)?$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firm-app-data',
        networkTimeoutSeconds: 8,
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 },
        cacheableResponse: { statuses: [0, 200] }
      }
    },
    {
      // App shell / pages -- network first, cached fallback so navigating
      // while offline still opens the last-seen version of each page.
      urlPattern: /^https?.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firm-app-shell',
        networkTimeoutSeconds: 8,
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 7 },
        cacheableResponse: { statuses: [0, 200] }
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundles Next.js + only the node_modules it actually needs into
  // .next/standalone/server.js -- electron/main.js spawns that file
  // directly instead of relying on `next start`, so the desktop build
  // doesn't need a full node_modules tree shipped inside the app.
  output: 'standalone',
  experimental: {
    serverActions: { bodySizeLimit: '10mb' }
  },
  // The literally-copied TO-DO-LIST frontend (public/legacy/todo-list) calls
  // its API at root paths like /api/tasks, exactly as it did in the original
  // repo. Those handlers live under /api/legacy-todo/* here (kept separate
  // from this app's own /api/* routes) -- these rewrites point the
  // unmodified frontend's calls at them without touching its source.
  async rewrites() {
    return [
      { source: '/api/login', destination: '/api/legacy-todo/login' },
      { source: '/api/employees', destination: '/api/legacy-todo/employees' },
      { source: '/api/managers', destination: '/api/legacy-todo/managers' },
      { source: '/api/personal-tasks', destination: '/api/legacy-todo/personal-tasks' },
      { source: '/api/seed', destination: '/api/legacy-todo/seed' },
      { source: '/api/sync-calendar', destination: '/api/legacy-todo/sync-calendar' },
      { source: '/api/tasks', destination: '/api/legacy-todo/tasks' }
    ];
  }
};

export default withPWA(nextConfig);
