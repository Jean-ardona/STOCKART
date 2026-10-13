/**
 * All user-facing UI strings in one place.
 * Swap this file for a translated version to add another language.
 */
export const S = {
  // ── App ──────────────────────────────────────────────────────────────────
  appName: 'STOCKART',
  appSubtitle: 'SHOP LEDGER',

  // ── Sidebar nav ──────────────────────────────────────────────────────────
  navPOS: 'POS',
  navStock: 'Stock',
  navDashboard: 'Dashboard',
  navSettings: 'Settings',

  // ── Sync indicator stamps ─────────────────────────────────────────────────
  syncSynced: 'SYNCED',
  syncPending: (n: number) => `PENDING (${n})`,
  syncOffline: 'OFFLINE',
  syncAuthError: 'SIGN IN TO SYNC',

  // ── Login / sign-up ───────────────────────────────────────────────────────
  loginTitle: 'Sign in to your account',
  signupTitle: 'Create a new account',
  labelEmail: 'Email',
  labelPassword: 'Password',
  placeholderEmail: 'you@example.com',
  btnOpenLedger: 'OPEN THE LEDGER',
  btnCreateLedger: 'CREATE THE LEDGER',
  loginLoading: 'Loading…',
  switchToSignup: 'No account?',
  switchToSignupLink: 'Create a ledger',
  switchToLogin: 'Already have an account?',
  switchToLoginLink: 'Sign in',
  errorAuthFailed: 'Authentication failed.',
  errorNetwork: 'Network error. Please check your connection.',

  // ── Setup ─────────────────────────────────────────────────────────────────
  setupSubtitle: 'Initial setup',
  labelShopName: 'Shop name',
  labelContact: 'Contact (address, phone or email)',
  labelCurrencyCode: 'Currency code',
  labelDecimalPlaces: 'Decimal places',
  placeholderShopName: 'e.g. Sample Shop',
  placeholderContact: 'e.g. 12 Market St · +1 555 0100',
  placeholderCurrencyCode: 'USD',
  decimalOption2: '2 — e.g. $15.00',
  decimalOption0: '0 — e.g. 1,500 XOF',
  btnSave: 'SAVE',
  btnSaving: 'Saving…',
  errorShopNameRequired: 'Shop name is required.',
  errorNotAuthenticated: 'Not authenticated. Please log in again.',
  errorSetupFailed: 'Setup failed. Please try again.',
  setupHint: 'This appears at the top of every receipt. You can change it later in Settings.',

  // ── Settings panel ────────────────────────────────────────────────────────
  settingsTitle: 'Settings',
  btnCancel: 'CANCEL',
  btnLogout: 'LOG OUT',
  errorSaveFailed: 'Save failed.',
  errorNameRequired: 'Name is required.',

  // ── POS screen ────────────────────────────────────────────────────────────
  posTitle: 'POS',
  searchPlaceholder: 'Search products   /',
  stampLow: 'LOW',
  stampOut: 'OUT',
  stampPaid: 'PAID',
  receiptItems: 'Items',
  receiptTotal: 'TOTAL',
  placeholderCustomer: 'Customer (optional)',
  btnCheckout: 'CHECKOUT',
  btnDownloadPDF: 'Download PDF',
  paginationOf: (shown: number, total: number) => `${shown} of ${total} products`,

  // ── Stock screen ──────────────────────────────────────────────────────────
  stockTitle: 'Stock',
  tabProducts: 'Products',
  tabHistory: 'History',
  btnAddProduct: '+ Add product',
  colName: 'Name',
  colPrice: 'Price',
  colStock: 'Stock',
  colThreshold: 'Threshold',
  colDate: 'Date',
  colType: 'Type',
  colQty: 'Qty',
  colPurchasePrice: 'Purchase price',
  btnEdit: 'Edit',
  btnArchive: 'Archive',
  btnRestock: 'Restock',
  btnAdjust: 'Adjust',
  filterLowStock: 'Low stock only',
  labelProductName: 'Product name',
  labelInitialQty: 'Initial quantity (optional)',
  labelQtyReceived: 'Quantity received',
  labelPurchasePrice: 'Purchase price (optional)',
  labelAdjQty: 'Adjustment quantity (+ or −)',
  labelReason: 'Reason *',
  movementInitial: 'Initial',
  movementRestock: 'Restock',
  movementAdjustment: 'Adjustment',

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboardTitle: 'Dashboard',
  todayRevenue: "Today's revenue",
  todaySales: "Today's sales",
  chartTitle: 'Sales',
  btnDay: 'Day',
  btnWeek: 'Week',
  lowStockTitle: 'Low stock',

  // ── Auth guard / offline ───────────────────────────────────────────────────
  offlineTitle: "You're offline",
  offlineMessage: 'Connect to the internet and log in at least once to use Stockart offline.',
  loading: 'Loading…',

  // ── Sample products ───────────────────────────────────────────────────────
  sampleProducts: [
    'Bottled Water 500ml',
    'Cola 330ml',
    'Orange Juice 1L',
    'Mineral Water 1.5L',
    'Bread Loaf',
    'Eggs (dozen)',
    'Whole Milk 1L',
    'Butter 250g',
    'Rice 1kg',
    'Sugar 1kg',
    'Cooking Oil 1L',
    'Tomato Paste 400g',
    'Sardines (can)',
    'Biscuits 200g',
    'Soap Bar',
  ],
} as const
