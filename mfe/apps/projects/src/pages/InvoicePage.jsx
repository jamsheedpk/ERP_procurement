import React from "react";
import { Icon, Button, IconButton, Avatar, PartyAutocomplete, ProjectSelect } from "../legacy.jsx";
import "../setup.js";
import { computeItemsLocally } from "./QuotationPage.jsx";
// Invoices module — list, view/print, status, payments. Invoices are usually
// created by converting a Quotation (see QuotationPage "Invoice" action), but
// can also be managed here. All identifiers are uniquely prefixed (INV_ / inv)
// because every .jsx file shares one global scope.

var INV_STATUS = {
  unpaid:    { label: "Unpaid",    color: "#C0263A", bg: "#FFF1F2",        icon: "circle"          },
  partial:   { label: "Partial",   color: "#D78A14", bg: "#FEF3C7",        icon: "circle-dashed"   },
  paid:      { label: "Paid",      color: "#1F8A52", bg: "#ECFDF5",        icon: "check-circle-2"  },
  overdue:   { label: "Overdue",   color: "#B91C1C", bg: "#FEE2E2",        icon: "alert-circle"    },
  cancelled: { label: "Cancelled", color: "#A89DA3", bg: "var(--ink-100)", icon: "x-circle"        },
};

function invAED(n) {
  return "AED " + (parseFloat(n) || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function InvStatusBadge(props) {
  var meta = INV_STATUS[props.status || "unpaid"] || INV_STATUS.unpaid;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20,
      background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 700 }}>
      <Icon name={meta.icon} size={11} color={meta.color} /> {meta.label}
    </span>
  );
}

// ── Print an invoice to a new window (adapted from the quotation print) ──────────
function printInvoice(inv) {
  var BRAND = "#6F1947";
  function money(n) { return "AED " + (parseFloat(n) || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  var items = inv.items || [];
  var itemRows = "";
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var bg = i % 2 === 0 ? "#ffffff" : "#fafafa";
    var rowTotal = (parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0);
    itemRows += "<tr style=\"background:" + bg + ";border-bottom:1px solid #f0f0f0\">"
      + "<td style=\"padding:7px 10px;color:#888;font-size:12px\">" + (i + 1) + "</td>"
      + "<td style=\"padding:7px 10px;font-size:12px\">"
        + (it.category ? "<span style=\"font-size:10px;color:" + BRAND + ";font-weight:700;margin-right:6px\">" + it.category + "</span>" : "")
        + (it.description || "") + "</td>"
      + "<td style=\"padding:7px 10px;color:#666;font-size:12px\">" + (it.unit || "lump sum") + "</td>"
      + "<td style=\"padding:7px 10px;text-align:right;font-size:12px\">" + (it.qty || 0) + "</td>"
      + "<td style=\"padding:7px 10px;text-align:right;font-size:12px\">" + money(it.unitPrice) + "</td>"
      + "<td style=\"padding:7px 10px;text-align:right;font-weight:600;font-size:12px\">" + money(rowTotal) + "</td>"
      + "</tr>";
  }
  var discountRow = (inv.discountAmt > 0)
    ? "<div style=\"display:flex;justify-content:space-between;padding:5px 10px;font-size:12px\"><span style=\"color:#555\">Discount (" + (inv.discountPct || 0) + "%)</span><span style=\"color:#C0263A\">- " + money(inv.discountAmt) + "</span></div>" : "";
  var clientDetails = "";
  if (inv.clientAddress) clientDetails += "<div>" + inv.clientAddress + "</div>";
  if (inv.clientPhone)   clientDetails += "<div>T: " + inv.clientPhone + "</div>";
  if (inv.clientEmail)   clientDetails += "<div>E: " + inv.clientEmail + "</div>";

  var html = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Invoice " + (inv.invoiceId || "") + "</title>"
    + "<style>@page { size: A4; margin: 18mm 16mm; } * { box-sizing:border-box;margin:0;padding:0; }"
    + "body { font-family: Arial, Helvetica, sans-serif; font-size:13px; color:#1a1a1a; background:#fff; }"
    + "table { border-collapse: collapse; width: 100%; } th { background:" + BRAND + " !important;color:#fff !important;-webkit-print-color-adjust:exact;print-color-adjust:exact; }"
    + ".gt { background:" + BRAND + " !important;color:#fff !important;-webkit-print-color-adjust:exact;print-color-adjust:exact; }"
    + ".from-box { background:#fdf4f8 !important;-webkit-print-color-adjust:exact;print-color-adjust:exact; }"
    + "@media print { body { -webkit-print-color-adjust:exact;print-color-adjust:exact; } }</style></head><body>"
    + "<div style=\"display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:18px;border-bottom:3px solid " + BRAND + "\">"
      + "<div><div style=\"display:flex;align-items:center;gap:10px;margin-bottom:6px\">"
        + "<div style=\"width:40px;height:40px;border-radius:10px;background:" + BRAND + ";display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px\">M</div>"
        + "<div><div style=\"font-weight:800;font-size:16px;color:" + BRAND + "\">Meridian Architecture &amp; Development</div>"
        + "<div style=\"font-size:11px;color:#666\">Design · Engineering · Construction</div></div></div>"
        + "<div style=\"font-size:11px;color:#555;line-height:1.7\"><div>Business Bay, Dubai, UAE</div><div>+971 4 000 0000 · info@meridianad.ae</div></div></div>"
      + "<div style=\"text-align:right\"><div style=\"font-size:22px;font-weight:800;color:" + BRAND + ";letter-spacing:-0.5px\">TAX INVOICE</div>"
        + "<div style=\"font-size:14px;font-weight:700;color:#333;margin-top:2px\">" + (inv.invoiceId || "") + "</div>"
        + (inv.quotationId ? "<div style=\"font-size:11px;color:#888;margin-top:2px\">Ref: " + inv.quotationId + "</div>" : "") + "</div></div>"
    + "<div style=\"display:flex;gap:24px;margin-bottom:20px;flex-wrap:wrap\">"
      + "<div><span style=\"font-size:10px;color:#888;font-weight:700;text-transform:uppercase\">Invoice Date</span><br><span style=\"font-weight:600\">" + (inv.date || "—") + "</span></div>"
      + "<div><span style=\"font-size:10px;color:#888;font-weight:700;text-transform:uppercase\">Due Date</span><br><span style=\"font-weight:600\">" + (inv.dueDate || "—") + "</span></div>"
      + "<div><span style=\"font-size:10px;color:#888;font-weight:700;text-transform:uppercase\">Currency</span><br><span style=\"font-weight:600\">" + (inv.currency || "AED") + "</span></div></div>"
    + "<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px\">"
      + "<div class=\"from-box\" style=\"padding:14px 16px;border-radius:8px\"><div style=\"font-size:10px;font-weight:700;color:" + BRAND + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:8px\">From</div>"
        + "<div style=\"font-weight:700;font-size:14px\">Meridian Architecture &amp; Development</div><div style=\"font-size:11px;color:#666;margin-top:4px;line-height:1.6\">Business Bay, Dubai, UAE</div></div>"
      + "<div style=\"padding:14px 16px;border-radius:8px;border:1px solid #eee\"><div style=\"font-size:10px;font-weight:700;color:" + BRAND + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:8px\">Bill To</div>"
        + "<div style=\"font-weight:700;font-size:14px\">" + (inv.clientName || inv.partyName || "—") + "</div>"
        + "<div style=\"font-size:11px;color:#666;margin-top:4px;line-height:1.6\">" + clientDetails + "</div>"
        + (inv.projectTitle ? "<div style=\"font-size:11px;color:#888;margin-top:6px\">Project: " + inv.projectTitle + "</div>" : "") + "</div></div>"
    + "<table style=\"margin-bottom:18px\"><thead><tr>"
      + "<th style=\"padding:9px 10px;text-align:left;font-size:11px\">#</th><th style=\"padding:9px 10px;text-align:left;font-size:11px\">Description</th>"
      + "<th style=\"padding:9px 10px;text-align:left;font-size:11px\">Unit</th><th style=\"padding:9px 10px;text-align:right;font-size:11px\">Qty</th>"
      + "<th style=\"padding:9px 10px;text-align:right;font-size:11px\">Rate</th><th style=\"padding:9px 10px;text-align:right;font-size:11px\">Amount</th>"
      + "</tr></thead><tbody>" + itemRows + "</tbody></table>"
    + "<div style=\"display:flex;justify-content:flex-end;margin-bottom:20px\"><div style=\"width:300px\">"
      + "<div style=\"display:flex;justify-content:space-between;padding:5px 10px;font-size:12px\"><span style=\"color:#555\">Subtotal</span><span>" + money(inv.subtotal) + "</span></div>"
      + discountRow
      + "<div style=\"display:flex;justify-content:space-between;padding:5px 10px;font-size:12px\"><span style=\"color:#555\">VAT (" + (inv.taxPct || 0) + "%)</span><span>" + money(inv.taxAmt) + "</span></div>"
      + "<div class=\"gt\" style=\"display:flex;justify-content:space-between;padding:10px;border-radius:6px;margin-top:6px;font-weight:800;font-size:14px\"><span>Grand Total</span><span>" + money(inv.grandTotal) + "</span></div>"
      + "<div style=\"display:flex;justify-content:space-between;padding:5px 10px;font-size:12px;margin-top:6px\"><span style=\"color:#1F8A52\">Amount Paid</span><span style=\"color:#1F8A52\">" + money(inv.amountPaid) + "</span></div>"
      + "<div style=\"display:flex;justify-content:space-between;padding:5px 10px;font-size:13px;font-weight:700\"><span>Balance Due</span><span style=\"color:#C0263A\">" + money(inv.balanceDue) + "</span></div>"
      + "</div></div>"
    + (inv.paymentTerms ? "<div style=\"margin-bottom:16px\"><div style=\"font-weight:700;font-size:13px;color:" + BRAND + ";margin-bottom:6px;border-bottom:1px solid #eee;padding-bottom:4px\">Payment Terms</div><div style=\"line-height:1.8;color:#555;font-size:12px\">" + inv.paymentTerms + "</div></div>" : "")
    + (inv.notes ? "<div><div style=\"font-weight:700;font-size:13px;color:" + BRAND + ";margin-bottom:6px;border-bottom:1px solid #eee;padding-bottom:4px\">Notes</div><div style=\"line-height:1.8;color:#555;font-size:12px\">" + inv.notes + "</div></div>" : "")
    + "</body></html>";

  var w = window.open("", "_blank");
  if (!w) { alert("Pop-up blocked — allow pop-ups to print."); return; }
  w.document.write(html);
  w.document.close();
  setTimeout(function() { w.focus(); w.print(); }, 350);
}

// ── Record payment modal ─────────────────────────────────────────────────────────
function InvRecordPaymentModal(props) {
  var inv = props.invoice;
  var stateAmt = React.useState(String(inv.amountPaid || 0));
  var amt = stateAmt[0], setAmt = stateAmt[1];
  var stateSaving = React.useState(false);
  var saving = stateSaving[0], setSaving = stateSaving[1];
  var paid = parseFloat(amt) || 0;
  var balance = (inv.grandTotal || 0) - paid;

  function save() {
    setSaving(true);
    props.onSave(paid).then(function() { setSaving(false); }).catch(function() { setSaving(false); });
  }

  return (
    <div className="modal-overlay" onClick={props.onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={function(e) { e.stopPropagation(); }}>
        <div className="modal-head">
          <div style={{ fontWeight: 700, fontSize: 15 }}>Record Payment · {inv.invoiceId}</div>
          <IconButton icon="x" onClick={props.onClose} />
        </div>
        <div className="modal-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            <div style={{ padding: "8px 10px", background: "var(--ink-50)", borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase" }}>Grand Total</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{invAED(inv.grandTotal)}</div>
            </div>
            <div style={{ padding: "8px 10px", background: balance > 0 ? "#FFF1F2" : "#ECFDF5", borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase" }}>Balance</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: balance > 0 ? "#C0263A" : "#1F8A52" }}>{invAED(balance)}</div>
            </div>
          </div>
          <div className="form-row">
            <label className="form-label">Total Amount Paid (cumulative, AED)</label>
            <input className="form-input" type="number" min="0" value={amt} onChange={function(e) { setAmt(e.target.value); }} />
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button className="btn btn-sm" type="button" onClick={function() { setAmt(String(inv.grandTotal || 0)); }}>Mark fully paid</button>
              <button className="btn btn-sm" type="button" onClick={function() { setAmt("0"); }}>Clear</button>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={props.onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Payment"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────────
function InvoicePage(props) {
  var API = window.API || "http://localhost:5000/api";
  var stInv = React.useState([]);       var invoices = stInv[0],     setInvoices = stInv[1];
  var stLoad = React.useState(true);    var loading = stLoad[0],     setLoading = stLoad[1];
  var stSel = React.useState(null);     var selected = stSel[0],     setSelected = stSel[1];
  var stSearch = React.useState("");    var search = stSearch[0],    setSearch = stSearch[1];
  var stFilter = React.useState("all"); var statusFilter = stFilter[0], setStatusFilter = stFilter[1];
  var stPay = React.useState(null);     var payFor = stPay[0],       setPayFor = stPay[1];

  React.useEffect(function() { fetchInvoices(); }, []);

  function fetchInvoices() {
    setLoading(true);
    fetch(API + "/invoices")
      .then(function(r) { return r.json(); })
      .then(function(data) { setInvoices(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(function() { setLoading(false); });
  }

  function patchInvoice(invoiceId, body) {
    return fetch(API + "/invoices/" + invoiceId, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    })
      .then(function(r) { return r.json(); })
      .then(function(saved) {
        if (saved.error) { alert("Error: " + saved.error); return; }
        setInvoices(function(list) { return list.map(function(x) { return x.invoiceId === saved.invoiceId ? saved : x; }); });
        setSelected(function(s) { return s && s.invoiceId === saved.invoiceId ? saved : s; });
        return saved;
      });
  }

  function handleStatus(invoiceId, newStatus) { patchInvoice(invoiceId, { status: newStatus }); }

  function handleDelete(invoiceId) {
    if (!window.confirm("Delete this invoice? The source quotation will be unlinked.")) return;
    fetch(API + "/invoices/" + invoiceId, { method: "DELETE" })
      .then(function(r) { return r.json(); })
      .then(function() {
        setInvoices(function(list) { return list.filter(function(x) { return x.invoiceId !== invoiceId; }); });
        setSelected(function(s) { return s && s.invoiceId === invoiceId ? null : s; });
      })
      .catch(function(err) { alert("Delete failed: " + err.message); });
  }

  function savePayment(amount) {
    var inv = payFor;
    return patchInvoice(inv.invoiceId, { amountPaid: amount }).then(function() { setPayFor(null); });
  }

  var filtered = invoices.filter(function(inv) {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (search) {
      var s = search.toLowerCase();
      var hay = [inv.invoiceId, inv.clientName, inv.partyName, inv.projectTitle, inv.projectName, inv.quotationId].join(" ").toLowerCase();
      if (hay.indexOf(s) === -1) return false;
    }
    return true;
  });

  var totalInvoiced = invoices.reduce(function(s, i) { return s + (i.grandTotal || 0); }, 0);
  var totalPaid     = invoices.reduce(function(s, i) { return s + (i.amountPaid || 0); }, 0);
  var totalOutstanding = invoices.reduce(function(s, i) { return i.status === "cancelled" ? s : s + (i.balanceDue || 0); }, 0);

  var statusPills = [{ value: "all", label: "All" }].concat(
    Object.keys(INV_STATUS).map(function(k) { return { value: k, label: INV_STATUS[k].label }; })
  );

  var kpis = [
    { label: "Total Invoiced", value: invAED(totalInvoiced),   icon: "file-text",    color: "#534AB7" },
    { label: "Collected",      value: invAED(totalPaid),       icon: "trending-up",  color: "#1F8A52" },
    { label: "Outstanding",    value: invAED(totalOutstanding),icon: "alert-circle", color: "#C0263A" },
    { label: "Invoices",       value: invoices.length,         icon: "receipt",      color: "#2563B0" },
  ];

  return (
    <div className="page">
      <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="eyebrow">Projects</div>
          <h1 className="page-title">Invoices</h1>
          <div className="page-sub">Convert quotations to invoices, track payments &amp; outstanding balances</div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {kpis.map(function(k) {
          return (
            <div key={k.label} className="card" style={{ display: "flex", alignItems: "center", gap: 14,
              padding: "18px 20px", borderTop: "3px solid " + k.color }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: k.color + "15",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={k.icon} size={20} color={k.color} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--fg-1)" }}>{k.value}</div>
                <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>{k.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={14} color="var(--fg-3)" />
          </span>
          <input className="search-input" placeholder="Search invoice, client, project…" value={search}
            onChange={function(e) { setSearch(e.target.value); }} style={{ paddingLeft: 32, width: 260 }} />
        </div>
        {statusPills.map(function(pill) {
          var active = statusFilter === pill.value;
          return (
            <button key={pill.value} type="button" onClick={function() { setStatusFilter(pill.value); }}
              style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 20, cursor: "pointer",
                border: "1px solid " + (active ? "var(--brand-burgundy)" : "var(--border-subtle)"),
                background: active ? "var(--brand-burgundy)" : "transparent",
                color: active ? "#fff" : "var(--fg-2)" }}>
              {pill.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* Table */}
        <div className="card" style={{ flex: selected ? "0 0 58%" : "1", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--fg-3)" }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <Icon name="receipt" size={32} color="var(--fg-4)" />
              <div style={{ marginTop: 12, fontWeight: 600, fontSize: 14 }}>No invoices yet</div>
              <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 4 }}>
                Open Quotations and use the <strong>Invoice</strong> action to convert an approved quote.
              </div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {["Invoice", "Client / Project", "Date", "Total", "Balance", "Status", ""].map(function(h) {
                    return <th key={h} style={{ padding: "10px 14px", textAlign: h === "Total" || h === "Balance" ? "right" : "left",
                      fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--fg-3)" }}>{h}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {filtered.map(function(inv) {
                  var isSel = selected && selected.invoiceId === inv.invoiceId;
                  return (
                    <tr key={inv.invoiceId} onClick={function() { setSelected(inv); }}
                      style={{ borderBottom: "1px solid var(--border-subtle)", cursor: "pointer",
                        background: isSel ? "var(--ink-50)" : "transparent" }}>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ fontWeight: 700, fontSize: 12.5, color: "var(--fg-1)" }}>{inv.invoiceId}</div>
                        {inv.quotationId ? <div style={{ fontSize: 10.5, color: "var(--fg-3)" }}>from {inv.quotationId}</div> : null}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ fontSize: 12.5, color: "var(--fg-1)" }}>{inv.clientName || inv.partyName || "—"}</div>
                        <div style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{inv.projectTitle || inv.projectName || ""}</div>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--fg-2)", whiteSpace: "nowrap" }}>{inv.date || "—"}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap" }}>{invAED(inv.grandTotal)}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap",
                        color: inv.balanceDue > 0 ? "#C0263A" : "#1F8A52" }}>{invAED(inv.balanceDue)}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <select value={inv.status || "unpaid"} title="Change status" onClick={function(e) { e.stopPropagation(); }}
                          onChange={function(id) { return function(e) { handleStatus(id, e.target.value); }; }(inv.invoiceId)}
                          style={{ fontSize: 11, fontWeight: 700, padding: "3px 6px", borderRadius: 5, cursor: "pointer",
                            border: "1px solid " + INV_STATUS[inv.status || "unpaid"].color + "55",
                            background: INV_STATUS[inv.status || "unpaid"].bg, color: INV_STATUS[inv.status || "unpaid"].color }}>
                          {Object.keys(INV_STATUS).map(function(s) {
                            return <option key={s} value={s} style={{ color: "var(--fg-1)", background: "var(--bg-1)" }}>{INV_STATUS[s].label}</option>;
                          })}
                        </select>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 4 }} onClick={function(e) { e.stopPropagation(); }}>
                          <button className="btn" type="button" title="Record payment" style={{ padding: "4px 7px", fontSize: 12 }}
                            onClick={function(row) { return function() { setPayFor(row); }; }(inv)}><Icon name="wallet" size={13} /></button>
                          <button className="btn" type="button" title="Print" style={{ padding: "4px 7px", fontSize: 12 }}
                            onClick={function(row) { return function() { printInvoice(row); }; }(inv)}><Icon name="printer" size={13} /></button>
                          <button className="btn" type="button" title="Delete" style={{ padding: "4px 7px", fontSize: 12, color: "#C0263A" }}
                            onClick={function(id) { return function() { handleDelete(id); }; }(inv.invoiceId)}><Icon name="trash-2" size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail pane */}
        {selected && (
          <div className="card" style={{ flex: 1, minWidth: 0, padding: "18px 20px", position: "sticky", top: 90,
            maxHeight: "calc(100vh - 110px)", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14,
              paddingBottom: 14, borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{selected.invoiceId}</div>
                <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 3 }}>
                  {selected.clientName || selected.partyName || "—"}{selected.quotationId ? " · from " + selected.quotationId : ""}
                </div>
                <div style={{ marginTop: 8 }}><InvStatusBadge status={selected.status} /></div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <IconButton icon="wallet" title="Record payment" onClick={function() { setPayFor(selected); }} />
                <IconButton icon="printer" title="Print" onClick={function() { printInvoice(selected); }} />
                <IconButton icon="x" title="Close" onClick={function() { setSelected(null); }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[["Invoice Date", selected.date || "—"], ["Project", selected.projectTitle || selected.projectName || "—"],
                ["Grand Total", invAED(selected.grandTotal)], ["Amount Paid", invAED(selected.amountPaid)]].map(function(pair) {
                return (
                  <div key={pair[0]} style={{ padding: "8px 10px", background: "var(--ink-50)", borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>{pair[0]}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 2, wordBreak: "break-word" }}>{pair[1]}</div>
                  </div>
                );
              })}
              <div style={{ padding: "8px 10px", background: selected.balanceDue > 0 ? "#FFF1F2" : "#ECFDF5", borderRadius: 8, gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>Balance Due</div>
                <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2, color: selected.balanceDue > 0 ? "#C0263A" : "#1F8A52" }}>{invAED(selected.balanceDue)}</div>
              </div>
            </div>

            {/* Line items */}
            <div style={{ border: "1px solid var(--border-subtle)", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em",
                color: "var(--fg-3)", borderBottom: "1px solid var(--border-subtle)" }}>Line Items · {(selected.items || []).length}</div>
              {(selected.items || []).map(function(it, i) {
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 12px",
                    borderBottom: i < (selected.items.length - 1) ? "1px solid var(--border-subtle)" : "none" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: "var(--fg-1)" }}>{it.description}</div>
                      <div style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{it.qty} {it.unit} × {invAED(it.unitPrice)}</div>
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>{invAED((it.qty || 0) * (it.unitPrice || 0))}</div>
                  </div>
                );
              })}
              <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4, background: "var(--ink-50)" }}>
                <Row label="Subtotal" value={invAED(selected.subtotal)} />
                {selected.discountAmt > 0 ? <Row label={"Discount (" + selected.discountPct + "%)"} value={"− " + invAED(selected.discountAmt)} color="#C0263A" /> : null}
                <Row label={"VAT (" + (selected.taxPct || 0) + "%)"} value={invAED(selected.taxAmt)} />
                <Row label="Grand Total" value={invAED(selected.grandTotal)} bold />
              </div>
            </div>
          </div>
        )}
      </div>

      {payFor && <InvRecordPaymentModal invoice={payFor} onClose={function() { setPayFor(null); }} onSave={savePayment} />}
    </div>
  );

  function Row(p) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: p.bold ? 13 : 12, fontWeight: p.bold ? 800 : 500 }}>
        <span style={{ color: "var(--fg-3)" }}>{p.label}</span>
        <span style={{ color: p.color || "var(--fg-1)" }}>{p.value}</span>
      </div>
    );
  }
}

export default InvoicePage;
