# Stockart — Design reference ("Registre" direction)

This file is the SINGLE source of truth for the visual identity. Follow it exactly. Do not invent other colors, fonts or styles. Two screenshots (POS screen and login screen) accompany it: match them.

## Language
The whole UI is in ENGLISH (the screenshots show the exact wording). Keep every UI string in a single file `src/lib/strings.ts` so a French translation can be added later without touching components.

## Fonts (bundle locally, no CDN)
Install the font packages `@fontsource/ibm-plex-sans` (weights 400, 600) and `@fontsource/ibm-plex-mono` (weights 400, 600) and import them in `main.tsx`. This is the only allowed extra dependency and replaces the previous font choice (no Playfair / Lora / Georgia).
- UI + headings: IBM Plex Sans. Numbers, receipt, stamps, dates, labels: IBM Plex Mono.
- Tailwind: fontFamily.sans = IBM Plex Sans, fontFamily.mono = IBM Plex Mono.

## Colors (Tailwind tokens)
paper #F3EEE2 (app background) · ink #1B2A41 (text, sidebar, borders, buttons) · margin #B3362B (red rule + alert stamps only) · receipt #FFFDF7 (receipt paper) · rule #D8D0BC (thin borders on receipt).
Light mode only. No gradients, no shadows, no rounded corners (radius 0 everywhere), no purple, no emoji icons.

## Signature rules
- Active navigation item: text full opacity with a 2px cream underline (NOT a filled background). Inactive items: 70% opacity.
- Sidebar: ink background, cream text, 4px red margin rule on its right edge, width 190px. Bottom: sync stamp (mono 11px, 2px border, rotated -3deg). Colors: green border + text = SYNCED · amber = PENDING (N) · soft red = OFFLINE · soft red = SIGN IN TO SYNC.
- Stamps (LOW, OUT, PAID): mono 600, 2px solid margin-red border, margin-red text, slight rotation (-6deg), radius 0. Out-of-stock card is at 50% opacity.
- Product grid: ledger table look. 4 columns x 4 rows = 16 per page, compact cells. 1px ink border on the outer top/left and on each cell's right/bottom (no gaps, no cards). Cell: name Sans 600, price Mono 14px, stock Sans 11px at 60% opacity.
- Receipt strip: width 330px, receipt background, 1px rule border, 3px margin-red LEFT border, Mono 13px. Shop name Sans 600 17px. Lines separated by 1px dashed lines. − / + buttons: 22px square, 1px ink border, transparent. Total row: top border 2px ink, Mono 18px 600. Checkout button: ink background, cream text, Sans 600 14px, letter-spacing .1em, no radius. PAID stamp: mono 600 20px, 3px margin-red border, rotated -10deg, 85% opacity.
- Page header on each main screen: title Sans 600 26px on the left, date + time Mono 12px at 60% opacity on the right.
- Search bar: 1px ink border, no radius, transparent, placeholder "Search products   /".

## POS functional additions (small)
- Product grid is PAGINATED: 16 products per page (4 columns x 4 rows). Footer row: "1–16 of 30 products" range format (mono 12px) on the left, pagination on the right: ‹ 1 2 › as 30px square buttons, 1px ink border; current page = ink background + cream text. Search filters across all pages and resets to page 1.
- Receipt shows an "Items" row (total quantity) above TOTAL, at 70% opacity.
- No categories, no extra data fields.

## Login, sign-up and shop setup screens ("ledger cover")
Page background paper, content centered. A cover block 520x560, ink background, 14px margin-red strip on its left edge. Inside, centered: title "STOCKART" (Sans 600 40px, letter-spacing .18em), subtitle "SHOP LEDGER" (mono 11px, letter-spacing .2em, 70% opacity). Below, a paper-colored "label plate" (padding 32px, with an inner 1px ink outline inset 8px) containing the form: uppercase mono 11px labels, inputs with only a 1px ink bottom border and transparent background, a full-width ink button "OPEN THE LEDGER" (sign-up: "CREATE THE LEDGER"), and a small underlined link to switch between login and sign-up. The one-time shop setup (shop name, contact, currency, decimals) uses the exact same cover and label plate, button "SAVE".

## Settings panel (gear icon)
Same ledger style: paper background, 1px ink borders, mono labels, ink buttons.

## Animations (CSS only, later slice)
New receipt line "prints" in from below and the paper moves up one notch (200ms steps); strike-through then fade on quantity 0; PAID stamp "stamps" with a quick scale-down from 1.4 to 1; tear-off slide up on checkout.

## App icon
Receipt motif: cream paper shape with red left rule and ink text lines, rotated -5°, on ink background. Used as favicon.svg, apple-touch-icon.png, and PWA icons (192px, 512px). Inline SVG version appears on the login, setup, and loading screens.

## Navigation (as shipped)
Home screen is Dashboard (`/`). POS is at `/pos`. Orders at `/orders`. Stock at `/stock`. The loading screen (`/loading`) is also the AuthGuard loading state.
