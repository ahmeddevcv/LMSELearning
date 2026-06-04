# LMS Frontend — Angular 17 + Bootstrap 5

Arabic/English bilingual LMS platform — no Tailwind, pure Bootstrap 5 + custom CSS.

## Prerequisites

- Node.js 18+ → https://nodejs.org
- Angular CLI: `npm install -g @angular/cli`

## Quick Start

```bash
npm install
ng serve
# → http://localhost:4200
```

## Tech Stack

- **Angular 17** — Standalone Components + Signals
- **Bootstrap 5.3** — layout, components, utilities
- **Bootstrap Icons 1.11** — all icons via `bi-*` classes
- **Custom CSS** — `src/styles/main.scss` (CSS variables, sidebar, stat cards, badges, chat bubbles, etc.)
- **@microsoft/signalr** — real-time chat + notifications
- **@ngx-translate** — AR/EN localization
- No Tailwind, no PrimeNG, no Angular Material

## Styling Architecture

```
src/styles/
  variables.scss   → CSS custom properties (colors, spacing, shadows, dark mode)
  main.scss        → Bootstrap overrides + all custom component classes
```

Key CSS classes:
- `.lms-sidebar`, `.lms-header`, `.lms-content` — layout
- `.stat-card`, `.stat-icon`, `.stat-value` — dashboard stats
- `.group-card`, `.group-icon` — group cards
- `.bubble-out`, `.bubble-in` — chat bubbles (RTL-aware)
- `.badge-active`, `.badge-live`, `.badge-scheduled` — status badges
- `.skeleton` — animated loading placeholders
- `.lms-toast` — toast notifications
- `.page-fade` — page enter animation

## Backend Connection

Edit `src/environments/environment.ts`:
```ts
apiUrl:     'https://localhost:5001/api'
signalrUrl: 'https://localhost:5001'
```

## Default Logins

| Role  | URL              | Email           | Password     |
|-------|------------------|-----------------|--------------|
| Admin | /login/admin     | admin@lms.com   | Admin@123456 |

## Build Production

```bash
ng build --configuration production
```
