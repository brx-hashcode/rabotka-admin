# Rabotka Admin

The **admin portal** for **Rabotka** — the WhatsApp-based job platform connecting informal workers and employers in African cities, starting with Brazzaville, Congo. This is the internal operations dashboard, not the public landing page.

## About Rabotka Admin

Rabotka Admin is the **admin portal**: the internal dashboard used by platform operators and partners to monitor activity, manage workers and employers, and run the platform. It shares Rabotka’s mission — **Find work. Find help. Directly on WhatsApp** — and is built for the same values: simple, trusted, and focused on local impact. The public-facing site and user experience live in the separate **rabotka-client** (landing) project.

### Key Features

- **Dashboard & Analytics** — Overview of platform usage, trends, and key metrics
- **Worker & Employer Management** — View and manage verified profiles and connections
- **Content & Configuration** — Centralized content and config for consistency across the product
- **Modern UI** — Responsive dashboard with sidebar navigation and theme support
- **Data Tables & Charts** — Tables and interactive charts for exploring data
- **Aligned with Rabotka** — Same design language and philosophy as the landing/client app

### Vision

The admin portal supports the same vision as Rabotka: informal workers and employers in African cities, connected simply and reliably. This internal dashboard keeps operations transparent, efficient, and aligned with that mission.

## Tech Stack

| Category | Technology |
|----------|------------|
| Build Tool | Vite 7 |
| Framework | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + tw-animate-css |
| UI Components | shadcn/ui (Radix UI primitives) |
| Routing | TanStack Router (file-based) |
| Charts | Recharts |
| Tables | TanStack Table |
| Drag & Drop | @dnd-kit (sortable) |
| Icons | Lucide React, Tabler Icons |
| Testing | Vitest + Testing Library |

## Project Structure

```
src/
├── main.tsx          # App entry
├── router.tsx        # TanStack Router setup
├── routeTree.gen.ts  # Generated route tree (do not edit)
├── styles.css        # Global styles
├── app/              # App-level providers and data
│   ├── providers/    # React providers (theme, etc.)
│   └── dashboard/    # Dashboard data (e.g. data.json)
├── assets/           # Static assets (images, etc.)
├── config/           # App configuration
├── content/          # Content and copy
│   └── dashboard/    # Dashboard content
├── components/       # Shared UI components
│   ├── ui/           # shadcn/ui components (sidebar, button, card, chart, etc.)
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
├── features/         # Feature-based modules
│   └── dashboard/
│       ├── components/   # AppSidebar, SiteHeader, charts, data-table, nav-*
│       └── layouts/     # Dashboard layout (sidebar + main)
├── hooks/            # Custom React hooks (e.g. use-mobile)
├── lib/              # Utilities (e.g. utils.ts)
├── pages/            # Page components (e.g. dashboard.tsx)
└── routes/           # TanStack Router file-based routes
    ├── __root.tsx    # Root layout
    └── index.tsx     # Index route
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository (from project root)
git clone https://github.com/bruxx-6243/rabotka-admin.git
cd rabotka-admin

# Install dependencies
pnpm install

# Start development server (port 3000)
pnpm dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run tests |

## Development Notes

### Feature Organization

Dashboard logic lives under `src/features/dashboard/`:

- **`layouts/`** — `dashboard-layout.tsx` (SidebarProvider, AppSidebar, SiteHeader, main content)
- **`components/`** — AppSidebar, SiteHeader, nav-main, nav-user, nav-documents, nav-secondary, chart-area-interactive, data-table, section-cards

App-level providers and dashboard data live under `src/app/` (e.g. `providers/index.tsx`, `dashboard/data.json`).

### Component Organization

- **`src/components/ui/`** — shadcn/ui base components (sidebar, button, card, chart, table, etc.)
- **`src/components/`** — theme-provider, theme-toggle
- **`src/features/dashboard/components/`** — Dashboard-specific UI (AppSidebar, SiteHeader, charts, nav, data-table)

### Design System

- **Theme** — Light/dark via `next-themes`; shared with Rabotka’s visual identity
- **Layout** — Sidebar + main content; responsive and accessible
- **Charts** — Recharts with interactive area charts for dashboard metrics

## License

Private project.
