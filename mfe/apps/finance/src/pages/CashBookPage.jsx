import React from "react";
import { Icon, Button, IconButton, Avatar, PartyAutocomplete, ProjectSelect } from "../legacy.jsx";
import { downloadElementAsPdf } from "@meridian/ui";
import "../setup.js";
const {
  useState:    useStateCB,
  useMemo:     useMemoCB,
  useEffect:   useEffectCB,
  useCallback: useCallbackCB,
  useRef:      useRefCB,
} = React;

const CB_RECEIPT_CATS = {
  client_payment: { label: "Client Payment",  icon: "user-check",   color: "#1F8A52" },
  sales:          { label: "Sales Revenue",   icon: "trending-up",  color: "#2563B0" },
  loan_received:  { label: "Loan Received",   icon: "landmark",     color: "#534AB7" },
  interest:       { label: "Interest Income", icon: "percent",      color: "#0F6E56" },
  refund:         { label: "Refund",          icon: "rotate-ccw",   color: "#D78A14" },
  other_income:   { label: "Other Income",    icon: "plus-circle",  color: "#A89DA3" },
};
const CB_PAYMENT_CATS = {
  salary:       { label: "Salary",          icon: "users",          color: "#6F1947" },
  vendor:       { label: "Vendor Payment",  icon: "truck",          color: "#C0263A" },
  rent:         { label: "Rent",            icon: "home",           color: "#534AB7" },
  utilities:    { label: "Utilities",       icon: "zap",            color: "#D78A14" },
  tax:          { label: "Tax Payment",     icon: "file-text",      color: "#2563B0" },
  loan_repay:   { label: "Loan Repayment",  icon: "landmark",       color: "#854F0B" },
  petty_cash:   { label: "Petty Cash",      icon: "coins",          color: "#1F8A52" },
  bank_deposit: { label: "Bank Deposit",    icon: "banknote",       color: "#0F6E56" },
  other:        { label: "Other",           icon: "minus-circle",   color: "#A89DA3" },
};
const CB_MODES = {
  cash:          { label: "Cash",          icon: "banknote",        color: "#1F8A52" },
  bank_transfer: { label: "Bank Transfer", icon: "landmark",        color: "#2563B0" },
  cheque:        { label: "Cheque",        icon: "file-text",       color: "#534AB7" },
  mobile_pay:    { label: "Mobile Pay",    icon: "smartphone",      color: "#0F6E56" },
  other:         { label: "Other",         icon: "more-horizontal", color: "#A89DA3" },
};

const EXP_STATUS_META = {
  pending:    { label: "Pending",    color: "#D78A14", bg: "#FEF3C7" },
  approved:   { label: "Approved",   color: "#1F8A52", bg: "#ECFDF5" },
  reimbursed: { label: "Reimbursed", color: "#2563B0", bg: "#EFF6FF" },
  rejected:   { label: "Rejected",   color: "#C0263A", bg: "#FFF1F2" },
};

function expenseToCBEntry(ex) {
  return {
    entryId:     ex.expenseId,
    date:        ex.date,
    entryType:   "payment",
    category:    "other",
    reference:   ex.expenseId,
    description: ex.desc || ex.description || "",
    party:       ex.empName || "",
    amount:      ex.amount || 0,
    paymentMode: ex.paymentType || "cash",
    notes:       ex.notes || "",
    _source:     "expense",
    _expStatus:  ex.status,
  };
}

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + dd;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + dd;
}

function fmtAED(n) {
  return "AED " + (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getCatMeta(type, category) {
  if (type === "receipt") return CB_RECEIPT_CATS[category] || { label: category || "Receipt", icon: "plus-circle", color: "#1F8A52" };
  return CB_PAYMENT_CATS[category] || { label: category || "Payment", icon: "minus-circle", color: "#C0263A" };
}

// ── AddEntryModal ──────────────────────────────────────────────────────────────
function AddEntryModal({ onClose, onSave }) {
  const [form, setForm] = useStateCB({
    date: todayStr(),
    entryType: "receipt",
    category: "client_payment",
    description: "",
    party: "",
    projectId: "",
    projectName: "",
    amount: "",
    paymentMode: "cash",
    reference: "",
    notes: "",
  });
  const set = function(k) { return function(e) { setForm(function(p) { return Object.assign({}, p, { [k]: e.target.value }); }); }; };

  const catOptions = form.entryType === "receipt" ? CB_RECEIPT_CATS : CB_PAYMENT_CATS;
  const valid = form.description.trim() && parseFloat(form.amount) > 0 && form.date;

  function handleTypeChange(t) {
    const newCat = t === "receipt" ? "client_payment" : "salary";
    setForm(function(p) { return Object.assign({}, p, { entryType: t, category: newCat }); });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={function(e) { e.stopPropagation(); }}>
        <div className="modal-head">
          <div style={{ fontWeight: 700, fontSize: 15 }}>New Cash Entry</div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div className="modal-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-row">
              <label className="form-label">Date *</label>
              <input className="form-input" type="date" value={form.date} onChange={set("date")} />
            </div>
            <div className="form-row">
              <label className="form-label">Entry Type *</label>
              <select className="form-input" value={form.entryType} onChange={function(e) { handleTypeChange(e.target.value); }}>
                <option value="receipt">Receipt (In)</option>
                <option value="payment">Payment (Out)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Category</label>
            <select className="form-input" value={form.category} onChange={set("category")}>
              {Object.entries(catOptions).map(function(pair) {
                return <option key={pair[0]} value={pair[0]}>{pair[1].label}</option>;
              })}
            </select>
          </div>

          <div className="form-row">
            <label className="form-label">Description *</label>
            <input className="form-input" placeholder="Brief description" value={form.description} onChange={set("description")} />
          </div>

          <div className="form-row">
            <label className="form-label">Party</label>
            <PartyAutocomplete
              value={form.party}
              onChange={function(v) {
                setForm(function(p) { return Object.assign({}, p, { party: v, projectId: "", projectName: "" }); });
              }}
              placeholder="Search party / project or type a name…"
            />
          </div>
          <ProjectSelect
            partyName={form.party}
            value={form.projectId}
            onChange={function(sel) {
              setForm(function(p) { return Object.assign({}, p, { projectId: sel.projectId, projectName: sel.projectName }); });
            }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-row">
              <label className="form-label">Amount (AED) *</label>
              <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={set("amount")} />
            </div>
            <div className="form-row">
              <label className="form-label">Payment Mode</label>
              <select className="form-input" value={form.paymentMode} onChange={set("paymentMode")}>
                {Object.entries(CB_MODES).map(function(pair) {
                  return <option key={pair[0]} value={pair[0]}>{pair[1].label}</option>;
                })}
              </select>
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Reference</label>
            <input className="form-input" placeholder="Cheque no., invoice, etc." value={form.reference} onChange={set("reference")} />
          </div>

          <div className="form-row">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} placeholder="Any supporting notes…" value={form.notes} onChange={set("notes")}
              style={{ resize: "vertical", fontFamily: "inherit", fontSize: 13 }} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={function() { onSave(form); }} disabled={!valid}>
            Add Entry
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CashBookPage ───────────────────────────────────────────────────────────────
function CashBookPage() {
  const [entries,   setEntries]   = useStateCB([]);
  const [expEntries, setExpEntries] = useStateCB([]);
  const [loading,   setLoading]   = useStateCB(true);
  const [selected,  setSelected]  = useStateCB(null);
  const [showNew,   setShowNew]   = useStateCB(false);

  const [fromDate,  setFromDate]  = useStateCB(daysAgo(30));
  const [toDate,    setToDate]    = useStateCB(todayStr());
  const [typeFilter,   setTypeFilter]   = useStateCB("all");
  const [modeFilter,   setModeFilter]   = useStateCB("all");
  const [sourceFilter, setSourceFilter] = useStateCB("all");
  const [search,    setSearch]    = useStateCB("");
  const [page,      setPage]      = useStateCB(1);
  const PAGE_SIZE = 15;

  const [openingBal, setOpeningBal] = useStateCB(function() {
    return parseFloat(localStorage.getItem("hrm_cb_opening") || "0") || 0;
  });
  const [editingOpening, setEditingOpening] = useStateCB(false);
  const [openingDraft,   setOpeningDraft]   = useStateCB("0");

  const [editingNote, setEditingNote] = useStateCB(false);
  const [noteDraft,   setNoteDraft]   = useStateCB("");
  const [fullView,    setFullView]    = useStateCB(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  useEffectCB(function() {
    async function load() {
      setLoading(true);
      try {
        const [cbRes, exRes] = await Promise.all([
          fetch(window.API + "/cashbook?from=" + fromDate + "&to=" + toDate),
          fetch(window.API + "/expenses?status=reimbursed"),
        ]);
        const cbData = await cbRes.json();
        const exData = await exRes.json();
        setEntries(Array.isArray(cbData) ? cbData : []);
        setExpEntries(Array.isArray(exData) ? exData.map(expenseToCBEntry) : []);
      } catch(e) { console.error(e); setEntries([]); setExpEntries([]); }
      setLoading(false);
    }
    load();
  }, [fromDate, toDate]);

  // ── Merge manual + expense entries ────────────────────────────────────────
  const allEntries = useMemoCB(function() {
    // Filter expense entries to the selected date range
    const filtered = expEntries.filter(function(e) {
      return e.date >= fromDate && e.date <= toDate;
    });
    return entries.concat(filtered);
  }, [entries, expEntries, fromDate, toDate]);

  // ── Running balance computation ────────────────────────────────────────────
  const withBalance = useMemoCB(function() {
    const sorted = allEntries.slice().sort(function(a, b) {
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      if ((a.createdAt || "") < (b.createdAt || "")) return -1;
      if ((a.createdAt || "") > (b.createdAt || "")) return 1;
      return 0;
    });
    var bal = openingBal;
    return sorted.map(function(e) {
      bal = e.entryType === "receipt" ? bal + e.amount : bal - e.amount;
      return Object.assign({}, e, { _balance: bal });
    });
  }, [allEntries, openingBal]);

  // ── KPI totals ─────────────────────────────────────────────────────────────
  const totals = useMemoCB(function() {
    var receipts = 0, payments = 0;
    allEntries.forEach(function(e) {
      if (e.entryType === "receipt") receipts += e.amount;
      else payments += e.amount;
    });
    return { receipts: receipts, payments: payments };
  }, [allEntries]);

  const closingBal = openingBal + totals.receipts - totals.payments;

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filtered = useMemoCB(function() {
    return withBalance.filter(function(e) {
      if (typeFilter !== "all" && e.entryType !== typeFilter) return false;
      if (modeFilter !== "all" && e.paymentMode !== modeFilter) return false;
      if (sourceFilter === "manual"  && e._source === "expense") return false;
      if (sourceFilter === "expense" && e._source !== "expense") return false;
      if (search) {
        var q = search.toLowerCase();
        var hit = (e.description || "").toLowerCase().indexOf(q) >= 0
          || (e.party || "").toLowerCase().indexOf(q) >= 0
          || (e.reference || "").toLowerCase().indexOf(q) >= 0;
        if (!hit) return false;
      }
      return true;
    });
  }, [withBalance, typeFilter, modeFilter, sourceFilter, search]);

  useEffectCB(function() { setPage(1); }, [typeFilter, modeFilter, sourceFilter, search, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageRows   = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const navBtnStyle = function(dis) {
    return { width: 28, height: 28, borderRadius: 7, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", cursor: dis ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: dis ? 0.4 : 1 };
  };

  // ── Category breakdown for summary sidebar ────────────────────────────────
  const catBreakdown = useMemoCB(function() {
    const map = {};
    allEntries.forEach(function(e) {
      const key = e.entryType + ":" + (e.category || "other");
      if (!map[key]) map[key] = { entryType: e.entryType, category: e.category || "other", amount: 0 };
      map[key].amount += e.amount;
    });
    return Object.values(map).sort(function(a, b) { return b.amount - a.amount; }).slice(0, 5);
  }, [entries]);

  const modeBreakdown = useMemoCB(function() {
    const map = {};
    const total = allEntries.reduce(function(s, e) { return s + e.amount; }, 0) || 1;
    allEntries.forEach(function(e) {
      const k = e.paymentMode || "cash";
      if (!map[k]) map[k] = 0;
      map[k] += e.amount;
    });
    return Object.entries(map).sort(function(a, b) { return b[1] - a[1]; }).map(function(pair) {
      return { mode: pair[0], amount: pair[1], pct: Math.round(pair[1] / total * 100) };
    });
  }, [entries]);

  const selEntry = allEntries.find(function(e) { return e.entryId === selected; });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNew = useCallbackCB(async function(form) {
    try {
      const body = Object.assign({}, form, { amount: parseFloat(form.amount) || 0 });
      const r = await fetch(window.API + "/cashbook", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const doc = await r.json();
      setEntries(function(prev) { return [doc, ...prev]; });
    } catch(err) { console.error(err); }
    setShowNew(false);
  }, []);

  const handleDelete = useCallbackCB(async function(entryId) {
    setEntries(function(prev) { return prev.filter(function(e) { return e.entryId !== entryId; }); });
    setSelected(null);
    try {
      await fetch(window.API + "/cashbook/" + entryId, { method: "DELETE" });
    } catch(err) { console.error(err); }
  }, []);

  const handlePatch = useCallbackCB(async function(entryId, update) {
    setEntries(function(prev) { return prev.map(function(e) { return e.entryId === entryId ? Object.assign({}, e, update) : e; }); });
    try {
      await fetch(window.API + "/cashbook/" + entryId, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
    } catch(err) { console.error(err); }
  }, []);

  function saveOpening() {
    const val = parseFloat(openingDraft) || 0;
    setOpeningBal(val);
    localStorage.setItem("hrm_cb_opening", String(val));
    setEditingOpening(false);
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page">
      <div className="page-head">
        <div><div className="eyebrow">Finance</div><h1 className="page-title">Cash Book</h1></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        {[1,2,3,4,5].map(function(i) { return <div key={i} className="card pulse" style={{ height: 52 }} />; })}
      </div>
    </div>
  );

  // Full view — the selected entry as one full-page voucher.
  if (fullView && selEntry) {
    const isReceipt = selEntry.entryType === "receipt";
    const cbCatMeta = getCatMeta(selEntry.entryType, selEntry.category);
    const cbModeMeta = CB_MODES[selEntry.paymentMode] || CB_MODES.cash;
    return (
      <div className="page" style={{ maxWidth: 1000 }}>
        <div className="page-head">
          <div>
            <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={function() { setFullView(false); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
                color: "var(--brand-burgundy)", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600 }}>
                <Icon name="arrow-left" size={13} /> Cash Book
              </button>
              <span style={{ color: "var(--fg-4)" }}>/</span>
              <span>Full view</span>
            </div>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name={isReceipt ? "arrow-down-left" : "arrow-up-right"} size={20} color={isReceipt ? "#1F8A52" : "#C0263A"} /> {selEntry.description}
            </h1>
            <div className="page-sub" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "monospace" }}>{selEntry.entryId}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 5,
                background: isReceipt ? "#ECFDF5" : "#FFF1F2", color: isReceipt ? "#1F8A52" : "#C0263A" }}>
                {isReceipt ? "Receipt" : "Payment"}
              </span>
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Button variant="secondary" icon="download"
              onClick={function() { downloadElementAsPdf(document.getElementById("fullview-doc"), selEntry.entryId + "-full-view.pdf"); }}>PDF</Button>
            <Button variant="secondary" icon="printer" onClick={function() { window.print(); }}>Print</Button>
            <Button variant="ghost" icon="arrow-left" onClick={function() { setFullView(false); }}>Back</Button>
          </div>
        </div>

        <div className="card" id="fullview-doc" style={{ padding: "26px 30px" }}>
          <div style={{ fontSize: 30, fontWeight: 800, textAlign: "center", padding: "20px 0", borderRadius: 10, marginBottom: 22,
            background: "var(--ink-50)", color: isReceipt ? "#1F8A52" : "#C0263A" }}>
            {fmtAED(selEntry.amount)}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px 22px", marginBottom: 22 }}>
            {[
              { lbl: "Entry ID",     val: selEntry.entryId },
              { lbl: "Date",         val: selEntry.date },
              { lbl: "Category",     val: cbCatMeta.label },
              { lbl: "Party",        val: selEntry.party || "—" },
              { lbl: "Payment mode", val: cbModeMeta.label },
              { lbl: "Reference",    val: selEntry.reference || "—" },
              { lbl: "Source",       val: selEntry._source === "expense" ? "Expense claim" : "Cash book entry" },
            ].map(function(m) {
              return (
                <div key={m.lbl}>
                  <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--fg-3)", fontWeight: 600 }}>{m.lbl}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)", marginTop: 3 }}>{m.val}</div>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: "2px solid var(--brand-burgundy)", paddingTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Notes</div>
            <div style={{ fontSize: 12.5, color: selEntry.notes ? "var(--fg-2)" : "var(--fg-3)", lineHeight: 1.6,
              fontStyle: selEntry.notes ? "normal" : "italic" }}>
              {selEntry.notes || "No notes."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Page head */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Finance</div>
          <h1 className="page-title">Cash Book</h1>
          <div className="page-sub">
            {fmtAED(totals.receipts)} receipts
            {" · "}
            {fmtAED(totals.payments)} payments
            {" · "}
            <span style={{ color: closingBal >= 0 ? "#2563B0" : "#C0263A", fontWeight: 700 }}>
              {fmtAED(closingBal)} closing
            </span>
          </div>
        </div>
        <div className="row" style={{ gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 12, color: "var(--fg-3)", fontWeight: 600 }}>From</label>
            <input type="date" value={fromDate} onChange={function(e) { setFromDate(e.target.value); }}
              style={{ height: 32, fontSize: 12, padding: "0 8px", borderRadius: 7, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", color: "var(--fg-1)" }} />
            <label style={{ fontSize: 12, color: "var(--fg-3)", fontWeight: 600 }}>To</label>
            <input type="date" value={toDate} onChange={function(e) { setToDate(e.target.value); }}
              style={{ height: 32, fontSize: 12, padding: "0 8px", borderRadius: 7, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", color: "var(--fg-1)" }} />
          </div>
          <Button variant="primary" icon="plus" onClick={function() { setShowNew(true); }}>New Entry</Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {/* Opening Balance */}
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderTop: "3px solid #534AB7" }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#534AB715", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="wallet" size={20} color="#534AB7" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingOpening ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="number" value={openingDraft} onChange={function(e) { setOpeningDraft(e.target.value); }} autoFocus
                  style={{ width: 90, height: 28, fontSize: 13, padding: "0 8px", borderRadius: 6, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", color: "var(--fg-1)" }} />
                <button onClick={saveOpening} style={{ height: 28, padding: "0 10px", borderRadius: 6, border: "none", background: "#534AB7", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>OK</button>
                <button onClick={function() { setEditingOpening(false); }} style={{ height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", fontSize: 12, cursor: "pointer" }}>x</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--fg-1)" }}>{fmtAED(openingBal)}</div>
                <button onClick={function() { setOpeningDraft(String(openingBal)); setEditingOpening(true); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}>
                  <Icon name="pencil" size={12} color="var(--fg-3)" />
                </button>
              </div>
            )}
            <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>Opening Balance</div>
          </div>
        </div>

        {/* Total Receipts */}
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderTop: "3px solid #1F8A52" }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#1F8A5215", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="trending-up" size={20} color="#1F8A52" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1F8A52" }}>{fmtAED(totals.receipts)}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>Total Receipts</div>
          </div>
        </div>

        {/* Total Payments */}
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderTop: "3px solid #C0263A" }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#C0263A15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="trending-down" size={20} color="#C0263A" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#C0263A" }}>{fmtAED(totals.payments)}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>Total Payments</div>
          </div>
        </div>

        {/* Closing Balance */}
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderTop: "3px solid " + (closingBal >= 0 ? "#2563B0" : "#C0263A") }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: (closingBal >= 0 ? "#2563B0" : "#C0263A") + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="scale" size={20} color={closingBal >= 0 ? "#2563B0" : "#C0263A"} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: closingBal >= 0 ? "#2563B0" : "#C0263A" }}>{fmtAED(closingBal)}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>Closing Balance</div>
          </div>
        </div>
      </div>

      {/* Filters row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={14} color="var(--fg-3)" />
          </span>
          <input className="search-input" placeholder="Search description, party, ref…" value={search} onChange={function(e) { setSearch(e.target.value); }}
            style={{ paddingLeft: 32, width: 240 }} />
        </div>

        <div style={{ display: "flex", gap: 5 }}>
          {["all","receipt","payment"].map(function(t) {
            return (
              <button key={t} className={"pill-btn" + (typeFilter === t ? " active" : "")} onClick={function() { setTypeFilter(t); }}>
                {t === "all" ? "All" : t === "receipt" ? "Receipts" : "Payments"}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 5 }}>
          {[
            { id: "all",     label: "All Sources" },
            { id: "manual",  label: "Manual" },
            { id: "expense", label: "Expenses" },
          ].map(function(s) {
            return (
              <button key={s.id} className={"pill-btn" + (sourceFilter === s.id ? " active" : "")}
                onClick={function() { setSourceFilter(s.id); }}
                style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {s.id === "expense" && <Icon name="receipt" size={11} color={sourceFilter === s.id ? "#fff" : "#D78A14"} />}
                {s.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {Object.entries(CB_MODES).map(function(pair) {
            const k = pair[0]; const v = pair[1];
            return (
              <button key={k} className={"pill-btn" + (modeFilter === k ? " active" : "")} onClick={function() { setModeFilter(modeFilter === k ? "all" : k); }}
                style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name={v.icon} size={11} color={modeFilter === k ? "#fff" : v.color} />
                {v.label}
              </button>
            );
          })}
          {modeFilter !== "all" && (
            <button className="pill-btn" onClick={function() { setModeFilter("all"); }}
              style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="x" size={11} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Main layout: table + right pane */}
      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 300px" : "1fr 280px", gap: 20, alignItems: "start" }}>

        {/* Table */}
        <div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--ink-50)" }}>
                  {["Date","Ref","Description","Party","Mode","Receipts (AED)","Payments (AED)","Balance"].map(function(h) {
                    return (
                      <th key={h} style={{ padding: "10px 14px", textAlign: (h === "Receipts (AED)" || h === "Payments (AED)" || h === "Balance") ? "right" : "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--fg-3)", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageRows.map(function(e) {
                  const isSel = selected === e.entryId;
                  const mode  = CB_MODES[e.paymentMode] || CB_MODES.cash;
                  return (
                    <tr key={e.entryId}
                      style={{ borderBottom: "1px solid var(--border-subtle)", cursor: "pointer", background: isSel ? "var(--plum-50)" : "transparent" }}
                      onClick={function() { setSelected(isSel ? null : e.entryId); setEditingNote(false); }}>

                      <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--fg-3)", whiteSpace: "nowrap" }}>{e.date}</td>

                      <td style={{ padding: "10px 14px", fontSize: 11.5, color: "var(--fg-4)", whiteSpace: "nowrap" }}>
                        {e.reference || "—"}
                      </td>

                      <td style={{ padding: "10px 14px", maxWidth: 240 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 190 }}>
                            {e.description}
                          </div>
                          {e._source === "expense" && (function() {
                            var sm = EXP_STATUS_META[e._expStatus] || EXP_STATUS_META.pending;
                            return (
                              <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: sm.bg, color: sm.color, whiteSpace: "nowrap" }}>
                                {sm.label}
                              </span>
                            );
                          })()}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                          {e._source === "expense" ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: 600, color: "#D78A14" }}>
                              <Icon name="receipt" size={10} color="#D78A14" />
                              Expense Claim
                            </span>
                          ) : (e.category && (function() {
                            var meta = getCatMeta(e.entryType, e.category);
                            return (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: 600, color: meta.color }}>
                                <Icon name={meta.icon} size={10} color={meta.color} />
                                {meta.label}
                              </span>
                            );
                          })())}
                        </div>
                      </td>

                      <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--fg-2)", whiteSpace: "nowrap" }}>
                        {e.party || "—"}
                      </td>

                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: mode.color + "15", color: mode.color, whiteSpace: "nowrap" }}>
                          <Icon name={mode.icon} size={10} color={mode.color} />
                          {mode.label}
                        </span>
                      </td>

                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, fontSize: 12.5, color: e.entryType === "receipt" ? "#1F8A52" : "var(--fg-4)", whiteSpace: "nowrap" }}>
                        {e.entryType === "receipt" ? fmtAED(e.amount) : "—"}
                      </td>

                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, fontSize: 12.5, color: e.entryType === "payment" ? "#C0263A" : "var(--fg-4)", whiteSpace: "nowrap" }}>
                        {e.entryType === "payment" ? fmtAED(e.amount) : "—"}
                      </td>

                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, fontSize: 12.5, color: e._balance >= 0 ? "#2563B0" : "#C0263A", whiteSpace: "nowrap" }}>
                        {fmtAED(e._balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div style={{ padding: "48px 0", textAlign: "center", color: "var(--fg-3)" }}>
                <Icon name="book-open" size={32} color="var(--fg-3)" />
                <div style={{ marginTop: 12, fontWeight: 600, fontSize: 14 }}>No entries found</div>
                <div style={{ fontSize: 12, marginTop: 4, color: "var(--fg-4)" }}>Adjust filters or add a new entry</div>
              </div>
            )}

            {filtered.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid var(--border-subtle)", flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 12.5, color: "var(--fg-3)" }}>
                  {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length} entries
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={function() { setPage(1); }} disabled={safePage === 1} style={navBtnStyle(safePage === 1)}><span style={{ fontSize: 12 }}>«</span></button>
                  <button onClick={function() { setPage(safePage - 1); }} disabled={safePage === 1} style={navBtnStyle(safePage === 1)}><span style={{ fontSize: 12 }}>‹</span></button>
                  {Array.from({ length: totalPages }, function(_, i) { return i + 1; }).filter(function(n) {
                    return n === 1 || n === totalPages || (n >= safePage - 2 && n <= safePage + 2);
                  }).map(function(n, i, arr) {
                    return [
                      i > 0 && arr[i-1] !== n - 1 ? (
                        <span key={"e" + n} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--fg-3)" }}>…</span>
                      ) : null,
                      <button key={n} onClick={function() { setPage(n); }}
                        style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--border-subtle)", cursor: "pointer", fontSize: 12, fontWeight: n === safePage ? 700 : 400, background: n === safePage ? "#2563B0" : "var(--bg-surface)", color: n === safePage ? "#fff" : "var(--fg-1)" }}>
                        {n}
                      </button>
                    ];
                  })}
                  <button onClick={function() { setPage(safePage + 1); }} disabled={safePage === totalPages} style={navBtnStyle(safePage === totalPages)}><span style={{ fontSize: 12 }}>›</span></button>
                  <button onClick={function() { setPage(totalPages); }} disabled={safePage === totalPages} style={navBtnStyle(safePage === totalPages)}><span style={{ fontSize: 12 }}>»</span></button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right pane */}
        {selEntry ? (
          /* ── Detail pane ── */
          <div className="card" style={{ position: "sticky", top: 90, padding: "18px 20px", maxHeight: "calc(100vh - 110px)", overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.3 }}>{selEntry.description}</div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
                    background: selEntry.entryType === "receipt" ? "#ECFDF5" : "#FFF1F2",
                    color: selEntry.entryType === "receipt" ? "#1F8A52" : "#C0263A" }}>
                    <Icon name={selEntry.entryType === "receipt" ? "arrow-down-left" : "arrow-up-right"} size={11} color={selEntry.entryType === "receipt" ? "#1F8A52" : "#C0263A"} />
                    {selEntry.entryType === "receipt" ? "Receipt" : "Payment"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <IconButton icon="maximize-2" title="Full view — open the entry full page" onClick={function() { setFullView(true); }} />
                {!selEntry._source && (
                  <IconButton icon="trash-2" title="Delete" onClick={function() { handleDelete(selEntry.entryId); }} />
                )}
                <IconButton icon="x" title="Close" onClick={function() { setSelected(null); }} />
              </div>
            </div>

            {/* Amount */}
            <div style={{ fontSize: 26, fontWeight: 800, textAlign: "center", padding: "14px 0", background: "var(--ink-50)", borderRadius: 10, marginBottom: 14,
              color: selEntry.entryType === "receipt" ? "#1F8A52" : "#C0263A" }}>
              {fmtAED(selEntry.amount)}
            </div>

            {/* Meta */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
              {[
                { label: "Entry ID",      value: selEntry.entryId },
                { label: "Date",          value: selEntry.date },
                { label: "Category",      value: getCatMeta(selEntry.entryType, selEntry.category).label },
                { label: "Party",         value: selEntry.party || "—" },
                { label: "Payment Mode",  value: (CB_MODES[selEntry.paymentMode] || CB_MODES.cash).label, color: (CB_MODES[selEntry.paymentMode] || CB_MODES.cash).color },
                { label: "Reference",     value: selEntry.reference || "—" },
                selEntry._source === "expense" ? {
                  label: "Expense Status",
                  value: (EXP_STATUS_META[selEntry._expStatus] || EXP_STATUS_META.pending).label,
                  color: (EXP_STATUS_META[selEntry._expStatus] || EXP_STATUS_META.pending).color,
                } : null,
                selEntry._source === "expense" ? { label: "Source", value: "Expense Claim", color: "#D78A14" } : null,
              ].filter(function(r) { return r !== null; }).map(function(r) {
                return (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                    <span style={{ color: "var(--fg-3)" }}>{r.label}</span>
                    <span style={{ fontWeight: 600, color: r.color || "var(--fg-1)", display: "flex", alignItems: "center", gap: 5 }}>
                      {r.color && <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, display: "inline-block", flexShrink: 0 }} />}
                      {r.value}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Notes */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)" }}>Notes</div>
                {!editingNote && (
                  <button style={{ fontSize: 11.5, color: "var(--brand-burgundy)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    onClick={function() { setEditingNote(true); setNoteDraft(selEntry.notes || ""); }}>
                    {selEntry.notes ? "Edit" : "Add"}
                  </button>
                )}
              </div>
              {editingNote ? (
                <div>
                  <textarea value={noteDraft} onChange={function(e) { setNoteDraft(e.target.value); }} rows={3} autoFocus
                    style={{ width: "100%", fontSize: 12.5, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-subtle)", resize: "vertical", fontFamily: "inherit", color: "var(--fg-1)", background: "var(--bg-surface)", boxSizing: "border-box" }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button className="btn btn-primary" style={{ fontSize: 12, padding: "5px 14px" }}
                      onClick={function() { handlePatch(selEntry.entryId, { notes: noteDraft }); setEditingNote(false); }}>Save</button>
                    <button className="btn" style={{ fontSize: 12, padding: "5px 14px" }}
                      onClick={function() { setEditingNote(false); }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: selEntry.notes ? "var(--fg-2)" : "var(--fg-3)", lineHeight: 1.55, padding: "10px 12px", background: "var(--ink-50)", borderRadius: 8, fontStyle: selEntry.notes ? "normal" : "italic", minHeight: 36 }}>
                  {selEntry.notes || "No notes."}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Summary sidebar ── */
          <div style={{ position: "sticky", top: 90, maxHeight: "calc(100vh - 110px)", overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 4, scrollbarWidth: "none", msOverflowStyle: "none" }}>

            {/* Segmented bar */}
            <div className="card" style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 12 }}>Flow Summary</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: closingBal >= 0 ? "#2563B0" : "#C0263A" }}>{fmtAED(closingBal)}</div>
              <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>Net closing balance</div>
              {(totals.receipts + totals.payments) > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ height: 10, borderRadius: 6, overflow: "hidden", display: "flex", gap: 2 }}>
                    <div style={{ height: "100%", background: "#1F8A52", borderRadius: 3, width: Math.round(totals.receipts / (totals.receipts + totals.payments) * 100) + "%" }} />
                    <div style={{ height: "100%", background: "#C0263A", borderRadius: 3, flex: 1 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ fontSize: 10.5, color: "#1F8A52", fontWeight: 600 }}>In: {fmtAED(totals.receipts)}</span>
                    <span style={{ fontSize: 10.5, color: "#C0263A", fontWeight: 600 }}>Out: {fmtAED(totals.payments)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Top categories */}
            {catBreakdown.length > 0 && (
              <div className="card" style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 12 }}>Top Categories</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {catBreakdown.map(function(c) {
                    const meta = getCatMeta(c.entryType, c.category);
                    return (
                      <div key={c.entryType + c.category} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: meta.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon name={meta.icon} size={13} color={meta.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-1)" }}>{meta.label}</div>
                          <div style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{c.entryType === "receipt" ? "Receipt" : "Payment"}</div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: meta.color, whiteSpace: "nowrap" }}>{fmtAED(c.amount)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payment mode breakdown */}
            {modeBreakdown.length > 0 && (
              <div className="card" style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 12 }}>By Payment Mode</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {modeBreakdown.map(function(m) {
                    const md = CB_MODES[m.mode] || CB_MODES.other;
                    return (
                      <div key={m.mode}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--fg-2)" }}>
                            <span style={{ width: 20, height: 20, borderRadius: 5, background: md.color + "18", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Icon name={md.icon} size={11} color={md.color} />
                            </span>
                            {md.label}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: md.color }}>{m.pct}%</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 3, background: "var(--ink-100)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: m.pct + "%", background: md.color, borderRadius: 3, transition: "width 0.4s ease" }} />
                        </div>
                        <div style={{ fontSize: 10.5, color: "var(--fg-4)", textAlign: "right", marginTop: 2 }}>{fmtAED(m.amount)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showNew && <AddEntryModal onClose={function() { setShowNew(false); }} onSave={handleNew} />}
    </div>
  );
}

Object.assign(window, { CashBookPage });

export default CashBookPage;
