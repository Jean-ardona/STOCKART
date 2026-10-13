---
doc: prd
status: approved
---

# Stockart — Product Requirements

A desktop web app for small shop management, built around a thermal-receipt POS with a paper-ledger visual identity. For a solo shop owner who currently tracks sales and stock in a notebook or spreadsheet.
Source: `scope.md > Who It's For`, `scope.md > The Unique Kernel`.

---

## The Core Journey

1. **First launch (online):** User lands on a login/sign-up screen styled like the cover of a shopkeeper's ledger. Email + password only. No other content on this screen.
2. **One-time setup:** After first login, a brief setup form collects shop name and contact details. These appear at the top of every receipt. No further onboarding.
3. **POS screen (home):** User lands directly on the POS — product grid on the left, empty receipt strip on the right, ready for the first sale.
4. **Sample products:** On first launch, ~15 sample products are preloaded so the POS is never empty. Useful for demo.
5. **Making a sale:** User taps products → lines print onto the receipt one by one → adjusts quantities with − / + → optionally enters a customer name → clicks Checkout.
6. **Checkout:** Receipt gets a "PAID" stamp, tears off with an animation, and a "Download PDF" prompt appears briefly. POS resets to a new empty receipt with the next sale number.
7. **Offline:** If there is no internet, sales still complete. A sync indicator shows "Pending". When the connection returns, data syncs to Supabase and the indicator shows "Synced".
8. **Later launches:** Session is remembered. App opens straight to the POS, even offline.
9. **Stock management:** User navigates to the Stock screen to view products, add/edit/archive, restock, or adjust stock levels. History tab shows past restock movements.
10. **Dashboard:** User checks today's revenue and sales count, scans the hand-drawn bar chart, and acts on the low-stock list via direct Restock buttons.

---

## Screens and Layout

Three screens, accessed from a discreet left sidebar:

| # | Screen | Sidebar label |
|---|--------|--------------|
| 1 | POS | POS |
| 2 | Stock (with History tab) | Stock |
| 3 | Dashboard | Dashboard |

Plus two overlay surfaces: Login/Sign-up (full screen, no sidebar), and one-time Shop Setup (modal or full screen, shown once after first login).

The sidebar is always visible on the three main screens. It is discreet — not a dominant panel. Active screen is indicated by an ink-style underline or stamp mark. A gear icon at the bottom of the sidebar opens a settings form (shop name, contact details, currency). The Log Out button lives in this same settings panel.

---

## Look and Feel

Source: `scope.md > Inspiration & Identity`, learner's stated constraints.

- **Background:** Warm off-white / cream — like aged ledger paper, not white.
- **Primary accent:** Ink blue — for headings, active states, borders, key actions.
- **Secondary accent:** Red margin line — a vertical rule on the left of the receipt and sidebar, echoing a ruled ledger page.
- **Typography:** A serif font with character (not Inter, not Roboto). Candidates: Playfair Display, Lora, or similar. Used for headings and receipt content. A monospace font for receipt line items to reinforce the thermal-printer feel.
- **Details:** Rubber-stamp style marks (PAID, LOW, OUT, SYNCED) rendered in CSS. Slightly rough edges on key UI elements to feel hand-made rather than pixel-perfect.
- **Charts:** Hand-drawn aesthetic — plain SVG/CSS bars styled to look like pen strokes, no chart library.
- **Animations:** CSS-only. No animation libraries. No printer sounds.
- **Explicitly avoided:** Purple gradients, generic card grids, default sans-serif fonts, anything that looks like a generic AI-generated dashboard.

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
- Displays all active (non-archived) products as "shelf label" cards: name, price, current stock (small text).
- Low stock (at or below threshold): a small red "LOW" stamp on the card.
- Out of stock (0): an "OUT" stamp; the card is not tappable.
- Search bar at the top; activates with the `/` keyboard shortcut.
- Products are sorted alphabetically by default.

**Receipt strip (right panel)**
- Receipt header: shop name + sale number formatted as `#0001` (zero-padded, 4 digits, generated locally and auto-incremented per device; one device per account assumed for the PoC).
- Empty state: a blank strip of receipt paper with a faint "ready" indicator.
- Tapping a product prints a new line at the bottom; the paper scrolls up one notch (CSS animation simulating thermal printing).
- Tapping a product already on the receipt increments its quantity instead of adding a new line.
- Each line shows: `quantity × product name`, unit price, line total, and − / + buttons.
- **Each sale line stores a snapshot of the product name and unit price at the time of sale.** Editing or archiving a product never alters past sales or revenue figures.
- Quantity cannot exceed current stock. The + button is disabled at the stock limit.
- Reducing quantity to 0: the line is struck through, then disappears (CSS transition).
- Footer: live grand total, optional customer name text field, and "Checkout" button.
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

**Summary row (top)**
- Today's total revenue (sum of completed sales for the current calendar day).
- Today's number of completed sales.

**Sales chart**
- Day/Week toggle.
- Day view: last 7 days, one bar per day. Horizontal axis: dates. Vertical axis: revenue.
- Week view: last 4 weeks, one bar per week. Horizontal axis: week labels. Vertical axis: revenue.
- Number of sales shown on hover over a bar.
- Rendered in plain SVG/CSS with a hand-drawn, pen-stroke aesthetic. No chart library.

**Low-stock list**
- All products currently at or below their low-stock threshold.
- Each row: product name, current stock, threshold.
- "Restock" button per row — opens the restock form directly (same form as on the Stock screen).

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

- **POS as home screen** — The shop owner's primary task is selling, not reporting. Opening on the POS removes one navigation step per session.
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

## What We're Building

In priority order (cut from the bottom if time runs short):

1. POS screen — product grid, receipt strip with print animation, checkout with PAID stamp and tear-off, PDF receipt download (browser print stylesheet), sync indicator. Full paper-ledger visual identity. Locally bundled fonts.
2. Stock screen — products tab (add, edit, archive, restock, adjustment), history tab.
3. Supabase auth (login/sign-up, one-time setup + settings panel) + offline-first sync (Dexie/IndexedDB, one-way push to Supabase on reconnect, auto-retry) + PWA installable.
4. Dashboard — summary row, hand-drawn SVG sales chart, low-stock list with restock shortcut.
5. CSV export *(stretch goal only — cut if time is short)*.

---

## Deferred From the POC

- **Customers & debts module** — Separate data model and UI, no impact on the core demo. Bonus if time allows post-submission.
- **Re-activating archived products** — Useful but not needed for the demo.
- **PDF history / receipt archive** — PDFs are downloaded at checkout only; no stored receipt browser.
- **CSV export** — Secondary to PDF receipt; cut if time is short.

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
