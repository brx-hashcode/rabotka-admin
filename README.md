# Rabotka Admin

The **admin portal** for **Rabotka** — the WhatsApp-based job platform connecting informal workers and employers in African cities, starting with Brazzaville, Congo.

## About

Rabotka Admin is the internal operations dashboard used by platform operators and partners to monitor activity, manage workers and employers, handle claims, review documents, and run the platform. The public-facing experience lives in the separate **rabotka-client** project.

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React 19 |
| Build Tool | Vite 7 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + tw-animate-css |
| UI Components | shadcn/ui (Radix UI, New York style) |
| Routing | TanStack Router (file-based) |
| Data Fetching | TanStack Query v5 |
| Tables | TanStack Table v8 |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Drag & Drop | @dnd-kit (core, sortable, modifiers) |
| Real-time | Socket.io client |
| State | Zustand |
| Icons | Lucide React, Tabler Icons |
| Testing | Vitest + Testing Library |
| PDF/Docs | react-pdf, @cyntler/react-doc-viewer |
| Export | xlsx (Excel spreadsheet export) |

## Project Structure

```
src/
├── main.tsx                  # App entry — RouterProvider + top-loader
├── router.tsx                # TanStack Router instantiation
├── routeTree.gen.ts          # Auto-generated route tree (do not edit)
├── env.ts                    # Environment validation (@t3-oss/env-core + Zod)
├── styles.css                # Global styles
│
├── app/
│   ├── providers/            # QueryClient, ThemeProvider, Toaster
│   └── dashboard/data.json  # Dashboard seed data
│
├── assets/                   # Static assets
│
├── components/
│   ├── ui/                   # 49 shadcn/ui primitives (button, card, dialog, sidebar…)
│   ├── table/                # Generic data-table, toolbar, pagination, profile-cell
│   ├── kibo-ui/credit-card/  # Custom credit card component
│   ├── page-list-header.tsx
│   ├── profile-combobox.tsx
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
│
├── config/index.ts           # App-wide config (apiUrl, pagination defaults)
│
├── features/                 # 16 feature modules
│   ├── ads-bundles/
│   ├── advertisements/
│   ├── applications/
│   ├── applications-admin/
│   ├── auth/
│   ├── calendar/             # Full calendar (month/week/day/year/agenda views, DnD, dialogs)
│   ├── claims/               # Kanban board + comments
│   ├── dashboard/
│   ├── documents/
│   ├── job-categories/
│   ├── jobs/
│   ├── logs/
│   ├── notifications/
│   ├── payment-requests/
│   ├── penalties/
│   ├── team/
│   └── wallet/
│
├── hooks/                    # 28 custom hooks (list, detail, mutation, socket, pagination)
│
├── layouts/                  # App shell
│   ├── layout.tsx
│   ├── app-sidebar.tsx
│   ├── site-header.tsx
│   ├── nav-main.tsx
│   ├── nav-secondary.tsx
│   ├── nav-documents.tsx
│   └── nav-user.tsx
│
├── lib/
│   ├── api/                  # 18 typed API controllers (one per domain)
│   ├── export/               # Excel export utilities
│   ├── validations/          # Zod schemas
│   ├── status-labels.ts
│   ├── qr-utils.ts
│   ├── top-loader.ts
│   └── utils.ts
│
├── pages/                    # 15+ page components with detail pages
│
├── routes/                   # File-based TanStack Router routes
│   ├── __root.tsx
│   ├── _authenticated.tsx    # Auth guard layout
│   └── _authenticated/       # 28 authenticated routes
│
└── stores/
    └── use-socket-store.ts   # Socket.io connection state (Zustand)
```

## Routes

| Path | Description |
|---|---|
| `/auth/login` | OTP login |
| `/auth/phone-pair` | Phone pairing |
| `/auth/qr-confirm` | QR confirmation |
| `/` | Dashboard |
| `/profiles` | Profiles list |
| `/profiles/:profileId` | Profile detail |
| `/applications` | Applications list |
| `/applications/:applicationId` | Application detail |
| `/jobs` | Jobs list |
| `/jobs/:jobId` | Job detail |
| `/penalties` | Penalties list |
| `/penalties/:penaltyId` | Penalty detail |
| `/payment-requests` | Payment requests |
| `/wallet` | Wallet & transactions |
| `/claims` | Claims kanban board |
| `/documents` | Document management |
| `/advertisements` | Advertisements |
| `/ads-bundles` | Ad bundles |
| `/job-categories` | Job categories |
| `/events` | Calendar |
| `/team` | Team management |
| `/notifications` | Notifications |
| `/logs` | Activity logs |
| `/profile` | Admin profile |
| `/settings` | Settings |
| `/help` | Help |

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm

### Installation

```bash
pnpm install
```

### Environment

Create a `.env` file:

```env
VITE_HOST=localhost
VITE_PORT=3300
VITE_BACKEND_URL=http://localhost:3001
```

### Commands

| Command | Description |
|---|---|
| `pnpm dev` | Dev server (port from `VITE_PORT`, default 3300) |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run tests (Vitest) |

## Architecture Notes

- **Routing** — TanStack Router with file-based routes under `src/routes/`. `routeTree.gen.ts` is auto-generated — never edit it directly.
- **API layer** — `src/lib/api/` contains 18 typed controllers, one per domain. All requests go through the Vite proxy to `VITE_BACKEND_URL`. CSRF token is fetched and attached automatically.
- **Data fetching** — TanStack Query for all server state. Hooks live in `src/hooks/`, co-located with their query keys and fetchers.
- **Real-time** — Socket.io client connected via the Vite WebSocket proxy. Global connection state managed in `src/stores/use-socket-store.ts`.
- **Features** — Each module under `src/features/` is self-contained: components, hooks, and utils stay inside the feature folder.
- **Layouts** — `_authenticated.tsx` is the auth guard. `src/layouts/` holds the full app shell (sidebar, header, nav).
- **Environment** — Validated at startup via `src/env.ts` using `@t3-oss/env-core` + Zod. Missing required vars throw at build time.
- **Export** — Excel exports use `xlsx`. Wallet export rows are typed in `src/lib/export/wallet-export-rows.ts`.
- **shadcn/ui** — New York style, neutral base color, CSS variables. Aliases: `#/components/ui` and `@/components/ui` both work.

## Docker

```bash
# Development
docker compose up -d

# Production (uses pre-built image from GHCR)
docker compose -f docker-compose.prod.yml up -d
```

The production image is built by CI on every merge to `develop` and promoted (no rebuild) on merge to `main`.

## License

Private project.
