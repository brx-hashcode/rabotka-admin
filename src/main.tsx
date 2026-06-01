import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { attachTopLoader } from './lib/top-loader'

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

attachTopLoader(router)

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')!

const root = ReactDOM.createRoot(rootElement)
root.render(<RouterProvider router={router} />)
document.getElementById('app-loading')?.remove()
