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
They open the app and land on the **Dashboard** for a quick overview of the day. They navigate to **POS** to make sales — tapping items to print them on the receipt one by one, adjusting quantities, and checking out. If the internet is off, the sale still goes through. When it comes back, everything syncs.

## Inspiration & Identity
A shopkeeper's paper ledger: warm off-white/cream background, ink-blue as the primary accent, a red margin line, serif typography (something with character — not Inter or Roboto), stamp and rubber-ink details. The feel is analog, tactile, and honest. Deliberately unlike any AI-generated UI. No purple gradients, no generic card grids, no default sans-serif fonts.

## Why This Matters to the Learner
"Get it shipped" — a finished, submitted project before October 26, 2026. And: understand offline-first sync well enough to explain it — why local DB, why a sync queue, what happens when the connection returns.

## What "Working" Looks Like
The demo shows:
1. A sale made entirely offline (network disabled) — items added to the receipt one by one, checkout completes, stock updates locally.
2. The connection is restored — the sale syncs to Supabase visibly (sync stamp turns green).
3. A quick tour: Orders page (receipt preview + print again), Stock screen, Dashboard (4 KPI boxes, chart, top products), and CSV export.

The "oh, that's cool" beat: the thermal receipt animation in the POS, and the sync moment when the offline sale appears in the cloud.

## The POC Boundary

Priority order — if time runs short, cut from the bottom:

1. **POS + stock management** *(shipped)*
   Cart-as-thermal-receipt with line-by-line print animation, − / + per item, live total, checkout. Add/edit/archive products, current stock levels. Full paper-ledger visual identity throughout.

2. **Restocking / purchasing** *(shipped)*
   Record a restock purchase; increases stock levels.

3. **Supabase auth + offline-first sync** *(shipped)*
   Real user accounts (login/logout). Works with no internet via Dexie/IndexedDB; syncs to Supabase when connection returns. PWA installable. Accounts isolation: each device scope is keyed to `user_id` so multiple accounts on one browser never mix data.

4. **Dashboard** *(shipped — richer than planned)*
   4 KPI boxes (today's revenue vs yesterday, sales count, 7-day total, stock value), hand-drawn SVG sales chart (day/week toggle), top 5 products, recent sales list, low-stock list with Restock shortcut.

5. **Orders page** *(shipped — added during build)*
   Full order history grouped by day. Receipt preview beside each sale. "Print again" at any time using price/name snapshots. Search by sale number or customer name.

6. **Export** *(shipped)*
   PDF receipt via iframe print (no library). CSV export of all operations (sales + stock movements) for any selected period.

## Later
- Customers & debts (who owes how much) — deferred post-submission

## Explicitly Cut
- **Customers & debts:** Deferred — no impact on the core demo.
- **Excel export:** Replaced by PDF receipt + CSV export (both shipped).
- **Multi-user / roles / permissions:** Out of scope for a solo PoC.
- **Mobile layout:** Desktop-first by design.
- **AI features inside the app:** Explicitly not wanted.
- **Paid services:** Supabase and Vercel free tiers only.
