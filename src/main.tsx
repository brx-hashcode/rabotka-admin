import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { attachTopLoader } from './lib/top-loader'
import { attachAssetReload } from './lib/asset-reload'
import { registerSessionTeardown } from './lib/auth/session'
import { setCsrfToken } from './lib/api/csrf-token'
import { getQueryClient } from './app/providers'
import { AppError } from './components/app-error'

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultErrorComponent: AppError,
})

attachTopLoader(router)
attachAssetReload()

// What to discard when a session ends. Registered rather than imported so
// lib/auth/session.ts stays free of app imports — it would otherwise pull in the
// whole component tree via providers, and cycle with csrf-token.ts.
//
// clear(), not removeQueries(["admin","me"]): on a dead session every cached row
// is stale privileged data, and on a shared workstation the next admin would
// render the previous admin's cache.
registerSessionTeardown(() => {
  setCsrfToken(null)
  getQueryClient().clear()
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')!

const root = ReactDOM.createRoot(rootElement)
root.render(<RouterProvider router={router} />)
document.getElementById('app-loading')?.remove()
