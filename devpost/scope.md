---
doc: scope
status: approved
---

# Stockart

A shop management web app for desktop that looks and works like a shopkeeper's paper ledger — not a generic SaaS dashboard.

## The Unique Kernel
The point of sale screen behaves like a real thermal receipt printer: every time an item is added, a new line "prints" onto the receipt. The whole app uses a paper-ledger visual identity (warm paper background, ink-blue and red-margin accents, serif typography, stamp-style details) that makes it immediately recognizable as something a human designed.

## Who It's For
A small independent shop owner managing their store alone — someone who runs a physical counter, knows their products by name, and currently tracks stock and sales in a notebook or a generic spreadsheet.

## The Core Loop
They open the POS screen, tap items to add them to the receipt (lines print one by one), adjust quantities with − / + buttons, see the live total, and check out. If the internet is off, the sale still goes through. When it comes back, everything syncs.

## Inspiration & Identity
A shopkeeper's paper ledger: warm off-white/cream background, ink-blue as the primary accent, a red margin line, serif typography (something with character — not Inter or Roboto), stamp and rubber-ink details. The feel is analog, tactile, and honest. Deliberately unlike any AI-generated UI. No purple gradients, no generic card grids, no default sans-serif fonts.

## Why This Matters to the Learner
"Get it shipped" — a finished, submitted project before October 26, 2026. And: understand offline-first sync well enough to explain it — why local DB, why a sync queue, what happens when the connection returns.

## What "Working" Looks Like
The demo shows:
1. A sale made entirely offline (network disabled) — items added to the receipt one by one, checkout completes, stock updates locally.
2. The connection is restored — the sale syncs to Supabase visibly.
3. A quick tour of the stock list, a restock purchase, the dashboard charts, and a PDF/Excel export.

The "oh, that's cool" beat: the thermal receipt animation in the POS, and the sync moment when the offline sale appears in the cloud.

## The POC Boundary

Priority order — if time runs short, cut from the bottom:

1. **POS + stock management** *(must ship)*
   Cart-as-thermal-receipt with line-by-line print animation, − / + per item, live total, checkout. Add/edit/delete products, current stock levels. Full paper-ledger visual identity throughout.

2. **Restocking / purchasing** *(high priority)*
   Record a restock purchase; increases stock levels.

3. **Supabase auth + offline-first sync** *(required for the demo)*
   Real user accounts (login/logout). Works with no internet via Dexie/IndexedDB; syncs to Supabase when connection returns. PWA installable.

4. **Dashboard** *(minimal)*
   One sales chart (day/week toggle). One low-stock list. Nothing else.

5. **Export** *(nice to have)*
   The POS receipt is exportable as a PDF — this is the must-have export. The receipt includes: automatic sequential sale number, shop name and contact details at the top, optional customer name field. If a customer name is entered, the receipt serves as an informal invoice. No tax calculation, no legal format. CSV export of sales data as a secondary option.

## Later
- Customers & debts (who owes how much) — deferred, bonus if time allows after submission

## Explicitly Cut
- **Customers & debts:** Deferred — adds a full data model and UI surface with no impact on the core demo. Bonus if time allows post-submission.
- **Excel export:** Replaced by PDF receipt export (already built as part of POS) + CSV sales data. Excel is not needed.
- **Best-selling products chart:** Cut from dashboard — one sales chart + low-stock list is enough.
- **Multi-user / roles / permissions:** Out of scope for a solo PoC.
- **Mobile layout:** Desktop-first by design; responsive polish is post-submission.
- **AI features inside the app:** Explicitly not wanted.
- **Paid services:** Supabase free tier only.
