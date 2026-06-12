// Pure quotation/invoice line-item maths. Kept module-scoped in the Projects
// remote so InvoicePage stays self-contained after QuotationPage moved to the
// Finance remote. (Finance's QuotationPage keeps its own identical copy — the
// remotes are deployed independently, so a shared 10-line helper is duplicated
// rather than cross-imported.)
export function computeItemsLocally(items, discountPct, taxPct) {
  var computed = (items || []).map(function(it) {
    return Object.assign({}, it, { total: (parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0) });
  });
  var subtotal    = computed.reduce(function(s, it) { return s + (it.total || 0); }, 0);
  var discountAmt = subtotal * ((parseFloat(discountPct) || 0) / 100);
  var taxAmt      = (subtotal - discountAmt) * ((parseFloat(taxPct) || 5) / 100);
  var grandTotal  = subtotal - discountAmt + taxAmt;
  return { items: computed, subtotal: subtotal, discountAmt: discountAmt, taxAmt: taxAmt, grandTotal: grandTotal };
}
