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
3. **One-time setup** → User fills shop name, contact, currency. Saved to Dexie (`shop_settings` table) and added to sync queue.
4. **POS screen** (`/`) → `useProducts()` hook reads active products from Dexie. `useSaleCart()` hook manages the current receipt state in component memory (not persisted until checkout).
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

**Demo recording:** Record in Chrome against `localhost:4173` (production build) or the Vercel URL. Use DevTools → Network → Offline to simulate no internet. Optional: show the installed PWA window for a few seconds at the end.

**Submission requirements:** Short demo video + public GitHub repository. Vercel URL is the optional live link.

---

## Look and Feel

Implements `prd.md > Look and Feel`, `scope.md > Inspiration & Identity`.

**Palette (Tailwind custom tokens):**
- `paper`: `#F5F0E8` — warm cream background, used everywhere
- `ink`: `#1C3557` — ink blue, primary text, headings, active states, key borders
- `margin`: `#C0392B` — red margin line accent, never used for large fills
- `ink-light`: `#E8EEF4` — pale blue tint for hover states and subtle separations
- `paper-dark`: `#E8E0CC` — slightly darker cream for table rows, sidebar background

**Typography (locally bundled — no CDN):**
- Headings + receipt content: **serif font TBD** — Playfair Display is a candidate but will be revisited during the design step to avoid a generic "AI editorial" look. Other options: Cormorant Garamond, IM Fell English, Libre Baskerville.
- Receipt line items: **JetBrains Mono** or **Courier Prime** (monospace, thermal-printer feel)
- UI body text: **Lora** (serif, readable at small sizes) — also subject to review
- All font files served from `/public/fonts/` and declared in a `@font-face` CSS block

**Density:** Comfortable for desktop. Not cramped. Ledger rows have breathing room.

**Stamp elements:** `PAID`, `LOW`, `OUT`, `PENDING`, `SYNCED` — CSS-only, rotated slightly, border-radius 0, rough feel via `letter-spacing` and `border: 2px solid`. Red for alert stamps, ink-blue for status stamps.

**Receipt paper:** A narrow white/cream column with a subtle left red rule. Monospace font for line items. Faint horizontal lines (like receipt paper) as a CSS `repeating-linear-gradient` background.

**Sidebar:** Narrow, ink-blue background, white/cream text. Red rule on its left edge. Active item: stamp-style underline or ink mark.

**Explicitly avoided:** `purple`, `violet`, rounded cards with shadows, Inter, Roboto, any gradient background.

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
│   ├── fonts/                  # Bundled font files (serif TBD, Lora, JetBrains Mono)
│   ├── icons/                  # PWA icons (192px, 512px)
│   └── manifest.webmanifest    # PWA manifest (generated by vite-plugin-pwa)
├── supabase/
│   └── schema.sql              # All tables, foreign keys, RLS policies — paste into Supabase SQL editor
├── src/
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Router setup, AuthGuard, AppShell wrapper
│   ├── index.css               # Global CSS: @font-face, Tailwind base, CSS variables
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx       # /login — ledger-cover auth screen
│   │   ├── SetupPage.tsx       # /setup — one-time shop setup
│   │   ├── POSPage.tsx         # / — POS screen (home)
│   │   ├── StockPage.tsx       # /stock — products + history tabs
│   │   └── DashboardPage.tsx   # /dashboard — summary, chart, low-stock
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   └── SyncIndicator.tsx
│   │   ├── pos/
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ReceiptStrip.tsx
│   │   │   ├── ReceiptLine.tsx
│   │   │   ├── PostCheckoutPrompt.tsx
│   │   │   └── PrintReceipt.tsx    # Hidden div, @media print only
│   │   ├── stock/
│   │   │   ├── ProductsTab.tsx
│   │   │   ├── HistoryTab.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── RestockForm.tsx
│   │   │   └── AdjustmentForm.tsx
│   │   └── dashboard/
│   │       ├── SummaryRow.tsx
│   │       ├── SalesChart.tsx      # Plain SVG, no library
│   │       └── LowStockList.tsx
│   │
│   ├── hooks/
│   │   ├── useProducts.ts          # Reads active products from Dexie
│   │   ├── useSaleCart.ts          # In-memory cart state for current receipt
│   │   ├── useSyncEngine.ts        # Sync queue processor, exposes pendingCount + status
│   │   └── useShopSettings.ts      # Reads/writes shop_settings from Dexie
│   │
│   ├── lib/
│   │   ├── db.ts                   # Dexie database definition (schema, migrations)
│   │   ├── supabase.ts             # Supabase client initialisation
│   │   ├── sync.ts                 # Core sync logic (push functions, upsert calls)
│   │   ├── sampleData.ts           # ~15 sample products, seeded after first successful login (requires user_id)
│   │   └── formatCurrency.ts       # Integer → display string using shop_settings
│   │
│   └── types/
│       └── index.ts                # Shared TypeScript types (Product, Sale, SaleItem, etc.)
│
├── devpost/                        # Devpost learning workspace
├── .env.local                      # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (not committed)
├── .env.example                    # Safe to commit — shows required keys without values
├── vite.config.ts                  # Vite config + vite-plugin-pwa setup
├── tailwind.config.ts              # Custom tokens: paper, ink, margin colours
├── tsconfig.json
├── vercel.json                     # Rewrites all routes to index.html (for React Router)
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

- **Dexie chosen over raw IndexedDB** — Dexie provides a clean TypeScript API, transaction support, and versioned migrations. Raw IndexedDB is callback-based and significantly harder to work with. No meaningful tradeoff for this use case.
- **vite-plugin-pwa chosen for service worker** — Generates the service worker and manifest automatically from `vite.config.ts`. Manual Workbox config is possible but adds 2–3 hours of setup for no PoC benefit.
- **React Router v6** — Standard for Vite + React SPAs. No tradeoff; it's the obvious pairing.
- **Tailwind v3 (not v4)** — v4 is in active development; v3 is stable, well-documented, and has full Vite support. Avoids build surprises under deadline.
- **Supabase anon key in frontend** — Safe when RLS is enabled. The anon key allows unauthenticated access only to tables with no RLS policies. With RLS on every table, a stolen anon key cannot read or write any user data.

**Genuine uncertainty discussed — offline auth and token expiry:**
The question of what happens when the cached Supabase token expires while offline was raised and resolved: `AuthGuard` uses a local Dexie flag (presence of a `shop_settings` row with `user_id`) instead of `getSession()`, so the app opens from local data regardless of token state. The Supabase client handles automatic refresh when online; if refresh fails, the sync engine exposes `'auth-error'` status. The evidence to verify during the build: confirm that the Supabase JS client v2 attempts token refresh automatically on reconnect without requiring a manual call, and that a failed refresh does not throw an unhandled exception.

**Open issue carried from `prd.md > Open Questions`:**
- **Supabase free tier limits** — ⚠️ Unverified. Check actual storage/MAU limits and whether free projects pause after inactivity at project creation. Current Supabase free tier policy: https://supabase.com/pricing
