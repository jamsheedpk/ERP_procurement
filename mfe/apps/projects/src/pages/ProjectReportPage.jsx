import React from "react";
import { Icon, Button, IconButton, Avatar, PartyAutocomplete, ProjectSelect } from "../legacy.jsx";
import { downloadElementAsPdf } from "@meridian/ui";
import "../setup.js";
const {
  useState:    useStatePR,
  useMemo:     useMemoPR,
  useEffect:   useEffectPR,
  useCallback: useCallbackPR,
} = React;

var PR_TYPE_LABELS = {
  house: "House", villa: "Villa", office: "Office", tower: "Tower",
  museum: "Museum", mall: "Mall", hotel: "Hotel", infrastructure: "Infrastructure",
  renovation: "Renovation", other: "Other",
};

var PR_STAGE_META = {
  quotation:         { label: "Quotation",         color: "#2563B0" },
  discussion:        { label: "Discussion",        color: "#D78A14" },
  approved:          { label: "Approved",          color: "#1F8A52" },
  advance_collected: { label: "Advance Collected", color: "#534AB7" },
  work_started:      { label: "Work Started",      color: "#6F1947" },
  completed:         { label: "Completed",         color: "#0F6E56" },
  on_hold:           { label: "On Hold",           color: "#A89DA3" },
  cancelled:         { label: "Cancelled",         color: "#C0263A" },
};

function prAED(n) {
  var num = parseFloat(n) || 0;
  return "AED " + num.toLocaleString("en-AE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function prAED2(n) {
  var num = parseFloat(n) || 0;
  return "AED " + num.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

var PR_SOURCE_META = {
  expense:  { label: "Expense",   icon: "receipt",       color: "#C0263A" },
  cashbook: { label: "Cash Book", icon: "book-open",     color: "#2563B0" },
  daybook:  { label: "Day Book",  icon: "notebook-pen",  color: "#534AB7" },
};

// ── Transaction breakdown drawer ───────────────────────────────────────────────
function TxnBreakdown(props) {
  var row     = props.row;
  var onClose = props.onClose;
  var onFullView = props.onFullView;
  var full    = props.full; // full-page rendering (no sticky sidebar sizing)

  var dataArr = useStatePR(null);
  var data    = dataArr[0];
  var setData = dataArr[1];
  var loadingArr = useStatePR(true);
  var loading    = loadingArr[0];
  var setLoading = loadingArr[1];

  useEffectPR(function() {
    setLoading(true);
    fetch(window.API + "/reports/project-pnl/" + row.projectId)
      .then(function(r) { return r.json(); })
      .then(function(d) { setData(d); setLoading(false); })
      .catch(function() { setLoading(false); });
  }, [row.projectId]);

  var txns = (data && data.transactions) || [];

  return (
    <div className="card" style={{ position: full ? "static" : "sticky", top: 90, padding: full ? "26px 30px" : "18px 20px",
      maxHeight: full ? "none" : "calc(100vh - 110px)", overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ minWidth: 0, paddingRight: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--fg-1)", lineHeight: 1.3 }}>{row.title}</div>
          <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 3 }}>{row.partyName || "—"}</div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {onFullView && <IconButton icon="maximize-2" title="Full view — open the breakdown full page" onClick={onFullView} />}
          {!full && <IconButton icon="x" title="Close" onClick={onClose} />}
        </div>
      </div>

      {/* Net P&L headline */}
      <div style={{ textAlign: "center", padding: "16px 0", borderRadius: 10, marginBottom: 14,
        background: row.netProfit >= 0 ? "#ECFDF5" : "#FFF1F2" }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
          color: row.netProfit >= 0 ? "#1F8A52" : "#C0263A", marginBottom: 4 }}>
          {row.netProfit >= 0 ? "Net Profit" : "Net Loss"}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: row.netProfit >= 0 ? "#1F8A52" : "#C0263A" }}>
          {prAED(Math.abs(row.netProfit))}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 3 }}>
          Margin {row.margin.toFixed(1)}%
        </div>
      </div>

      {/* Income vs cost summary */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
        {[
          { label: "Cash Receipts",  value: row.receipts,         color: "#1F8A52" },
          { label: "Day Book Credit",value: row.dayCredits,       color: "#1F8A52" },
          { label: "Invoice Payments",value: row.invoiceCollected,color: "#1F8A52" },
          { label: "Total Income",   value: row.totalIncome,      color: "#1F8A52", bold: true },
          { label: "Expenses",       value: row.expenses,   color: "#C0263A" },
          { label: "Cash Payments",  value: row.payments,   color: "#C0263A" },
          { label: "Day Book Debit", value: row.dayDebits,  color: "#C0263A" },
          { label: "Total Cost",     value: row.totalCost,  color: "#C0263A", bold: true },
        ].map(function(r) {
          return (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5,
              paddingTop: r.bold ? 5 : 0, borderTop: r.bold ? "1px solid var(--border-subtle)" : "none" }}>
              <span style={{ color: "var(--fg-3)", fontWeight: r.bold ? 700 : 400 }}>{r.label}</span>
              <span style={{ fontWeight: r.bold ? 700 : 600, color: r.bold ? r.color : "var(--fg-1)" }}>{prAED(r.value)}</span>
            </div>
          );
        })}
      </div>

      {/* Contract reference */}
      {row.contractValue > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 14,
          padding: "8px 12px", background: "var(--ink-50)", borderRadius: 8 }}>
          <span style={{ color: "var(--fg-3)" }}>Contract Value</span>
          <span style={{ fontWeight: 700, color: "var(--brand-burgundy)" }}>{prAED(row.contractValue)}</span>
        </div>
      )}

      {/* Transactions */}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
        color: "var(--fg-3)", marginBottom: 10 }}>
        Transactions {txns.length > 0 ? "(" + txns.length + ")" : ""}
      </div>

      {loading ? (
        <div style={{ fontSize: 12.5, color: "var(--fg-3)", padding: "10px 0" }}>Loading…</div>
      ) : txns.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--fg-4)", fontStyle: "italic", padding: "10px 12px",
          background: "var(--ink-50)", borderRadius: 8 }}>No transactions recorded for this project.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {txns.map(function(t, i) {
            var sm = PR_SOURCE_META[t.source] || PR_SOURCE_META.cashbook;
            var isIn = t.direction === "in";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                borderRadius: 8, background: "var(--ink-50)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: sm.color + "18",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={sm.icon} size={13} color={sm.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-1)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.description || sm.label}
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--fg-3)" }}>
                    {sm.label} · {t.date || "—"}{t.party ? " · " + t.party : ""}
                  </div>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, flexShrink: 0,
                  color: isIn ? "#1F8A52" : "#C0263A" }}>
                  {isIn ? "+" : "−"}{prAED(t.amount)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── ProjectReportPage ──────────────────────────────────────────────────────────
function ProjectReportPage() {
  var rowsArr = useStatePR([]);    var rows = rowsArr[0];    var setRows = rowsArr[1];
  var grandArr = useStatePR(null); var grand = grandArr[0];  var setGrand = grandArr[1];
  var loadingArr = useStatePR(true); var loading = loadingArr[0]; var setLoading = loadingArr[1];
  var selectedArr = useStatePR(null); var selected = selectedArr[0]; var setSelected = selectedArr[1];
  var searchArr = useStatePR("");  var search = searchArr[0];   var setSearch = searchArr[1];
  var filterArr = useStatePR("all"); var resultFilter = filterArr[0]; var setResultFilter = filterArr[1];
  var fullViewArr = useStatePR(false); var fullView = fullViewArr[0]; var setFullView = fullViewArr[1];

  useEffectPR(function() {
    setLoading(true);
    fetch(window.API + "/reports/project-pnl")
      .then(function(r) { return r.json(); })
      .then(function(d) {
        setRows((d && d.rows) || []);
        setGrand((d && d.grand) || null);
        setLoading(false);
      })
      .catch(function() { setLoading(false); });
  }, []);

  var filtered = useMemoPR(function() {
    return rows.filter(function(r) {
      if (resultFilter === "profit" && r.netProfit < 0) return false;
      if (resultFilter === "loss"   && r.netProfit >= 0) return false;
      if (resultFilter === "active" && (r.totalIncome === 0 && r.totalCost === 0)) return false;
      if (search) {
        var q = search.toLowerCase();
        var hay = (r.title + " " + (r.partyName || "") + " " + (r.location || "")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }, [rows, resultFilter, search]);

  var selRow = useMemoPR(function() {
    if (!selected) return null;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].projectId === selected) return rows[i];
    }
    return null;
  }, [selected, rows]);

  function exportCSV() {
    var header = ["Project","Client","Type","Stage","Total Income","Total Cost","Net Profit/Loss","Margin %"];
    var lines = [header.join(",")];
    filtered.forEach(function(r) {
      lines.push([
        '"' + (r.title || "").replace(/"/g, '""') + '"',
        '"' + (r.partyName || "").replace(/"/g, '""') + '"',
        PR_TYPE_LABELS[r.type] || r.type || "",
        (PR_STAGE_META[r.stage] || {}).label || r.stage || "",
        r.totalIncome.toFixed(2),
        r.totalCost.toFixed(2),
        r.netProfit.toFixed(2),
        r.margin.toFixed(1),
      ].join(","));
    });
    var blob = new Blob([lines.join("\n")], { type: "text/csv" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "project-pnl-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page">
        <div className="page-head">
          <div><div className="eyebrow">Projects</div><h1 className="page-title">Project P&amp;L Report</h1></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          {[1,2,3,4,5].map(function(i) { return <div key={i} className="card pulse" style={{ height: 52 }} />; })}
        </div>
      </div>
    );
  }

  var profitCount = rows.filter(function(r) { return r.netProfit >= 0 && (r.totalIncome !== 0 || r.totalCost !== 0); }).length;
  var lossCount   = rows.filter(function(r) { return r.netProfit < 0; }).length;

  // Full view — the selected project's P&L breakdown as one full page.
  if (fullView && selRow) {
    return (
      <div className="page" style={{ maxWidth: 1000 }}>
        <div className="page-head">
          <div>
            <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={function() { setFullView(false); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
                color: "var(--brand-burgundy)", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600 }}>
                <Icon name="arrow-left" size={13} /> Project P&amp;L Report
              </button>
              <span style={{ color: "var(--fg-4)" }}>/</span>
              <span>Full view</span>
            </div>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="file-bar-chart" size={20} /> {selRow.title}
            </h1>
            <div className="page-sub">{selRow.partyName || "—"}</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Button variant="secondary" icon="download"
              onClick={function() { downloadElementAsPdf(document.getElementById("fullview-doc"), (selRow.projectId || "project") + "-pnl-full-view.pdf"); }}>PDF</Button>
            <Button variant="secondary" icon="printer" onClick={function() { window.print(); }}>Print</Button>
            <Button variant="ghost" icon="arrow-left" onClick={function() { setFullView(false); }}>Back</Button>
          </div>
        </div>
        <div id="fullview-doc">
          <TxnBreakdown full row={selRow} onClose={function() { setFullView(false); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page">

      {/* Header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Projects</div>
          <h1 className="page-title">Project P&amp;L Report</h1>
          <div className="page-sub">Profit &amp; loss per project across invoices, expenses, cash book &amp; day book</div>
        </div>
        <div className="row">
          <Button variant="secondary" icon="download" onClick={exportCSV}>Export CSV</Button>
        </div>
      </div>

      {/* Methodology note */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", marginBottom: 18,
        background: "var(--ink-50)", border: "1px solid var(--border-subtle)", borderRadius: 10,
        fontSize: 11.5, color: "var(--fg-3)", lineHeight: 1.5 }}>
        <Icon name="info" size={14} color="var(--fg-3)" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          <strong>Income</strong> = Cash Book receipts + Day Book credits + Invoice payments collected.&nbsp;
          <strong>Cost</strong> = Expenses (excl. rejected) + Cash Book payments + Day Book debits.&nbsp;
          <strong>Margin</strong> = Net ÷ contract value.
          Record each transaction in <strong>only one</strong> place (Invoice, Expense, Cash Book or Day Book) — the same amount entered twice is counted twice.
        </span>
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Income",   value: grand ? prAED(grand.totalIncome) : "—", icon: "trending-up",  color: "#1F8A52" },
          { label: "Total Cost",     value: grand ? prAED(grand.totalCost)   : "—", icon: "trending-down",color: "#C0263A" },
          { label: grand && grand.netProfit >= 0 ? "Net Profit" : "Net Loss",
            value: grand ? prAED(Math.abs(grand.netProfit)) : "—", icon: "scale",
            color: grand && grand.netProfit >= 0 ? "#2563B0" : "#C0263A" },
          { label: "Projects",       value: rows.length,                            icon: "folder",       color: "#534AB7" },
        ].map(function(k) {
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
          <input className="search-input" placeholder="Search project, client…" value={search}
            onChange={function(e) { setSearch(e.target.value); }} style={{ paddingLeft: 32, width: 240 }} />
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {[
            { id: "all",    label: "All Projects" },
            { id: "active", label: "With Activity" },
            { id: "profit", label: "Profit · " + profitCount },
            { id: "loss",   label: "Loss · " + lossCount },
          ].map(function(f) {
            return (
              <button key={f.id} className={"pill-btn" + (resultFilter === f.id ? " active" : "")}
                onClick={function() { setResultFilter(f.id); }}>
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: "grid", gridTemplateColumns: selRow ? "1fr 340px" : "1fr", gap: 20, alignItems: "start" }}>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--ink-50)" }}>
                {["Project / Client","Stage","Income","Cost","Net P&L","Margin"].map(function(h) {
                  return (
                    <th key={h} style={{ padding: "10px 14px",
                      textAlign: (h === "Income" || h === "Cost" || h === "Net P&L" || h === "Margin") ? "right" : "left",
                      fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--fg-3)", whiteSpace: "nowrap" }}>{h}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.map(function(r) {
                var sm = PR_STAGE_META[r.stage] || { label: r.stage, color: "#888" };
                var isSel = selected === r.projectId;
                var isProfit = r.netProfit >= 0;
                return (
                  <tr key={r.projectId}
                    style={{ borderBottom: "1px solid var(--border-subtle)", cursor: "pointer",
                      background: isSel ? "var(--plum-50)" : "transparent" }}
                    onClick={function() { setSelected(isSel ? null : r.projectId); }}>

                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 1 }}>
                        {r.partyName || "—"}{r.type ? " · " + (PR_TYPE_LABELS[r.type] || r.type) : ""}
                      </div>
                    </td>

                    <td style={{ padding: "11px 14px" }}>
                      {r.stage ? (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5,
                          background: sm.color + "18", color: sm.color, whiteSpace: "nowrap" }}>{sm.label}</span>
                      ) : <span style={{ color: "var(--fg-4)" }}>—</span>}
                    </td>

                    <td style={{ padding: "11px 14px", textAlign: "right", fontSize: 12.5, fontWeight: 600, color: "#1F8A52", whiteSpace: "nowrap" }}>
                      {r.totalIncome > 0 ? prAED(r.totalIncome) : "—"}
                    </td>

                    <td style={{ padding: "11px 14px", textAlign: "right", fontSize: 12.5, fontWeight: 600, color: "#C0263A", whiteSpace: "nowrap" }}>
                      {r.totalCost > 0 ? prAED(r.totalCost) : "—"}
                    </td>

                    <td style={{ padding: "11px 14px", textAlign: "right", fontSize: 13, fontWeight: 700,
                      color: isProfit ? "#1F8A52" : "#C0263A", whiteSpace: "nowrap" }}>
                      {(r.totalIncome === 0 && r.totalCost === 0) ? "—" : (isProfit ? "" : "−") + prAED(Math.abs(r.netProfit))}
                    </td>

                    <td style={{ padding: "11px 14px", textAlign: "right" }}>
                      {(r.totalIncome === 0 && r.totalCost === 0) ? (
                        <span style={{ color: "var(--fg-4)", fontSize: 12 }}>—</span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
                          background: isProfit ? "#ECFDF5" : "#FFF1F2", color: isProfit ? "#1F8A52" : "#C0263A" }}>
                          <Icon name={isProfit ? "arrow-up-right" : "arrow-down-right"} size={11} color={isProfit ? "#1F8A52" : "#C0263A"} />
                          {(Math.abs(r.margin) < 10 ? r.margin.toFixed(1) : r.margin.toFixed(0))}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Grand total footer */}
            {grand && filtered.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: "2px solid var(--border-subtle)", background: "var(--ink-50)", fontWeight: 700 }}>
                  <td style={{ padding: "12px 14px", fontSize: 12.5, fontWeight: 700, color: "var(--fg-1)" }} colSpan={2}>GRAND TOTAL</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#1F8A52" }}>{prAED(grand.totalIncome)}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#C0263A" }}>{prAED(grand.totalCost)}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 14, fontWeight: 800, color: grand.netProfit >= 0 ? "#1F8A52" : "#C0263A" }}>
                    {(grand.netProfit >= 0 ? "" : "−") + prAED(Math.abs(grand.netProfit))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>

          {filtered.length === 0 && (
            <div style={{ padding: "48px 0", textAlign: "center", color: "var(--fg-3)" }}>
              <Icon name="file-bar-chart" size={32} color="var(--fg-3)" />
              <div style={{ marginTop: 12, fontWeight: 600, fontSize: 14 }}>No projects match this filter</div>
            </div>
          )}
        </div>

        {/* Detail drawer */}
        {selRow && (
          <TxnBreakdown row={selRow} onClose={function() { setSelected(null); }}
            onFullView={function() { setFullView(true); }} />
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ProjectReportPage });

export default ProjectReportPage;
