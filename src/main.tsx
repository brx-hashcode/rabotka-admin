import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { attachTopLoader } from './lib/top-loader'
import { attachAssetReload } from './lib/asset-reload'
import { AppError } from './components/app-error'

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultErrorComponent: AppError,
})

attachTopLoader(router)
attachAssetReload()

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')!

const root = ReactDOM.createRoot(rootElement)
root.render(<RouterProvider router={router} />)
document.getElementById('app-loading')?.remove()
