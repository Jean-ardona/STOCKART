---
doc: spec
status: approved
---

# Stockart — Technical Spec

## How This Works, In Plain Language

Stockart is a React app that runs entirely in the browser. It has no backend of its own — no server you write or maintain. All data lives first in **Dexie**, a local database built into the browser (IndexedDB under the hood). Think of it as a small spreadsheet the app reads and writes directly, with no network involved.

**Why local-first?** Because if the app read from Supabase directly, it would break the moment the internet went off. By keeping Dexie as the source of truth, every screen — POS, Stock, Dashboard — always works, online or not.

**The sync queue** is a table inside Dexie called `sync_queue`. Every time a record is created or changed, a row is added to this table: "this product / sale / stock movement needs to be pushed to Supabase." A background process — the sync engine — watches for internet connectivity, walks the queue, and pushes each item to Supabase using an upsert keyed on the record's UUID. If a push fails, the item stays in the queue and is retried. If it succeeds, the item is removed from the queue.

**The upsert-on-UUID pattern** means a retry after a lost network response never creates a duplicate. The first push creates the row; if it runs again, Supabase sees the same UUID and updates the existing row instead of inserting a new one.

**Push order** matters because Supabase enforces foreign keys: a sale item row references a sale, which references a product. So the engine always pushes in this order: shop settings first, then products, then sales + sale items, then stock movements.

**Row Level Security (RLS)** on every Supabase table means each row has a `user_id` column, and Supabase automatically rejects any read or write from a user whose JWT doesn't match that `user_id`. No extra auth logic in the app code — the database enforces it.

**The service worker** (managed by `vite-plugin-pwa`) intercepts network requests and serves the app shell from cache. This is what makes the app installable as a PWA and what makes the first paint work offline. Important: service workers only activate in a production build (`vite build` + `vite preview`). The dev server bypasses them entirely, so offline testing must be done against the production build.

The result: the app feels instant (reads are always local), works offline (writes go to Dexie first), and eventually consistent (Supabase catches up when the internet returns).

---

## The Core Journey Through the System

Implements `prd.md > The Core Journey`.

1. **User opens the app** → Browser loads the app shell from service worker cache (works offline after first visit). React Router renders the current route.
2. **Not authenticated + online** → Redirected to `/login`. Supabase Auth handles email/password. On success, the JWT is stored by Supabase's client library in `localStorage`. First-login flag checked in Dexie → redirect to `/setup`.
3. **One-time setup** → User fills shop name, contact, currency. Saved to Dexie (`shop_settings` table) and added to sync queue. ~30 sample products seeded (keyed to `user_id`).
4. **Dashboard screen** (`/`) → Home screen. Aggregation queries run against Dexie: KPI boxes, chart data, top products, recent sales, low-stock list.
5. **User navigates to POS** (`/pos`) → `useProducts()` hook reads active products from Dexie. `useSaleCart()` hook manages the current receipt state in component memory.
5. **User taps a product** → Cart state updates. React re-renders the receipt strip. CSS animation triggers the "print" effect.
6. **Checkout** → `completeSale()` function runs atomically in Dexie: writes one `sales` row + N `sale_items` rows (with price snapshots) + updates `products.stock` for each sold product. Adds the sale, all sale items, and every affected product to `sync_queue` (the sync engine reads the current product record from Dexie at push time, not a stored copy). Sale number incremented in `shop_settings`. The completed sale data is stored in `lastCompletedSale` state so `PrintReceipt` remains populated after the POS resets.
7. **Sync engine sees new queue items** → Pushes to Supabase in order: shop_settings → products → sales + sale items → stock movements. Each successful push removes the item from `sync_queue`. Sync indicator updates.
8. **User navigates to Stock** → `useProducts()` reads from Dexie. Restock form writes a `stock_movements` row and updates `products.stock` in the same Dexie transaction. Added to sync queue.
9. **Dashboard** → Aggregation queries run against Dexie locally. SVG chart rendered from the results.
10. **App reopens offline** → Service worker serves the shell. Dexie has all data. `AuthGuard` checks for an existing `shop_settings` row with a `user_id` in Dexie (not `getSession()`) — if found, the app opens normally. Supabase client attempts token refresh in the background when online; if refresh fails, sync indicator shows "Sign in to sync" but the app remains fully usable. No login screen shown for normal offline use.

---

## Stack

| Tool | Version | Role | Docs |
|------|---------|------|------|
| React | 18 | UI framework | https://react.dev |
| TypeScript | 5 | Type safety | https://www.typescriptlang.org |
| Vite | 5 | Build tool + dev server | https://vitejs.dev |
| Tailwind CSS | 3 | Utility-first styling | https://tailwindcss.com |
| React Router | 6 | Client-side routing | https://reactrouter.com |
| Dexie.js | 3 | IndexedDB wrapper (local DB) | https://dexie.org |
| Supabase JS client | 2 | Auth + remote DB push | https://supabase.com/docs/reference/javascript |
| vite-plugin-pwa | 0.x | Service worker + PWA manifest | https://vite-pwa-org.netlify.app |
| Workbox | (via vite-plugin-pwa) | Service worker strategies | https://developer.chrome.com/docs/workbox |

**No chart library** — dashboard chart is plain SVG/CSS.
**No animation library** — all transitions are CSS-only.
**No PDF library** — PDF export uses `window.print()` with a print stylesheet.
**No state management library** — React context + custom hooks are sufficient for this scope.

Rationale: every tool above was pre-selected or is the standard pairing for the chosen stack. The only additions are Dexie (the simplest IndexedDB wrapper that supports transactions and TypeScript), vite-plugin-pwa (the standard Vite PWA plugin, handles service worker generation without manual Workbox config), and React Router (standard for Vite+React SPAs).

---

## Where It Runs and How Someone Tries It

**Runtime:** Browser (Chrome recommended). No server to run. Supabase is external.

**Environment variables required (create `.env.local`):**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Local development (no service worker):**
```bash
npm install
npm run dev
# Open http://localhost:5173
```
Note: offline mode does NOT work in dev. Service workers are bypassed by Vite's dev server.

**Production build — required for offline/PWA testing:**
```bash
npm run build
npm run preview
# Open http://localhost:4173
# Now test offline: DevTools → Network → Offline
```

**Deploy to Vercel:**
```bash
npm install -g vercel
vercel
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel project settings → Environment Variables
# Redeploy after adding env vars
```
Or connect the GitHub repo to Vercel and it auto-deploys on every push to `main`.

**Live demo:** https://stockart.vercel.app

**Demo recording:** Record in Chrome against the Vercel URL or `localhost:4173` (production build). Use DevTools → Network → Offline to simulate no internet.

**Submission requirements:** Short demo video + public GitHub repository (https://github.com/Jean-ardona/STOCKART).

---

## Look and Feel

Implements `prd.md > Look and Feel`, `design/DESIGN.md` ("Registre" direction).

**Palette (Tailwind v4 `@theme` tokens in `index.css`):**
- `paper`: `#F3EEE2` — app background
- `ink`: `#1B2A41` — text, sidebar, borders, buttons
- `margin`: `#B3362B` — red rule + alert stamps only
- `receipt`: `#FFFDF7` — receipt paper
- `rule`: `#D8D0BC` — thin dashed borders on receipt

**Typography (via @fontsource — no CDN, no Google Fonts):**
- `font-sans`: IBM Plex Sans 400/600 — UI, headings, nav, buttons
- `font-mono`: IBM Plex Mono 400/600 — numbers, receipt lines, stamps, dates, labels, pagination
- Imported in `src/main.tsx`

**Global rules:** radius 0 everywhere (`border-radius: 0 !important` in index.css). No shadows. No gradients. No rounded corners.

**Sidebar:** ink background, 190px, 4px margin-red RIGHT border. Active nav: full opacity + 2px cream underline. Sync stamp: mono 11px, 2px cream border, rotated −3°.

**Login/setup cover:** ink block 520×560, 14px margin-red left strip. Paper label plate with inset 1px ink outline. Mono 11px uppercase labels, bottom-border-only inputs.

**Product grid:** ledger table, 4 cols, 16 per page with pagination. Compact cells. 1px ink borders, no gaps.

**Receipt strip:** 330px, receipt bg, 1px rule border, 3px margin-red left border, Mono 13px. "Articles" row above TOTAL. Checkout button: ink bg, cream text, Sans 600, letter-spacing .1em.

**Stamps:** BAS/ÉPUISÉ/PAYÉ — Mono 600, 2px solid margin-red, slight rotation.

**Charts:** plain SVG/CSS, no library.

**Font choice note:** IBM Plex Sans + IBM Plex Mono confirmed in slice 3b (replaces previous Playfair/Lora/JetBrains candidates). Fonts bundled via @fontsource.

---

## Components

### Auth (`/login`, `/setup`)

Implements `prd.md > Login and Setup`.

- `LoginPage` — email/password form, Supabase Auth sign-in/sign-up. Styled as a ledger cover: large centered title, minimal form, cream background.
- `SetupPage` — shown once after first login. Collects shop name, contact details, currency code, decimal places. Writes to Dexie `shop_settings`. Redirects to `/`.
- `AuthGuard` — wrapper component that checks for an existing `shop_settings` row with a `user_id` in Dexie. This is the offline-safe auth check — it never calls `getSession()`. If no row found and online: redirect to `/login`. If no row found and offline: show an offline-locked message (edge case; normal offline use never hits this). The Supabase client handles token refresh automatically in the background when online; if refresh fails, the sync engine exposes a fourth status `'auth-error'` and the `SyncIndicator` shows "Sign in to sync".

### Layout and Navigation

- `AppShell` — outer wrapper: sidebar + main content area. Always rendered on authenticated routes.
- `Sidebar` — three nav items (POS, Stock, Dashboard) + gear icon at bottom. Discreet ink-blue panel with red left rule. Active state marked with a stamp-style mark.
- `SettingsPanel` — slide-in or modal triggered by gear icon. Form: shop name, contact, currency. Log Out button (calls `supabase.auth.signOut()`, clears local session flag, redirects to `/login`). Writes updates to Dexie and sync queue.
- `SyncIndicator` — persistent badge showing `Synced`, `Pending (N)`, `Offline`, or `Sign in to sync`. Reads from sync engine state. Located at bottom of sidebar near the gear icon.

### POS Screen (`/`)

Implements `prd.md > POS Screen`.

- `POSPage` — layout: two columns. Left: `ProductGrid`. Right: `ReceiptStrip`.
- `ProductGrid` — reads active products from Dexie via `useProducts()`. Renders `ProductCard` for each. Search bar with `/` shortcut (focuses input on keydown). Alphabetical sort.
- `ProductCard` — shelf-label style. Name, price, stock. LOW stamp if `stock <= threshold`. OUT stamp + `pointer-events: none` if `stock === 0`.
- `ReceiptStrip` — the thermal receipt column. Header: shop name + `#0001` sale number. Line items rendered by `ReceiptLine`. Footer: live total, customer name input, Checkout button (disabled if no items).
- `ReceiptLine` — one line: `qty × name`, unit price, line total, − / + buttons. + disabled at stock limit. CSS print animation on enter. Strike-through + fade-out on quantity → 0.
- `CheckoutButton` → triggers `completeSale()` → stores result in `lastCompletedSale` state → PAID stamp CSS animation → receipt tear-off slide-up → POS resets to empty receipt → `PostCheckoutPrompt` shown.
- `PostCheckoutPrompt` — brief overlay: "Download PDF" button (calls `window.print()`), auto-dismisses after 4 seconds.
- `PrintReceipt` — a hidden `<div>` with `@media print` styles only. Renders from `lastCompletedSale` (set at checkout, cleared when the prompt is dismissed). This ensures "Download PDF" works even after the POS has reset to a new empty receipt. Contains: shop name, contact, sale number, date/time, line items, total, customer name. The rest of the UI is hidden on print.

### Stock Screen (`/stock`)

Implements `prd.md > Stock Screen`.

- `StockPage` — two tabs: Products (default) and History.
- `ProductsTab` — ledger-style `<table>`. Columns: name, price, stock, threshold. Per-row actions: Edit, Archive, Restock. "Add product" button. Search bar. Low-stock filter toggle.
- `ProductForm` — modal/drawer for add and edit. Fields: name, price (displayed; stored as integer), threshold, initial quantity (add only). On save: writes to Dexie, adds to sync queue, creates "initial" stock movement if initial qty > 0.
- `RestockForm` — modal triggered from Stock screen or Dashboard low-stock list. Fields: quantity received, optional purchase price. On save: creates `stock_movements` row of type "restock", updates `products.stock` in same Dexie transaction, adds both to sync queue.
- `AdjustmentForm` — modal for positive/negative stock correction. Fields: quantity (signed), required reason. Creates `stock_movements` row of type "adjustment".
- `HistoryTab` — read-only table of `stock_movements`: date, product name, type, quantity, purchase price.

### Dashboard Screen (`/dashboard`)

Implements `prd.md > Dashboard Screen`.

- `DashboardPage` — three sections stacked: summary row, sales chart, low-stock list.
- `SummaryRow` — two stat blocks: today's revenue and today's sale count. Queried from Dexie `sales` table filtered by today's date.
- `SalesChart` — plain SVG component. Day/Week toggle stored in local state. Queries Dexie for last 7 days or last 4 weeks of sales. Renders bars as `<rect>` elements styled to look hand-drawn (slight rotation, ink-blue fill, no smooth corners). Hover tooltip shows sale count via SVG `<title>` or a small positioned div.
- `LowStockList` — products where `stock <= threshold`. Each row has a "Restock" button that opens `RestockForm`.

### Sync Engine

Implements `prd.md > States and Boundaries` (sync conflict, offline behavior).

- `useSyncEngine()` — a React hook (or a plain module called from a hook) that:
  - Reads pending items from Dexie `sync_queue`
  - Pushes them to Supabase in order: shop_settings → products → sales + sale items → stock movements
  - Each push is an upsert: `supabase.from('table').upsert(row, { onConflict: 'id' })`. The row data is read fresh from Dexie at push time (not from a stored snapshot in the queue).
  - On success: removes item from `sync_queue`
  - On failure: leaves item in queue, logs error silently
  - Retries triggered by: `window` online event, app launch, and a 30-second `setInterval` while queue is non-empty
  - Exposes: `{ pendingCount, status: 'synced' | 'pending' | 'offline' | 'auth-error' }`
- `SyncIndicator` reads from `useSyncEngine()` and displays the count and status.

---

## Data Model

### Dexie (local, in-browser)

All tables include a `synced: boolean` field (or tracked via `sync_queue`).

```
shop_settings       id, user_id, shop_name, contact, currency_code,
                    decimal_places, last_sale_number, setup_complete

products            id (UUID), user_id, name, price_int, threshold,
                    stock, archived, created_at, updated_at

sales               id (UUID), user_id, sale_number, customer_name,
                    total_int, completed_at

sale_items          id (UUID), user_id, sale_id, product_id,
                    product_name_snapshot, unit_price_int_snapshot,
                    quantity, line_total_int

stock_movements     id (UUID), user_id, product_id,
                    type ('initial'|'restock'|'adjustment'),
                    quantity, purchase_price_int, reason, created_at

sync_queue          id, table_name, record_id, operation ('upsert'),
                    created_at, attempts
```

**Amount storage:** all `*_int` fields are integers in the smallest currency unit (e.g. 1000 = $10.00 if 2 decimal places, or 1000 = 1000 XOF if 0 decimal places). Display formatting is derived from `shop_settings.decimal_places` and `currency_code` at render time.

**Price snapshot:** `sale_items.product_name_snapshot` and `unit_price_int_snapshot` are copied from the product at checkout time and never updated again. Past revenue figures are immutable.

**Sale number:** `shop_settings.last_sale_number` is incremented locally on each checkout. Formatted as `#0001` at display/print time.

**Stock integrity:** `products.stock` is a running total maintained exclusively inside Dexie transactions — never edited directly. The four operations that change it are: initial quantity (on product creation), restock, adjustment, and sale checkout. Each operation also creates a `stock_movements` row of the corresponding type (`initial`, `restock`, `adjustment`). There is no `sale` type in `stock_movements`; sale stock deductions are tracked via `sale_items`.

### Supabase (remote, push-only)

Mirror of the Dexie schema. Every table has:
- `id UUID PRIMARY KEY` — same UUID as the local record (enables upsert deduplication)
- `user_id UUID REFERENCES auth.users` — for Row Level Security

**RLS policy on every table (example for `products`):**
```sql
CREATE POLICY "users see own rows" ON products
  FOR ALL USING (auth.uid() = user_id);
```
Same pattern on `sales`, `sale_items`, `stock_movements`, `shop_settings`.

**Push order (foreign key constraints):**
1. `shop_settings` (no dependencies)
2. `products` (no dependencies)
3. `sales` + `sale_items` (reference `products`)
4. `stock_movements` (reference `products`)

---

## File Structure

```
stockart/
├── public/
│   ├── fonts/                  # Empty — fonts bundled via @fontsource
│   ├── icons/                  # Real PWA icons (192px, 512px) + apple-touch-icon
│   ├── favicon.svg             # Receipt-motif logo
│   └── manifest.webmanifest    # PWA manifest (generated by vite-plugin-pwa)
├── supabase/
│   └── schema.sql              # All tables, foreign keys, RLS policies
├── design/
│   └── DESIGN.md               # Visual identity reference ("Registre" direction)
├── src/
│   ├── main.tsx                # React entry point, @fontsource imports
│   ├── App.tsx                 # Router setup, PrintProvider, AuthGuard
│   ├── index.css               # Tailwind v4 @theme tokens, global radius-0
│   ├── sw.ts                   # Service worker (injectManifest strategy)
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx       # /login
│   │   ├── SetupPage.tsx       # /setup
│   │   ├── LoadingPage.tsx     # /loading + AuthGuard loading state
│   │   ├── DashboardPage.tsx   # / (home)
│   │   ├── POSPage.tsx         # /pos
│   │   ├── OrdersPage.tsx      # /orders (history, receipt preview, CSV export)
│   │   └── StockPage.tsx       # /stock
│   │
│   ├── components/
│   │   ├── layout/             # AppShell, Sidebar, AuthGuard, SettingsPanel, SyncIndicator
│   │   ├── pos/                # ProductGrid, ProductCard, ReceiptStrip, ReceiptLine,
│   │   │                       # PostCheckoutPrompt
│   │   ├── stock/              # Modal, ProductFormModal, MovementModal, HistoryTab, tableStyles
│   │   ├── orders/             # ReceiptPreview, ExportBar
│   │   └── dashboard/          # SalesChart
│   │
│   ├── hooks/
│   │   ├── useProducts.ts
│   │   ├── useSaleCart.ts
│   │   ├── useShopSettings.ts
│   │   ├── useCurrentShop.ts
│   │   └── useSyncStatus.ts
│   │
│   ├── lib/
│   │   ├── db.ts               # Dexie schema + migrations
│   │   ├── supabase.ts         # Supabase client init
│   │   ├── syncCore.ts         # Pure sync functions (no React)
│   │   ├── syncEngine.ts       # React integration for sync
│   │   ├── completeSale.ts     # Atomic sale transaction
│   │   ├── stockOps.ts         # Restock / adjustment operations
│   │   ├── dashboardStats.ts   # Aggregation queries
│   │   ├── exportOperations.ts # CSV export logic
│   │   ├── printReceipt.ts     # Iframe-based PDF receipt (no @media print)
│   │   ├── receiptData.ts      # ReceiptData builder
│   │   ├── printContext.tsx    # React context for lastCompletedSale
│   │   ├── sampleData.ts       # ~30 sample products (seeded after first login)
│   │   ├── formatCurrency.ts   # Integer → display string
│   │   ├── money.ts            # Money utilities
│   │   └── strings.ts          # All UI strings (English, ready to translate)
│   │
│   └── types/
│       └── index.ts
│
├── devpost/                    # Planning documents
├── .env.example
├── vite.config.ts
├── vercel.json
└── package.json
```

---

## External Services and Dependencies

### Supabase

- **Auth:** `supabase.auth.signInWithPassword()`, `signUp()`, `signOut()`, `getSession()`.
  - JWT stored in `localStorage` by the Supabase client automatically.
  - Offline: `getSession()` returns the cached session; no network call needed.
  - Docs: https://supabase.com/docs/reference/javascript/auth-signinwithpassword
- **Database push (upsert):** `supabase.from('table').upsert(rows, { onConflict: 'id' })`
  - Called only by the sync engine. App never reads from Supabase.
  - Docs: https://supabase.com/docs/reference/javascript/upsert
- **RLS:** enabled on every table. Policy: `auth.uid() = user_id`. Set up manually in Supabase dashboard before first deploy.
- **Free tier limits:** ⚠️ Numbers below are unverified — check at project creation time.
  - Reported limits (verify): ~500 MB database storage, 50,000 monthly active users, 2 GB bandwidth.
  - **Important to check:** whether free projects pause after a period of inactivity (Supabase has done this in the past for inactive free projects — confirm current policy before the demo).
  - Well within demo scale if active. Confirm region availability on free plan at project creation.
- **Environment variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — safe to expose in a frontend app when RLS is enabled (anon key has no special privileges; RLS enforces access).

### Vercel

- **Deploy:** `vercel` CLI or GitHub integration. Zero-config for Vite apps.
- **Environment variables:** Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel project settings. Redeploy after adding.
- **Free tier:** Sufficient for demo. No credit card required.
- **Docs:** https://vercel.com/docs/frameworks/vite

---

## Important Failure Modes

- **Sync push fails (network error mid-push):** Item stays in `sync_queue`. Sync engine retries on next trigger (online event, 30s interval, app launch). User sees `Pending (N)`. No data loss — Dexie always has the record.
- **Supabase JWT expired while offline:** `AuthGuard` uses a local Dexie flag (not `getSession()`), so the app opens regardless. The Supabase client attempts automatic token refresh when online. If refresh fails, the sync engine switches to `auth-error` status and the indicator shows "Sign in to sync". App remains fully usable; only sync is paused.
- **IndexedDB unavailable (private browsing on some browsers):** Dexie throws on open. App shows a clear message: "Stockart requires local storage. Please disable private browsing mode." PWA install is also unavailable in this case.
- **`window.print()` PDF:** Browser opens the system print dialog. User must manually choose "Save as PDF". This is intentional — no library needed. If a user's browser blocks `window.print()`, the receipt data is still on screen and can be screenshotted.

---

## What Was Simplified and Why

- **Browser print instead of a PDF library** — `window.print()` + a print stylesheet produces a clean receipt PDF with zero dependencies. The tradeoff: the user sees a print dialog instead of a direct download. For a shop owner at a desk, this is acceptable. A library like `pdf-lib` or `jsPDF` would give a direct download but adds ~200 KB and significant complexity.
- **One-way sync (push only)** — pulling from Supabase would require conflict resolution logic (what wins — local or remote?). For a single-device, single-user PoC, nothing is ever written to Supabase except by this device, so pulling adds complexity with no benefit. The tradeoff: if the user logs in on a second device, it won't have the other device's history. Acceptable for the PoC.
- **Local sale number generation** — generating `#0001` locally (from `shop_settings.last_sale_number`) avoids a round-trip to Supabase. The tradeoff: on a second device, numbering would restart from 1. One device per account is a stated PoC assumption.
- **No Dexie-to-Supabase schema migration tool** — schema changes during the build are handled by bumping Dexie's version number (which triggers a migration callback). Supabase schema changes are applied manually in the dashboard. Acceptable for a solo PoC with a stable schema.
- **Plain SVG chart, no library** — removes a dependency and matches the hand-drawn identity. The tradeoff: more manual SVG math for axis scaling. Manageable for 7 bars or 4 bars.

---

## Decisions and Open Issues

- **Dashboard as home (`/`), POS at `/pos`** — Changed after MVP was complete. Dashboard gives a daily overview before selling starts.
- **Orders page added** — Full sale history, receipt reprinting, CSV export. Not in original plan; built during the extended build phase.
- **~30 sample products (was ~15)** — More realistic for demoing pagination and dashboard charts.
- **Accounts isolation** — All seeded and user-created records are keyed to `user_id`; switching accounts on the same browser clears the local scope.
- **Colored sync stamp** — Green/amber/soft-red instead of text-only states.
- **PDF via iframe (`printReceipt.ts`)** — Replaced `window.print()` + `@media print` approach. Iframe is isolated from the app's CSS and always prints cleanly.
- **`syncCore.ts` + `syncEngine.ts`** — Sync logic split into pure functions (no React) and a React integration layer. Easier to test and reason about.
- **Tailwind v4 (not v3)** — npm resolved v4 at install time. Uses CSS-based `@theme` config in `index.css` instead of `tailwind.config.ts`.
- **`injectManifest` PWA strategy** — `generateSW` timed out with Vite 8/Rolldown. Switched to a hand-written `src/sw.ts` compiled by Vite; `sw.js` now appears in `dist/` reliably.
