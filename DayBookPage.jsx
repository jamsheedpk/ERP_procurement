/* global React, Icon, Button, IconButton, PartyAutocomplete, ProjectSelect */
const {
  useState:    useStateDB,
  useMemo:     useMemoDBk,
  useEffect:   useEffectDB,
  useCallback: useCallbackDB,
} = React;

const DB_TYPES = {
  expense:         { label: "Expense",          icon: "minus-circle",        color: "#C0263A" },
  income:          { label: "Income",           icon: "plus-circle",         color: "#1F8A52" },
  salary:          { label: "Salary",           icon: "users",               color: "#6F1947" },
  bank_deposit:    { label: "Bank Deposit",     icon: "banknote",            color: "#2563B0" },
  bank_withdrawal: { label: "Bank Withdrawal",  icon: "arrow-down-from-line",color: "#D78A14" },
  transfer:        { label: "Transfer",         icon: "arrow-right-left",    color: "#534AB7" },
  adjustment:      { label: "Adjustment",       icon: "settings-2",          color: "#854F0B" },
  other:           { label: "Other",            icon: "more-horizontal",     color: "#A89DA3" },
};
const DB_ACCOUNTS = [
  "Cash Account", "Bank Account", "Accounts Receivable", "Accounts Payable",
  "Salary & Wages", "Office Expenses", "Travel & Transport", "Rent & Utilities",
  "Sales Revenue", "Other Income", "Tax Payable", "Loan Account", "Capital Account", "Miscellaneous"
];

function todayStrDB() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + dd;
}

function prevDay(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + dd;
}

function nextDay(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + dd;
}

function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return days[d.getDay()] + ", " + String(d.getDate()).padStart(2, "0") + " " + months[d.getMonth()] + " " + d.getFullYear();
}

function fmtAEDDB(n) {
  return "AED " + (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const DB_EXP_CAT_ACCOUNT = {
  travel:    "Travel & Transport",
  meals:     "Office Expenses",
  accomm:    "Travel & Transport",
  office:    "Office Expenses",
  training:  "Office Expenses",
  client:    "Office Expenses",
  transport: "Travel & Transport",
  other:     "Miscellaneous",
};

const DB_EXP_STATUS_META = {
  pending:    { label: "Pending",    color: "#D78A14", bg: "#FEF3C7" },
  approved:   { label: "Approved",   color: "#1F8A52", bg: "#ECFDF5" },
  reimbursed: { label: "Reimbursed", color: "#2563B0", bg: "#EFF6FF" },
  rejected:   { label: "Rejected",   color: "#C0263A", bg: "#FFF1F2" },
};

function expenseToDBEntry(ex) {
  return {
    entryId:     ex.expenseId,
    date:        ex.date,
    entryType:   "expense",
    account:     DB_EXP_CAT_ACCOUNT[ex.cat] || "Office Expenses",
    description: ex.desc || ex.description || "",
    party:       ex.empName || "",
    debit:       ex.amount || 0,
    credit:      0,
    reference:   ex.expenseId,
    notes:       ex.notes || "",
    _source:     "expense",
    _expStatus:  ex.status,
    _dept:       ex.dept || "",
  };
}

// ── AddEntryModal ──────────────────────────────────────────────────────────────
function AddDayBookModal({ defaultDate, onClose, onSave }) {
  const [form, setForm] = useStateDB({
    date: defaultDate || todayStrDB(),
    entryType: "expense",
    account: "Cash Account",
    description: "",
    party: "",
    projectId: "",
    projectName: "",
    debit: "",
    credit: "",
    reference: "",
    notes: "",
  });
  const set = function(k) { return function(e) { setForm(function(p) { return Object.assign({}, p, { [k]: e.target.value }); }); }; };

  const debitVal  = parseFloat(form.debit)  || 0;
  const creditVal = parseFloat(form.credit) || 0;
  const valid = form.description.trim() && form.date && form.account && (debitVal > 0 || creditVal > 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={function(e) { e.stopPropagation(); }}>
        <div className="modal-head">
          <div style={{ fontWeight: 700, fontSize: 15 }}>New Day Book Entry</div>
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
              <select className="form-input" value={form.entryType} onChange={set("entryType")}>
                {Object.entries(DB_TYPES).map(function(pair) {
                  return <option key={pair[0]} value={pair[0]}>{pair[1].label}</option>;
                })}
              </select>
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Account Head *</label>
            <select className="form-input" value={form.account} onChange={set("account")}>
              {DB_ACCOUNTS.map(function(a) {
                return <option key={a} value={a}>{a}</option>;
              })}
            </select>
          </div>

          <div className="form-row">
            <label className="form-label">Description *</label>
            <input className="form-input" placeholder="Brief description of the transaction" value={form.description} onChange={set("description")} />
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

          <div className="form-row">
            <label className="form-label">Reference</label>
            <input className="form-input" placeholder="Invoice, voucher no., etc." value={form.reference} onChange={set("reference")} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-row">
              <label className="form-label">Debit (AED)</label>
              <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={form.debit} onChange={set("debit")} />
            </div>
            <div className="form-row">
              <label className="form-label">Credit (AED)</label>
              <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={form.credit} onChange={set("credit")} />
            </div>
          </div>

          {!valid && form.description.trim() && (debitVal === 0 && creditVal === 0) && (
            <div style={{ fontSize: 11.5, color: "#C0263A", padding: "6px 10px", background: "#FFF1F2", borderRadius: 7 }}>
              At least one of Debit or Credit must be greater than 0.
            </div>
          )}

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

// ── DayBookPage ────────────────────────────────────────────────────────────────
function DayBookPage() {
  const [entries,    setEntries]    = useStateDB([]);
  const [expEntries, setExpEntries] = useStateDB([]);
  const [loading,    setLoading]    = useStateDB(true);
  const [selected,   setSelected]   = useStateDB(null);
  const [showNew,    setShowNew]    = useStateDB(false);

  const [activeDate, setActiveDate] = useStateDB(todayStrDB());
  const [tab,        setTab]        = useStateDB("day"); // "all" | "day"
  const [search,     setSearch]     = useStateDB("");
  const [typeFilter,   setTypeFilter]   = useStateDB("all");
  const [sourceFilter, setSourceFilter] = useStateDB("all");
  const [page,       setPage]       = useStateDB(1);
  const PAGE_SIZE = 15;

  const [editingNote, setEditingNote] = useStateDB(false);
  const [noteDraft,   setNoteDraft]   = useStateDB("");

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffectDB(function() {
    async function load() {
      setLoading(true);
      try {
        const [dbRes, exRes] = await Promise.all([
          fetch(window.API + "/daybook"),
          fetch(window.API + "/expenses"),
        ]);
        const dbData = await dbRes.json();
        const exData = await exRes.json();
        setEntries(Array.isArray(dbData) ? dbData : []);
        setExpEntries(Array.isArray(exData) ? exData.map(expenseToDBEntry) : []);
      } catch(e) { console.error(e); setEntries([]); setExpEntries([]); }
      setLoading(false);
    }
    load();
  }, []);

  // ── Merge manual + expense entries ────────────────────────────────────────
  const allEntries = useMemoDBk(function() {
    return entries.concat(expEntries).sort(function(a, b) {
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      return 0;
    });
  }, [entries, expEntries]);

  // ── Filtered view ─────────────────────────────────────────────────────────
  const viewEntries = useMemoDBk(function() {
    return allEntries.filter(function(e) {
      if (tab === "day" && e.date !== activeDate) return false;
      if (typeFilter !== "all" && e.entryType !== typeFilter) return false;
      if (sourceFilter === "manual"  && e._source === "expense") return false;
      if (sourceFilter === "expense" && e._source !== "expense") return false;
      if (search) {
        var q = search.toLowerCase();
        var hit = (e.description || "").toLowerCase().indexOf(q) >= 0
          || (e.party || "").toLowerCase().indexOf(q) >= 0
          || (e.account || "").toLowerCase().indexOf(q) >= 0
          || (e.reference || "").toLowerCase().indexOf(q) >= 0;
        if (!hit) return false;
      }
      return true;
    });
  }, [allEntries, tab, activeDate, typeFilter, sourceFilter, search]);

  useEffectDB(function() { setPage(1); }, [tab, activeDate, typeFilter, sourceFilter, search]);

  const totalPages = Math.max(1, Math.ceil(viewEntries.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageRows   = viewEntries.slice(pageStart, pageStart + PAGE_SIZE);

  const navBtnStyle = function(dis) {
    return { width: 28, height: 28, borderRadius: 7, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", cursor: dis ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: dis ? 0.4 : 1 };
  };

  // ── KPI totals for current view ──────────────────────────────────────────
  const kpi = useMemoDBk(function() {
    var totalDebit = 0, totalCredit = 0;
    viewEntries.forEach(function(e) {
      totalDebit  += (e.debit  || 0);
      totalCredit += (e.credit || 0);
    });
    return { count: viewEntries.length, totalDebit: totalDebit, totalCredit: totalCredit, net: totalCredit - totalDebit };
  }, [viewEntries]);

  // ── Type breakdown for summary sidebar ───────────────────────────────────
  const typeBreakdown = useMemoDBk(function() {
    const map = {};
    viewEntries.forEach(function(e) {
      if (!map[e.entryType]) map[e.entryType] = { count: 0, debit: 0, credit: 0 };
      map[e.entryType].count++;
      map[e.entryType].debit  += (e.debit  || 0);
      map[e.entryType].credit += (e.credit || 0);
    });
    return Object.entries(map).map(function(pair) {
      return Object.assign({ type: pair[0] }, pair[1]);
    }).sort(function(a, b) { return (b.debit + b.credit) - (a.debit + a.credit); });
  }, [viewEntries]);

  const selEntry = allEntries.find(function(e) { return e.entryId === selected; });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNew = useCallbackDB(async function(form) {
    try {
      const body = Object.assign({}, form, {
        debit:  parseFloat(form.debit)  || 0,
        credit: parseFloat(form.credit) || 0,
      });
      const r = await fetch(window.API + "/daybook", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const doc = await r.json();
      setEntries(function(prev) { return [doc, ...prev]; });
    } catch(err) { console.error(err); }
    setShowNew(false);
  }, []);

  const handleDelete = useCallbackDB(async function(entryId) {
    setEntries(function(prev) { return prev.filter(function(e) { return e.entryId !== entryId; }); });
    setSelected(null);
    try {
      await fetch(window.API + "/daybook/" + entryId, { method: "DELETE" });
    } catch(err) { console.error(err); }
  }, []);

  const handlePatch = useCallbackDB(async function(entryId, update) {
    setEntries(function(prev) { return prev.map(function(e) { return e.entryId === entryId ? Object.assign({}, e, update) : e; }); });
    try {
      await fetch(window.API + "/daybook/" + entryId, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
    } catch(err) { console.error(err); }
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page">
      <div className="page-head">
        <div><div className="eyebrow">Finance</div><h1 className="page-title">Day Book</h1></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        {[1,2,3,4,5].map(function(i) { return <div key={i} className="card pulse" style={{ height: 52 }} />; })}
      </div>
    </div>
  );

  return (
    <div className="page">
      {/* Page head */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Finance</div>
          <h1 className="page-title">Day Book</h1>
          <div className="page-sub">
            {kpi.count} {kpi.count === 1 ? "entry" : "entries"}
            {" · "}
            <span style={{ color: "#C0263A" }}>{fmtAEDDB(kpi.totalDebit)} debit</span>
            {" · "}
            <span style={{ color: "#1F8A52" }}>{fmtAEDDB(kpi.totalCredit)} credit</span>
            {tab === "day" ? " (today)" : " (all dates)"}
          </div>
        </div>
        <Button variant="primary" icon="plus" onClick={function() { setShowNew(true); }}>New Entry</Button>
      </div>

      {/* Date navigation bar */}
      <div className="card" style={{ padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button onClick={function() { setActiveDate(prevDay(activeDate)); }} title="Previous day"
          style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="chevron-left" size={16} color="var(--fg-2)" />
        </button>
        <div style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 14, color: "var(--fg-1)", minWidth: 200 }}>
          {formatDisplayDate(activeDate)}
        </div>
        <button onClick={function() { setActiveDate(nextDay(activeDate)); }} title="Next day"
          style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="chevron-right" size={16} color="var(--fg-2)" />
        </button>
        <button className={"pill-btn" + (activeDate === todayStrDB() ? " active" : "")} onClick={function() { setActiveDate(todayStrDB()); }}>
          Today
        </button>
        <input type="date" value={activeDate} onChange={function(e) { setActiveDate(e.target.value); }}
          style={{ height: 32, fontSize: 12, padding: "0 8px", borderRadius: 7, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", color: "var(--fg-1)" }} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <button className={"pill-btn" + (tab === "day" ? " active" : "")} onClick={function() { setTab("day"); }}>
          Selected Day
        </button>
        <button className={"pill-btn" + (tab === "all" ? " active" : "")} onClick={function() { setTab("all"); }}>
          All Dates
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderTop: "3px solid #534AB7" }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#534AB715", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="list" size={20} color="#534AB7" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--fg-1)" }}>{kpi.count}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>Total Entries</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderTop: "3px solid #C0263A" }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#C0263A15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="arrow-up-right" size={20} color="#C0263A" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#C0263A" }}>{fmtAEDDB(kpi.totalDebit)}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>Total Debit</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderTop: "3px solid #1F8A52" }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#1F8A5215", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="arrow-down-left" size={20} color="#1F8A52" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1F8A52" }}>{fmtAEDDB(kpi.totalCredit)}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>Total Credit</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderTop: "3px solid " + (kpi.net >= 0 ? "#1F8A52" : "#C0263A") }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: (kpi.net >= 0 ? "#1F8A52" : "#C0263A") + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="scale" size={20} color={kpi.net >= 0 ? "#1F8A52" : "#C0263A"} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: kpi.net >= 0 ? "#1F8A52" : "#C0263A" }}>{fmtAEDDB(kpi.net)}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>Net (Cr - Dr)</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={14} color="var(--fg-3)" />
          </span>
          <input className="search-input" placeholder="Search description, account, party…" value={search} onChange={function(e) { setSearch(e.target.value); }}
            style={{ paddingLeft: 32, width: 260 }} />
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <button key="all" className={"pill-btn" + (typeFilter === "all" ? " active" : "")} onClick={function() { setTypeFilter("all"); }}>All Types</button>
          {Object.entries(DB_TYPES).map(function(pair) {
            var k = pair[0]; var v = pair[1];
            return (
              <button key={k} className={"pill-btn" + (typeFilter === k ? " active" : "")} onClick={function() { setTypeFilter(typeFilter === k ? "all" : k); }}
                style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name={v.icon} size={11} color={typeFilter === k ? "#fff" : v.color} />
                {v.label}
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
      </div>

      {/* Main layout: table + right pane */}
      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 300px" : "1fr 280px", gap: 20, alignItems: "start" }}>

        {/* Table */}
        <div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--ink-50)" }}>
                  {["Date","Entry Type","Account Head","Description","Party","Reference","Debit (AED)","Credit (AED)"].map(function(h) {
                    return (
                      <th key={h} style={{ padding: "10px 14px", textAlign: (h === "Debit (AED)" || h === "Credit (AED)") ? "right" : "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--fg-3)", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageRows.map(function(e) {
                  const isSel = selected === e.entryId;
                  const tm    = DB_TYPES[e.entryType] || DB_TYPES.other;
                  return (
                    <tr key={e.entryId}
                      style={{ borderBottom: "1px solid var(--border-subtle)", cursor: "pointer", background: isSel ? "var(--plum-50)" : "transparent" }}
                      onClick={function() { setSelected(isSel ? null : e.entryId); setEditingNote(false); }}>

                      <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--fg-3)", whiteSpace: "nowrap" }}>{e.date}</td>

                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: tm.color + "15", color: tm.color, whiteSpace: "nowrap" }}>
                          <Icon name={tm.icon} size={10} color={tm.color} />
                          {tm.label}
                        </span>
                      </td>

                      <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--fg-2)", whiteSpace: "nowrap" }}>
                        {e.account || "—"}
                      </td>

                      <td style={{ padding: "10px 14px", maxWidth: 240 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, color: "var(--fg-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                            {e.description}
                          </div>
                          {e._source === "expense" && (function() {
                            var sm = DB_EXP_STATUS_META[e._expStatus] || DB_EXP_STATUS_META.pending;
                            return (
                              <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: sm.bg, color: sm.color, whiteSpace: "nowrap" }}>
                                {sm.label}
                              </span>
                            );
                          })()}
                        </div>
                        {e._source === "expense" && (
                          <span style={{ fontSize: 10.5, fontWeight: 600, color: "#D78A14", display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                            <Icon name="receipt" size={10} color="#D78A14" />
                            Expense · {e._dept || ""}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--fg-3)", whiteSpace: "nowrap" }}>
                        {e.party || "—"}
                      </td>

                      <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--fg-4)", whiteSpace: "nowrap" }}>
                        {e.reference || "—"}
                      </td>

                      <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 12.5, fontWeight: e.debit > 0 ? 700 : 400, color: e.debit > 0 ? "#C0263A" : "var(--fg-4)", whiteSpace: "nowrap" }}>
                        {e.debit > 0 ? fmtAEDDB(e.debit) : "—"}
                      </td>

                      <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 12.5, fontWeight: e.credit > 0 ? 700 : 400, color: e.credit > 0 ? "#1F8A52" : "var(--fg-4)", whiteSpace: "nowrap" }}>
                        {e.credit > 0 ? fmtAEDDB(e.credit) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Totals footer */}
              {viewEntries.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: "2px solid var(--border-subtle)", background: "var(--ink-50)" }}>
                    <td colSpan={6} style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: "var(--fg-2)", textAlign: "left" }}>TOTAL</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 12.5, fontWeight: 800, color: "#C0263A", whiteSpace: "nowrap" }}>
                      {fmtAEDDB(kpi.totalDebit)}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 12.5, fontWeight: 800, color: "#1F8A52", whiteSpace: "nowrap" }}>
                      {fmtAEDDB(kpi.totalCredit)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>

            {viewEntries.length === 0 && (
              <div style={{ padding: "48px 0", textAlign: "center", color: "var(--fg-3)" }}>
                <Icon name="notebook-pen" size={32} color="var(--fg-3)" />
                <div style={{ marginTop: 12, fontWeight: 600, fontSize: 14 }}>
                  {tab === "day" ? "No entries for " + formatDisplayDate(activeDate) : "No entries found"}
                </div>
                <div style={{ fontSize: 12, marginTop: 4, color: "var(--fg-4)" }}>Adjust filters or add a new entry</div>
              </div>
            )}

            {viewEntries.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid var(--border-subtle)", flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 12.5, color: "var(--fg-3)" }}>
                  {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, viewEntries.length)} of {viewEntries.length} entries
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
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.3 }}>{selEntry.description}</div>
                <div style={{ marginTop: 6 }}>
                  {(function() {
                    const tm = DB_TYPES[selEntry.entryType] || DB_TYPES.other;
                    return (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: tm.color + "18", color: tm.color }}>
                        <Icon name={tm.icon} size={11} color={tm.color} />
                        {tm.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {!selEntry._source && (
                  <IconButton icon="trash-2" title="Delete" onClick={function() { handleDelete(selEntry.entryId); }} />
                )}
                <IconButton icon="x" title="Close" onClick={function() { setSelected(null); }} />
              </div>
            </div>

            {/* Debit / Credit amounts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div style={{ textAlign: "center", padding: "12px 8px", background: selEntry.debit > 0 ? "#FFF1F2" : "var(--ink-50)", borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#C0263A", marginBottom: 4 }}>Debit</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: selEntry.debit > 0 ? "#C0263A" : "var(--fg-4)" }}>
                  {selEntry.debit > 0 ? fmtAEDDB(selEntry.debit) : "—"}
                </div>
              </div>
              <div style={{ textAlign: "center", padding: "12px 8px", background: selEntry.credit > 0 ? "#ECFDF5" : "var(--ink-50)", borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#1F8A52", marginBottom: 4 }}>Credit</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: selEntry.credit > 0 ? "#1F8A52" : "var(--fg-4)" }}>
                  {selEntry.credit > 0 ? fmtAEDDB(selEntry.credit) : "—"}
                </div>
              </div>
            </div>

            {/* Meta */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
              {[
                selEntry._source === "expense" ? {
                  label: "Expense Status",
                  value: (DB_EXP_STATUS_META[selEntry._expStatus] || DB_EXP_STATUS_META.pending).label,
                  color: (DB_EXP_STATUS_META[selEntry._expStatus] || DB_EXP_STATUS_META.pending).color,
                } : null,
                selEntry._source === "expense" ? { label: "Source", value: "Expense Claim", color: "#D78A14" } : null,
                { label: "Entry ID",    value: selEntry.entryId },
                { label: "Date",        value: selEntry.date },
                { label: "Account",     value: selEntry.account || "—" },
                { label: "Party",       value: selEntry.party || "—" },
                { label: "Reference",   value: selEntry.reference || "—" },
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

            {/* Debit vs Credit balance bar */}
            <div className="card" style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 12 }}>Balance Summary</div>
              {(kpi.totalDebit + kpi.totalCredit) > 0 ? (
                <div>
                  <div style={{ height: 10, borderRadius: 6, overflow: "hidden", display: "flex", gap: 2 }}>
                    <div style={{ height: "100%", background: "#C0263A", borderRadius: 3, width: Math.round(kpi.totalDebit / (kpi.totalDebit + kpi.totalCredit) * 100) + "%" }} />
                    <div style={{ height: "100%", background: "#1F8A52", borderRadius: 3, flex: 1 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <div>
                      <div style={{ fontSize: 10.5, color: "var(--fg-3)", marginBottom: 1 }}>Total Debit</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#C0263A" }}>{fmtAEDDB(kpi.totalDebit)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10.5, color: "var(--fg-3)", marginBottom: 1 }}>Total Credit</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1F8A52" }}>{fmtAEDDB(kpi.totalCredit)}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--fg-3)", fontWeight: 600 }}>Net</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: kpi.net >= 0 ? "#1F8A52" : "#C0263A" }}>{fmtAEDDB(kpi.net)}</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--fg-4)", fontStyle: "italic" }}>No data for current view.</div>
              )}
            </div>

            {/* Entry type breakdown */}
            {typeBreakdown.length > 0 && (
              <div className="card" style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 12 }}>By Entry Type</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {typeBreakdown.map(function(t) {
                    const tm = DB_TYPES[t.type] || DB_TYPES.other;
                    return (
                      <div key={t.type} style={{ padding: "8px 10px", borderRadius: 8, background: "var(--ink-50)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: tm.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Icon name={tm.icon} size={13} color={tm.color} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-1)" }}>{tm.label}</div>
                            <div style={{ fontSize: 10.5, color: "var(--fg-4)" }}>{t.count} {t.count === 1 ? "entry" : "entries"}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            {t.debit > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: "#C0263A" }}>-{fmtAEDDB(t.debit)}</div>}
                            {t.credit > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: "#1F8A52" }}>+{fmtAEDDB(t.credit)}</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showNew && <AddDayBookModal defaultDate={activeDate} onClose={function() { setShowNew(false); }} onSave={handleNew} />}
    </div>
  );
}

Object.assign(window, { DayBookPage });
