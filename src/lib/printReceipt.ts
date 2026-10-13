// Prints a receipt from a hidden iframe that contains ONLY the receipt.
// Independent from the app's CSS, so it cannot print a blank page.
// In the Chrome print dialog choose "Save as PDF" as the destination.

export interface ReceiptData {
  shopName: string;
  contact?: string;
  saleNumber: string; // e.g. "#0014"
  dateTime: string; // already formatted, e.g. "Oct 13, 2026 11:46 AM"
  customerName?: string;
  lines: { name: string; qty: number; unitPrice: string; lineTotal: string }[];
  itemsCount: number;
  total: string; // already formatted, e.g. "$58.20"
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);

export function printReceipt(r: ReceiptData): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }

  const rows = r.lines
    .map(
      (l) =>
        `<tr><td>${l.qty} × ${esc(l.name)}<br><span class="m">${esc(
          l.unitPrice
        )}</span></td><td class="r">${esc(l.lineTotal)}</td></tr>`
    )
    .join('');

  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8">
<title>Receipt ${esc(r.saleNumber)}</title>
<style>
@page{margin:8mm}
body{margin:0 auto;max-width:80mm;font:12px/1.45 'IBM Plex Mono',ui-monospace,Menlo,Consolas,monospace;color:#1B2A41;background:#fff}
h1{font:600 17px 'IBM Plex Sans',Arial,sans-serif;margin:0 0 2px}
.m{opacity:.7}
hr{border:0;border-top:1px dashed #1B2A41;margin:8px 0}
table{width:100%;border-collapse:collapse}
td{padding:3px 0;vertical-align:top}
.r{text-align:right;white-space:nowrap}
.t td{font-weight:600;font-size:14px;border-top:2px solid #1B2A41;padding-top:6px}
</style></head><body>
<h1>${esc(r.shopName)}</h1>
${r.contact ? `<div class="m">${esc(r.contact)}</div>` : ''}
<div class="m">Sale ${esc(r.saleNumber)} · ${esc(r.dateTime)}</div>
${r.customerName ? `<div>Customer: ${esc(r.customerName)}</div>` : ''}
<hr><table>${rows}</table><hr>
<table>
<tr><td class="m">Items</td><td class="r m">${r.itemsCount}</td></tr>
<tr class="t"><td>TOTAL</td><td class="r">${esc(r.total)}</td></tr>
</table>
</body></html>`);
  doc.close();

  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  win.onafterprint = cleanup;
  setTimeout(() => {
    win.focus();
    win.print();
  }, 250);
}
