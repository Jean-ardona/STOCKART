---
doc: prd
status: approved
---

# Stockart — Product Requirements

A desktop web app for small shop management, built around a thermal-receipt POS with a paper-ledger visual identity. For a solo shop owner who currently tracks sales and stock in a notebook or spreadsheet.
Source: `scope.md > Who It's For`, `scope.md > The Unique Kernel`.

---

## The Core Journey

1. **First launch (online):** User lands on a login/sign-up screen styled like the cover of a shopkeeper's ledger. Email + password only.
2. **One-time setup:** After first login, a brief setup form collects shop name, contact details, currency code and decimal places. These appear at the top of every receipt. ~30 sample products are seeded (keyed to `user_id` so accounts never mix data).
3. **Dashboard (home):** User lands on the Dashboard — today's revenue vs yesterday, sales count, 7-day total, stock value, hand-drawn sales chart, top products, recent sales, low-stock list.
4. **Making a sale:** User navigates to POS (`/pos`) → taps products → lines print onto the receipt one by one → adjusts quantities with − / + → optionally enters a customer name → clicks Checkout.
5. **Checkout:** Receipt gets a "PAID" stamp, tears off with an animation, and a "Download PDF" prompt appears briefly. POS resets to a new empty receipt with the next sale number.
6. **Offline:** If there is no internet, sales still complete. Sync stamp shows amber "PENDING". When the connection returns, data syncs and the stamp turns green "SYNCED".
7. **Later launches:** Session is remembered. App opens straight to Dashboard, even offline.
8. **Orders:** User navigates to Orders to browse all sales grouped by day, preview any receipt, and print it again. Export CSV of all operations for any period.
9. **Stock management:** Add/edit/archive products, restock, adjust stock levels, view movement history.
10. **Dashboard:** KPI boxes, chart, top products, recent sales, low-stock list.

---

## Screens and Layout

Three screens, accessed from a discreet left sidebar:

| # | Screen | Route | Sidebar label |
|---|--------|-------|--------------|
| 1 | Dashboard | `/` | Dashboard |
| 2 | POS | `/pos` | POS |
| 3 | Orders | `/orders` | Orders |
| 4 | Stock (with History tab) | `/stock` | Stock |

Plus two overlay surfaces: Login/Sign-up (`/login`), and one-time Shop Setup (`/setup`), and a Loading screen (`/loading`, also shown while AuthGuard checks Dexie).

The sidebar is always visible on the four main screens. Active screen: ink-style underline. A gear icon at the bottom opens a settings panel (shop name, contact, currency, Log Out).

---

## Look and Feel

Source: `design/DESIGN.md` ("Registre" direction), `scope.md > Inspiration & Identity`.

- **Colors:** `paper` #F3EEE2 (app background) · `ink` #1B2A41 (text, sidebar, borders, buttons) · `margin` #B3362B (red rule + alert stamps only) · `receipt` #FFFDF7 (receipt paper) · `rule` #D8D0BC (thin borders on receipt). Light mode only. No gradients, no shadows.
- **Typography (bundled via @fontsource — no CDN):** UI + headings: **IBM Plex Sans** (400, 600). Numbers, receipt, stamps, dates, labels: **IBM Plex Mono** (400, 600).
- **Radius:** 0 everywhere — no rounded corners.
- **Sidebar:** ink background, cream text, 190px wide, 4px margin-red rule on its RIGHT edge. Active nav item: full opacity + 2px cream underline. Inactive: 70% opacity. Bottom: sync stamp (mono 11px, 2px cream border, rotated −3°).
- **Stamps:** BAS, ÉPUISÉ, PAYÉ — Mono 600, 2px solid margin-red border, margin-red text, slight rotation, radius 0.
- **Product grid:** ledger table, 4 columns × 4 rows = 16 products per page with pagination. Compact cells. 1px ink border, no gaps. Cell: name Sans 600, price Mono 14px, stock Sans 11px 60% opacity. Pagination label shows range e.g. "1–16 of 30 products".
- **Receipt strip:** 330px wide, receipt background, 1px rule border, 3px margin-red LEFT border, Mono 13px. "Articles" row (total qty) above TOTAL. Checkout button: ink bg, cream text, Sans 600 14px, letter-spacing .1em.
- **Login / setup screens:** ink cover block (520×560) with 14px margin-red left strip. Paper-colored label plate with inset 1px ink outline. Mono 11px uppercase labels, inputs with bottom-border only.
- **Charts:** plain SVG/CSS, hand-drawn pen-stroke aesthetic, no chart library.
- **Sync stamp colors:** green = SYNCED, amber = PENDING (N), soft red = OFFLINE or SIGN IN TO SYNC.
- **App icon and PWA icons:** real logo (receipt motif) used as favicon, apple-touch-icon, and PWA icons (192px, 512px).
- **Language:** English only. All UI strings centralized in `src/lib/strings.ts` for future translation.

---

## Features and Behavior

### Login and Setup

- Email/password login and sign-up via Supabase Auth.
- First login requires internet. Subsequent sessions work offline.
- After first login: a one-time setup form for shop name, contact details (address, phone, or email — at least one contact field), currency code (e.g. USD, EUR, XOF), and number of decimal places (0 or 2). These are stored and used as the receipt header and for all amount formatting.
- All monetary amounts are stored as integers in the smallest currency unit (e.g. cents). Display formatting uses the configured decimal count.
- Setup can be edited later via the gear icon at the bottom of the sidebar (shop name, contact details, currency). Log Out is also in this panel.

### POS Screen

**Product grid (left panel)**
- Displays all active (non-archived) products in a ledger-table grid: 4 columns × 4 rows = 16 products per page.
- Pagination footer: "1–16 of N products" range format (Mono 12px) on the left; ‹ 1 2 › page buttons (30px square, 1px ink border; active page = ink bg + cream text) on the right.
- Each cell: name (Sans 600), price (Mono 17px), stock (Sans 12px 60% opacity). 1px ink border, no gaps, no card shadows.
- Low stock (at or below threshold): a small red "BAS" stamp on the cell.
- Out of stock (0): an "ÉPUISÉ" stamp; cell is at 50% opacity and not tappable.
- Search bar at the top (1px ink border, no radius, transparent bg, placeholder "Rechercher un produit /"); activates with the `/` keyboard shortcut. Search filters across all pages and resets to page 1.

**Receipt strip (right panel)**
- Receipt header: shop name + sale number formatted as `#0001` (zero-padded, 4 digits, generated locally and auto-incremented per device; one device per account assumed for the PoC).
- Page header on POS (above the grid): screen title "Caisse" (Sans 600 26px) on the left, current date + time (Mono 12px 60% opacity) on the right.
- Empty state: a blank strip of receipt paper with a faint "ready" indicator.
- Tapping a product prints a new line at the bottom; the paper scrolls up one notch (CSS animation simulating thermal printing).
- Tapping a product already on the receipt increments its quantity instead of adding a new line.
- Each line shows: `quantity × product name`, unit price, line total, and − / + buttons.
- **Each sale line stores a snapshot of the product name and unit price at the time of sale.** Editing or archiving a product never alters past sales or revenue figures.
- Quantity cannot exceed current stock. The + button is disabled at the stock limit.
- Reducing quantity to 0: the line is struck through, then disappears (CSS transition).
- Footer: "Articles" row (total quantity across all lines, Mono, 70% opacity) above the live grand total, optional customer name text field (placeholder "Client (facultatif)"), and "ENCAISSER" checkout button.
- If customer name is filled in, the receipt acts as an informal invoice (no tax, no legal format).

**Checkout flow**
- "Checkout" button stamps "PAID" on the receipt (CSS stamp animation).
- Receipt tears off and slides upward out of view (CSS animation).
- A brief "Download PDF" prompt appears (a few seconds, or user dismisses it).
- PDF receipt includes: shop name + contact details, sale number, date/time, line items, total, customer name if entered.
- POS resets: empty receipt strip, next sequential sale number, product stock counts updated.
- Cash payment only. No payment method selection.
- Works entirely offline. Sale is written to local DB immediately on checkout.

**Sync indicator**
- Persistent, discreet indicator (e.g., top of sidebar or receipt header area).
- States: `Synced` (all local data is in Supabase), `Pending` (unsynchronised local sales exist), `Offline` (no connection detected).
- On reconnect: pending sales sync automatically; indicator transitions to `Synced`.

### Stock Screen

**Products tab (default)**
- Ledger-style table (rows and columns, not cards): product name, price, current stock, low-stock threshold.
- Actions per row: Edit, Archive, Restock.
- "Add product" button opens a form: name, price, low-stock threshold, and an optional initial quantity. If initial quantity is filled, a stock movement of type "initial" is created on save.
- Edit form: name, price, threshold. Stock level is not editable directly.
- Archive: soft delete. Archived products disappear from the POS grid and stock list but are retained in sales history. No hard delete.
- Restock button: opens the restock form inline or in a modal — quantity received and optional purchase price. Saves a stock movement of type "restock"; increases stock.
- Stock Adjustment: a separate action (button or link) to create a positive or negative stock correction. Records a movement of type "adjustment" with a required reason field.
- Search bar at the top. "Low stock" filter toggle shows only products at or below threshold.

**History tab**
- A simple list of past stock movements (restocks and adjustments): date, product name, movement type, quantity, purchase price (if entered).
- No editing or deleting movements. Read-only.

### Dashboard Screen

**KPI row (top)**
- 4 boxes: today's revenue (with % delta vs yesterday), today's sales count, last 7 days revenue, stock value.

**Sales chart**
- Day/Week toggle. Day view: last 7 days. Week view: last 4 weeks.
- Rendered in plain SVG/CSS, hand-drawn pen-stroke aesthetic. No chart library.
- Hover shows sale count per bar.

**Top products**
- Top 5 products by revenue for the current week.

**Recent sales**
- Last 6 completed sales with date, sale number, total.

**Low-stock list**
- Products at or below threshold. "Restock" button per row.

### Orders Screen

- All sales grouped by day, most recent first.
- Each sale row: sale number, time, customer name (if any), total, item count.
- Selecting a sale shows a receipt preview (using price/name snapshots — immutable).
- "Print again" button triggers PDF receipt via iframe (same as post-checkout).
- Search bar: filter by sale number or customer name.
- **Export CSV:** select a date range, download a CSV of all operations (sales + stock movements) for that period.

---

## States and Boundaries

- **First launch (no data):** ~15 sample products preloaded. Receipt strip is empty, sale number starts at 1.
- **Offline (no internet):** POS fully functional. Sales complete and are written locally. Sync indicator shows `Offline` or `Pending`. Stock screen and Dashboard read from local DB — fully functional. Login screen is not reachable; user must already be authenticated.
- **First login must be online:** Supabase Auth requires a network connection for the initial sign-in. Subsequent sessions use a cached session token and work offline. If the cached token has expired, the app still opens offline using the local DB — sync simply waits until the next successful online login.
- **Out-of-stock product:** Cannot be added to receipt. "OUT" stamp shown on grid card.
- **Stock limit on receipt:** The + button is disabled when quantity equals current stock.
- **Empty receipt at checkout:** Checkout button is disabled with no items on the receipt.
- **Session persistence:** Auth session and all data persist in local DB across browser/app restarts, with or without internet.
- **Archived products:** Hidden from POS and stock list. Appear in sales history (read-only). Cannot be re-activated in the PoC (deferred).
- **PDF receipt:** Triggered immediately after checkout or on demand from the brief post-checkout prompt. Preferred approach is browser print ("Save as PDF") using a dedicated print stylesheet — avoids a PDF library dependency. Final decision deferred to spec. No separate PDF history screen in the PoC.
- **Fonts must be bundled locally** (no Google Fonts CDN) so the visual identity is fully available offline.
- **Sync conflict:** For the PoC, sync is one-way: device pushes to Supabase (sales, sale items, products, stock movements). No pulling from the server. Automatic retry on failure. Last-write-wins is acceptable; no conflict UI needed.

---

## Product Decisions

- **Dashboard as home screen** — Changed from POS. The shop owner benefits from a daily overview before starting to sell.
- **POS at `/pos`** — Moved from `/` to make room for Dashboard as home.
- **Orders page** — Added during build. Gives the owner access to full sale history and receipt reprinting without cluttering the POS.
- **~30 sample products seeded (not 15)** — More realistic for demoing pagination and dashboard charts.
- **Accounts isolation** — Sample data and all records are keyed to `user_id`; multiple accounts on the same browser never see each other's data.
- **Colored sync stamp** — Green (SYNCED), amber (PENDING), soft red (OFFLINE / SIGN IN TO SYNC). More immediately readable than text alone.
- **CSV export delivered** — Not deferred; shipped as part of the Orders screen.
- **PDF receipt via iframe** — Uses `printReceipt.ts` (iframe approach) instead of `window.print()` + `@media print`, so the receipt prints cleanly regardless of the app's CSS.
- **Sample products on first launch** — Ensures the demo is never blocked by an empty state; also useful for real first-time users.
- **Soft delete only** — Archiving preserves historical sales data integrity. Hard delete is explicitly cut.
- **Stock movements, not direct edits** — Restocks and adjustments create a movement record, making stock history auditable. Direct stock edits are not allowed.
- **Price snapshot on sale lines** — Each sale line stores the product name and unit price at time of sale. Edits or archival of products never alter past revenue figures.
- **Integer amount storage** — All monetary amounts stored as integers in the smallest currency unit (e.g. cents). Currency code and decimal count configured in shop setup; display formatting derived from those settings.
- **Sale number format `#0001`** — Zero-padded 4-digit integer, generated locally, auto-incremented. One device per account assumed for the PoC.
- **Settings via sidebar gear icon** — Shop name, contact details, currency, and Log Out accessible from a panel triggered by a gear icon at the bottom of the sidebar. No separate settings route.
- **Cash only, no payment method** — Keeps the checkout flow simple; payment handling is out of scope.
- **No tax calculation** — Keeps receipts/invoices informal and avoids legal complexity.
- **Hand-drawn SVG chart, no library** — Consistent with the ledger identity; removes a dependency.
- **CSS-only animations** — No animation library; keeps bundle small and animations controllable.
- **Locally bundled fonts** — No Google Fonts CDN; visual identity works fully offline.
- **Browser print for PDF** — `window.print()` with a print stylesheet is the preferred approach; avoids a PDF library. Confirmed at spec time.
- **One-way sync, device → Supabase** — Simplest correct model for a single-user PoC. No pull, no conflict resolution UI needed.
- **Offline with expired token** — App opens from local DB regardless of token expiry; sync waits for the next successful online login.

---

## What We're Building (as shipped)

1. Dashboard — 4 KPI boxes, SVG chart, top products, recent sales, low-stock list. Home screen (`/`).
2. POS screen (`/pos`) — product grid (16/page, paginated), receipt strip with print animation, checkout, PDF receipt.
3. Orders screen (`/orders`) — sale history, receipt preview, print again, CSV export.
4. Stock screen (`/stock`) — products tab (add, edit, archive, restock, adjustment), history tab.
5. Auth + offline-first sync + PWA — Supabase Auth, Dexie/IndexedDB, one-way push, colored sync stamp, accounts isolation.

---

## Deferred From the POC

- **Customers & debts module** — Post-submission roadmap.
- **Re-activating archived products** — Not needed for the demo.
- **Two-way sync / multi-device** — One-way push is sufficient for single-device PoC.

---

## Possible Later Enhancements

- Customers & debts (who owes how much, with payment tracking).
- Multiple payment methods (card, mobile money, credit).
- Tax configuration per product or per sale.
- Stock re-activation for archived products.
- Receipt archive / sales history browser.
- Mobile / tablet layout.

---

## Non-Goals

- **No AI features** — Explicitly not wanted inside the app.
- **No paid services** — Supabase free tier only.
- **No multi-user / roles** — Single-user app for the PoC.
- **No mobile layout** — Desktop-first; responsive polish is post-submission.
- **No legal invoice format** — The receipt-as-invoice is informal only; no tax, no compliance.
- **No payment processing** — Cash only, recorded locally.
- **No Excel export** — Replaced by PDF receipt + optional CSV.

---

## Open Questions

- **Supabase free tier limits:** Worth confirming row limits and auth quotas are sufficient for a demo-scale app before starting the build. — *Low risk, check at spec time.*
