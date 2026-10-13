---
doc: checklist
status: approved
---

# Build Checklist — Stockart

Build mode: fast (stop after every slice, verify, wait for confirmation)

## Slices

- [x] **1. Project scaffold — app shell loads in the browser**
  Becomes usable: A running Vite + React + TS app with a placeholder "Stockart" heading, all dependencies installed, routing skeleton, Dexie DB definition, Supabase client init, Tailwind configured.
  Why now: Bootstrapping is part of slice 1. Everything else depends on this foundation.
  PRD ref: `prd.md > The Core Journey` (step 1)
  Spec ref: `spec.md > Stack`, `spec.md > File Structure`, `spec.md > Where It Runs and How Someone Tries It`
  Build: Scaffold with `npm create vite`, install Dexie, @supabase/supabase-js, react-router-dom, vite-plugin-pwa, tailwindcss. Configure vite.config.ts (vite-plugin-pwa with generateSW), tailwind.config.ts (custom tokens: paper, ink, margin, ink-light, paper-dark), index.css (@font-face placeholder, Tailwind base). Create src/lib/db.ts (Dexie schema: all tables), src/lib/supabase.ts (client init from env vars), src/App.tsx (React Router routes skeleton), .env.example. App renders a plain "Stockart" heading at /.
  Verify (mechanical): `npm run dev` starts with no errors; browser opens localhost:5173 and shows "Stockart" heading; no TypeScript errors on `npm run build`.
  Learner check: Open localhost:5173, confirm the heading renders with no console errors.
  Commit: `chore: scaffold project, install deps, configure Vite + Tailwind + Dexie + Supabase`

- [x] **2. Offline check — production build with service worker verified offline**
  Becomes usable: The app shell loads with DevTools → Network → Offline active.
  Why now: Service workers only activate in production builds. A misconfigured PWA caught here costs 10 minutes; caught after 8 screens it costs hours.
  PRD ref: `prd.md > States and Boundaries` (offline behavior)
  Spec ref: `spec.md > Stack` (vite-plugin-pwa), `spec.md > Where It Runs and How Someone Tries It`
  Build: Verify vite-plugin-pwa config generates a service worker on build (generateSW strategy, registerType: 'autoUpdate'). Add manifest fields (name, icons). Run `npm run build` + `npm run preview`. Confirm sw.js is present in dist/.
  Verify (mechanical): `npm run build` succeeds; `npm run preview` serves at localhost:4173; DevTools Application → Service Workers shows the SW registered and active; DevTools Network → Offline → reload → app shell still loads.
  Learner check: Go offline in DevTools, reload localhost:4173, confirm the "Stockart" heading still appears.
  Commit: `feat: configure PWA service worker, verify offline shell loads`

- [x] **3. Auth — login, sign-up, setup, AuthGuard, SettingsPanel**
  Becomes usable: User can sign up, log in, complete one-time shop setup, reach the POS placeholder, and log out. AuthGuard uses local Dexie flag. SettingsPanel (gear icon) lets user edit shop settings and log out.
  Why now: user_id is required on every Dexie record. Sample products seeded here (after first login). Nothing else saves correctly without auth.
  PRD ref: `prd.md > Login and Setup`, `prd.md > Screens and Layout` (sidebar gear icon)
  Spec ref: `spec.md > Components > Auth`, `spec.md > Components > Layout and Navigation`, `spec.md > External Services > Supabase`
  Build: LoginPage (email + password, sign-in + sign-up, neutral styling). SetupPage (shop name, contact, currency_code, decimal_places — saves to Dexie shop_settings, adds to sync_queue). AuthGuard (checks for shop_settings row with user_id in Dexie; if none + online → /login; if none + offline → offline-locked message). AppShell + Sidebar (3 nav items + gear icon at bottom). SettingsPanel (edit shop name/contact/currency, Log Out button → supabase.auth.signOut() + clear local flag + redirect /login). Seed ~15 sample products into Dexie with user_id after first successful login (setup_complete flag). SyncIndicator placeholder (static "Synced" label for now).
  Verify (mechanical): Sign up with a new email → setup form appears → fill it → POS placeholder loads; log out → redirected to /login; log back in → POS loads directly (setup skipped); reload while offline (after prior login) → POS loads without hitting /login.
  Learner check: Sign up, complete setup, log out, log back in, then disable network in DevTools and reload — confirm you land on the POS each time without errors.
  Commit: `feat: auth (login/signup/setup), AuthGuard, SettingsPanel, sample product seed`

- [x] **3b. Design foundation — "Registre" visual identity on auth screens, sidebar, shell**
  Becomes usable: Login, setup, sidebar, AppShell, SettingsPanel, SyncIndicator all match the "Registre" design from DESIGN.md and the login screenshot.
  Why now: fonts and tokens established before POS build so slice 4 starts styled.
  PRD ref: `prd.md > Look and Feel`
  Spec ref: `spec.md > Look and Feel`, `design/DESIGN.md`
  Build: Install @fontsource/ibm-plex-sans + @fontsource/ibm-plex-mono; import in main.tsx. Update index.css with Tailwind v4 @theme tokens (paper, ink, margin, receipt, rule) and global radius-0 rule. Restyle LoginPage + SetupPage as ledger cover (ink block, red strip, paper label plate, inset outline, mono labels, bottom-border inputs, uppercase buttons). Restyle Sidebar (ink bg, 4px margin-red right border, cream underline active state, sync stamp). Restyle SyncIndicator (mono stamp, rotated). Restyle SettingsPanel + AppShell. Update prd.md + spec.md + checklist.md to reflect confirmed font choice (IBM Plex Sans/Mono), pagination (6/page), "Articles" row, French UI labels.
  Verify (mechanical): `npm run build` succeeds with no TS errors; no requests to fonts.googleapis.com or any CDN in Network tab; login screen matches the provided screenshot visually.
  Learner check: Open the app, go to /login — confirm it looks like the ledger-cover screenshot (ink background, red strip, paper form card). Open the POS placeholder and confirm the sidebar matches (ink bg, red right rule, underline active state, sync stamp at bottom).
  Commit: `feat: design foundation — Registre identity, IBM Plex fonts, auth screens, sidebar`

- [x] **4. POS core — product grid, receipt strip, checkout (neutral styling)**
  Becomes usable: Full POS logic works — tap products, lines appear on receipt, adjust quantities, checkout saves sale to Dexie, stock updates, PDF prompt appears.
  Why now: This is the unique kernel. It must work correctly before any visual polish is applied.
  PRD ref: `prd.md > POS Screen`, `prd.md > Features and Behavior > POS Screen`
  Spec ref: `spec.md > Components > POS Screen`, `spec.md > Data Model`
  Build: ProductGrid + ProductCard (name, price, stock, LOW stamp if stock≤threshold, OUT stamp + disabled if stock=0, search bar with / shortcut, alphabetical sort). ReceiptStrip + ReceiptLine (qty × name, unit price, line total, −/+ buttons, + disabled at stock limit, strike-through + disappear on qty→0). Receipt header (shop name + #0001 sale number). Footer (live total, customer name input, Checkout button disabled if no items). completeSale() — atomic Dexie transaction: writes sales row + N sale_items rows (price snapshots) + decrements products.stock for each item + adds sale, sale_items, and affected products to sync_queue + increments shop_settings.last_sale_number. lastCompletedSale state held in POSPage after checkout. PostCheckoutPrompt (Download PDF button → window.print(), auto-dismisses after 4s). PrintReceipt (hidden div, @media print only, renders from lastCompletedSale).
  Verify (mechanical): Add 3 products to cart, adjust one quantity, reduce another to 0 (confirm line disappears), checkout → Dexie sales table has 1 row, sale_items has correct rows with price snapshots, products.stock decremented correctly (check via browser DevTools → Application → IndexedDB). Sale number increments on second checkout. window.print() opens print dialog.
  Learner check: Make two sales. After each checkout, confirm stock numbers on the product cards updated, the sale number incremented, and the PDF prompt appeared.
  Commit: `feat: POS core — product grid, receipt strip, completeSale, PDF prompt`

- [ ] **4b. POS visual identity — receipt paper look, stamps, CSS animations, print stylesheet**
  Becomes usable: The POS screen looks like the paper-ledger design — receipt paper texture, stamps (LOW, OUT, PAID), CSS print animation for new receipt lines, PAID stamp animation, tear-off slide-up. Fonts chosen and bundled.
  Why now: Core logic is proven. Applying identity now to one screen lets us validate the look before extending it everywhere in slice 8.
  PRD ref: `prd.md > Look and Feel`
  Spec ref: `spec.md > Look and Feel`, `spec.md > Components > POS Screen`
  Build: Choose and download serif + monospace fonts (Playfair Display or alternative TBD — decide now); add to /public/fonts/, declare @font-face in index.css. Apply Tailwind custom tokens (paper, ink, margin, ink-light, paper-dark) to POS components. Receipt strip: cream/white column, red left rule, monospace line items, faint repeating-linear-gradient horizontal lines. ProductCard: shelf-label style. Stamps (LOW, OUT): CSS-only, rotated, rough border, red. Checkout animations: new ReceiptLine slides in from bottom (CSS keyframe), PAID stamp appears with CSS scale+opacity, receipt column slides upward out of view (CSS keyframe). PrintReceipt: print stylesheet hides everything except the receipt div, styles it cleanly for paper.
  Verify (mechanical): `npm run build` + `npm run preview` — no build errors; fonts load from /public/fonts/ (Network tab, no CDN requests); all three CSS animations play correctly; window.print() renders a clean receipt (check print preview).
  Learner check: Make a sale, watch the receipt print animation, checkout, confirm the PAID stamp and tear-off animate correctly, then open print preview and confirm the receipt looks clean.
  Commit: `feat: POS visual identity — fonts, stamps, receipt animations, print stylesheet`

- [ ] **5. Stock screen — products tab, history tab (neutral styling)**
  Becomes usable: User can add/edit/archive products, restock, make adjustments, and view movement history.
  Why now: Stock data must exist in Dexie before the sync engine has real records to push.
  PRD ref: `prd.md > Stock Screen`
  Spec ref: `spec.md > Components > Stock Screen`, `spec.md > Data Model`
  Build: StockPage with two tabs (Products default, History). ProductsTab: ledger-style table (name, price, stock, threshold), Edit / Archive / Restock per row, Add Product button, search bar, low-stock filter toggle. ProductForm modal (add: name, price, threshold, optional initial qty → creates 'initial' stock_movement; edit: name, price, threshold). RestockForm modal (qty received, optional purchase price → creates 'restock' stock_movement, updates products.stock, adds both to sync_queue). AdjustmentForm modal (signed qty, required reason → creates 'adjustment' stock_movement, updates products.stock). Archive: sets archived=true, adds product to sync_queue. HistoryTab: read-only table of stock_movements (date, product name, type, qty, purchase price).
  Verify (mechanical): Add a product with initial qty → stock_movements has an 'initial' row; restock → stock increases + 'restock' movement created; adjustment → stock changes + 'adjustment' movement created; archive → product disappears from POS grid; history tab shows all movements.
  Learner check: Add a new product with an initial stock of 10, restock it by 5, make a −2 adjustment, confirm stock shows 13, then archive it and confirm it's gone from the POS.
  Commit: `feat: stock screen — products tab, forms, history tab`

- [ ] **6a. Sync engine — push queue to Supabase, SyncIndicator**
  Becomes usable: Pending local records push to Supabase automatically. SyncIndicator shows live status.
  Why now: All local data writes exist across POS and Stock. The push layer now has real records to validate against Supabase RLS and schema.
  PRD ref: `prd.md > Features and Behavior > Sync indicator`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components > Sync Engine`, `spec.md > External Services > Supabase`, `spec.md > Data Model > Supabase`
  Build: Apply supabase/schema.sql in Supabase dashboard (all tables, RLS policies, indexes). useSyncEngine hook: reads sync_queue from Dexie, reads full records fresh from Dexie at push time, pushes in order (shop_settings → products → sales + sale_items → stock_movements) via supabase.from().upsert({onConflict:'id'}), removes item from queue on success, leaves on failure, retries on window online event + app launch + 30s setInterval while pending. Exposes { pendingCount, status: 'synced'|'pending'|'offline'|'auth-error' }. Wire SyncIndicator in sidebar to show Synced / Pending (N) / Offline / Sign in to sync. Supabase client automatic token refresh handles auth; auth-error status shown if refresh fails.
  Verify (mechanical): Make a sale while online → sync_queue empties → Supabase table has the rows (check Supabase dashboard Table Editor). Make a sale with DevTools Offline → sync_queue has pending rows → go back online → rows appear in Supabase within 30s. Retry idempotency: manually add same record UUID to sync_queue twice → only one row in Supabase after sync.
  Learner check: Make a sale offline (DevTools → Offline), confirm SyncIndicator shows "Pending (1)". Re-enable network, confirm indicator transitions to "Synced" and the sale row appears in the Supabase Table Editor.
  Commit: `feat: sync engine — push queue, upsert, retry, SyncIndicator`

- [ ] **6b. Vercel deploy**
  Becomes usable: App is live at a public URL with Supabase env vars configured.
  Why now: Validates the production build works end-to-end on a real host. Required for submission.
  PRD ref: `prd.md > What We're Building`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`, `spec.md > External Services > Vercel`
  Build: Confirm vercel.json is present (rewrites all routes to index.html). Push repo to GitHub (public). Connect GitHub repo to Vercel (vercel.com → New Project → import repo). Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel project Settings → Environment Variables. Trigger redeploy. Confirm PWA installable at the Vercel URL.
  Verify (mechanical): Vercel deploy succeeds with no build errors; open the Vercel URL in Chrome, sign in, make a sale, confirm it syncs to Supabase; DevTools Application → Service Workers shows SW registered at the Vercel URL.
  Learner check: Open the live Vercel URL, sign in, make a sale, go DevTools Offline, make another sale, go back online — confirm both sales appear in Supabase.
  Commit: `chore: add Vercel deploy config, push to GitHub`

- [ ] **7. Dashboard — summary row, SVG chart, low-stock list**
  Becomes usable: Dashboard shows today's revenue + sale count, hand-drawn bar chart (day/week), and low-stock list with Restock shortcut.
  Why now: Pure Dexie reads — no new data model work needed. Safe to build after sync is verified.
  PRD ref: `prd.md > Dashboard Screen`
  Spec ref: `spec.md > Components > Dashboard Screen`
  Build: DashboardPage with three sections. SummaryRow: query Dexie sales for today's completed_at, sum total_int, count rows. SalesChart: SVG component, Day/Week toggle in local state, last 7 days (one bar/day) or last 4 weeks (one bar/week), bars as <rect> elements, slight rotation + ink-blue fill for hand-drawn feel, hover tooltip with sale count via positioned div. LowStockList: products where stock≤threshold, Restock button per row opens RestockForm.
  Verify (mechanical): Make 3 sales on different days using fake system dates (or just today). Dashboard summary shows correct totals. Chart renders bars proportional to revenue. LowStockList shows products below threshold. Restock button opens RestockForm correctly.
  Learner check: Check the dashboard after making a few sales — confirm today's numbers are correct and the chart bars look hand-drawn, not like a generic chart library output.
  Commit: `feat: dashboard — summary row, SVG chart, low-stock list`

- [ ] **8. Visual identity — extend paper-ledger design to all remaining screens**
  Becomes usable: The ledger identity is consistent across Login, Setup, Stock, Dashboard, sidebar, and SettingsPanel.
  Why now: POS identity is proven (slice 4b). Extending it now means the whole app is visually complete.
  PRD ref: `prd.md > Look and Feel`
  Spec ref: `spec.md > Look and Feel`, `spec.md > Components`
  Build: Apply paper/ink/margin Tailwind tokens and typography to: LoginPage (ledger-cover style), SetupPage, AppShell + Sidebar (ink-blue background, red left rule, stamp-style active state), SettingsPanel, StockPage (ledger table rows, stamp details), DashboardPage (consistent headings, summary blocks). SyncIndicator styled as a stamp badge. Stamp elements (PAID, LOW, OUT, PENDING, SYNCED) consistent across all screens. Ensure no CDN font requests remain (all from /public/fonts/).
  Verify (mechanical): `npm run build` + `npm run preview` — no errors; Network tab in DevTools shows zero requests to fonts.googleapis.com or any CDN; visual pass across all 5 screens.
  Learner check: Walk through every screen (Login, Setup, POS, Stock, Dashboard, SettingsPanel) and confirm the ledger identity is consistent — no screen looks like a generic SaaS app.
  Commit: `feat: visual identity — extend paper-ledger design to all screens`

---

## Hands-on Checkpoints

- [ ] After slice 4 — try a full sale end-to-end: add items, adjust quantities, checkout, verify PDF prompt and stock update. Feedback can still reshape remaining build.
- [ ] After slice 6a — offline sync demo: make a sale offline, reconnect, confirm rows appear in Supabase Table Editor. Validates the core demo beat.
- [ ] Final kick-the-tires after slice 8 — full core journey with visual identity, offline mode, sync visible, PDF receipt.

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [what actually happened; real document/test/code references; unfinished work if interrupted]
Route and stops: [actual paths and symbols; guided stops completed, or reference-only route]
Edit outcome: [tried/kept/reverted/declined/not applicable; verification if changed]
Reflection: [offered/answered/declined/already covered — personal answer belongs only in the ignored profile]
Activity mode: [live app and editor, explicit static fallback, focused alternative, prior practice, or recap]

## Revisions

- Tailwind v4 installed instead of v3 — npm resolved the latest version. v4 uses CSS-based config (`@theme` in index.css) instead of `tailwind.config.ts`. All custom tokens moved to `@theme` block in index.css. No product impact.
- vite-plugin-pwa `generateSW` strategy dropped in favour of `injectManifest` — with Vite 8 (Rolldown), the Workbox async `closeBundle` hook timed out and `sw.js` was never written to `dist/`. Switched to `injectManifest` with a hand-written `src/sw.ts`, which Vite compiles as a normal module. `sw.js` now appears in `dist/` reliably.
- Font choice changed from Playfair Display/Lora/JetBrains Mono to **IBM Plex Sans + IBM Plex Mono** — learner chose the "Registre" visual direction in slice 3b. Fonts bundled via `@fontsource` packages instead of `/public/fonts/`. Color tokens updated to match DESIGN.md (paper #F3EEE2, ink #1B2A41, margin #B3362B, receipt #FFFDF7, rule #D8D0BC). Product grid is now paginated (6 per page). Receipt has "Articles" row. UI labels are in French. prd.md and spec.md updated accordingly.
