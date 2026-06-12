import React from "react";
import { Icon, Button } from "../legacy.jsx";
import "../setup.js";
import ProcurementPageDefault, { ItemsPage, itemsTotals, itemsByCategory, AED, STAGE_BY_KEY } from "./ProcurementPage.jsx";
import ProcFullView from "./ProcFullView.jsx";
const { useState: useStateML, useEffect: useEffectML, useMemo: useMemoML } = React;

/**
 * Material & Labour List — standalone module. One BOQ list per procurement
 * request: this screen is the cross-request overview with a detail pane, and
 * drills into the same ItemsPage editor the lifecycle uses (single source of truth).
 */
export default function MaterialLabourPage() {
  const [procs, setProcs]     = useStateML(null);
  const [error, setError]     = useStateML(null);
  const [selected, setSelected] = useStateML(null); // procId shown in the detail pane
  const [editing, setEditing] = useStateML(null);   // procId open in the editor
  const [fullViewFor, setFullViewFor] = useStateML(null); // procId open in full view
  const [q, setQ]             = useStateML("");

  const load = () => fetch(`${window.API}/procurement`)
    .then(async (r) => {
      const body = await r.json().catch(() => null);
      if (!r.ok) throw new Error((body && (body.error || body.message)) || `Request failed (${r.status})`);
      return body;
    })
    .then((d) => setProcs(Array.isArray(d) ? d : []))
    .catch((e) => setError(e.message || "Could not load procurement requests."));

  useEffectML(() => { load(); }, []);

  const rows = useMemoML(() => {
    const list = (procs || []).filter((p) =>
      q === "" || (p.title + " " + p.procId + " " + (p.projectName || "") + " " + (p.vendor || "")).toLowerCase().includes(q.toLowerCase()));
    return list.map((p) => ({ proc: p, count: (p.items || []).length, totals: itemsTotals(p.items || []) }));
  }, [procs, q]);

  const kpis = useMemoML(() => rows.reduce((t, r) => ({
    lists: t.lists + (r.count > 0 ? 1 : 0),
    items: t.items + r.count,
    value: t.value + r.totals.subtotal,
    budget: t.budget + r.totals.budget,
  }), { lists: 0, items: 0, value: 0, budget: 0 }), [rows]);

  const handleSave = async (procId, items, applyTotal) => {
    const body = applyTotal != null ? { items, estValue: applyTotal } : { items };
    try {
      const res = await fetch(`${window.API}/procurement/${procId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const doc = await res.json();
      setProcs((prev) => (prev || []).map((p) => (p.procId === procId ? doc : p)));
    } catch (e) { console.error(e); }
    setEditing(null);
    setSelected(procId); // land back on the detail pane for what was just edited
  };

  if (error) return (
    <div className="page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 10, color: "var(--fg-3)" }}>
      <Icon name="alert-circle" size={28} color="var(--danger-500)" /><div>{error}</div>
    </div>
  );
  if (!procs) return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
      <div style={{ width: 32, height: 32, border: "3px solid var(--plum-100)", borderTopColor: "var(--brand-burgundy)", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
    </div>
  );

  // Drill-in: reuse the lifecycle's full editor (rows, categories, budget, PDF export).
  if (editing) {
    const proc = procs.find((p) => p.procId === editing);
    if (proc) return (
      <ItemsPage proc={proc} onBack={() => { setEditing(null); setSelected(editing); }}
        onSave={(list, applyTotal) => handleSave(editing, list, applyTotal)}
        backLabel="Material & Labour Lists" crumbLabel={proc.title || proc.procId} backButton="Back to lists" />
    );
  }

  // Full view — the whole request as one printable document.
  if (fullViewFor) {
    const proc = procs.find((p) => p.procId === fullViewFor);
    if (proc) return (
      <ProcFullView proc={proc} backLabel="Material & Labour Lists"
        onBack={() => { setFullViewFor(null); setSelected(fullViewFor); }} />
    );
  }

  const sel = selected ? procs.find((p) => p.procId === selected) : null;
  const selTotals = sel ? itemsTotals(sel.items || []) : null;
  const selCats   = sel ? itemsByCategory(sel.items || []) : [];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Procurement · BOQ</div>
          <h1 className="page-title">Material &amp; Labour Lists</h1>
          <div className="page-sub">Bill-of-quantities per procurement request — items, target rates and budget variance.</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { lbl: "Requests with lists", val: `${kpis.lists} / ${rows.length}`, ic: "list-checks" },
          { lbl: "Line items",          val: kpis.items,                        ic: "rows-3" },
          { lbl: "Combined value",      val: AED(kpis.value),                   ic: "banknote" },
          { lbl: "Combined budget",     val: kpis.budget ? AED(kpis.budget) : "—", ic: "target" },
        ].map((k) => (
          <div key={k.lbl} className="kpi">
            <div className="lbl">{k.lbl}</div>
            <div className="val">{k.val}</div>
            <div className="ico"><Icon name={k.ic} size={16} stroke={2} /></div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: sel ? "1fr 360px" : "1fr", gap: 20, alignItems: "start" }}>
        {/* Lists table */}
        <div className="tbl-wrap">
          <div className="tbl-toolbar">
            <div className="search" style={{ maxWidth: 340 }}>
              <Icon name="search" size={14} />
              <input placeholder="Search request, project or vendor…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="grow" />
            <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{rows.length} request{rows.length !== 1 ? "s" : ""}</span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Request</th><th>Project</th><th>Stage</th>
                <th style={{ textAlign: "right" }}>Items</th>
                <th style={{ textAlign: "right" }}>List value</th>
                <th style={{ textAlign: "right" }}>Variance</th>
                <th style={{ width: 110 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ proc: p, count, totals }) => {
                const stage = STAGE_BY_KEY[p.currentStage] || { label: p.currentStage || "—" };
                const over = totals.budget > 0 && totals.variance > 0;
                const active = selected === p.procId;
                return (
                  <tr key={p.procId} onClick={() => setSelected(active ? null : p.procId)}
                    style={{ cursor: "pointer", background: active ? "var(--plum-50)" : undefined }}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.title || p.procId}</div>
                      <div style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{p.procId}</div>
                    </td>
                    <td>{p.projectName || "—"}</td>
                    <td><span className="chip">{stage.label}</span></td>
                    <td style={{ textAlign: "right" }} className="text-mono">{count || "—"}</td>
                    <td style={{ textAlign: "right" }} className="text-mono">{count ? AED(totals.subtotal) : "—"}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }} className="text-mono">
                      {totals.budget ? (
                        <span style={{ color: over ? "var(--danger-700)" : "var(--success-700)" }}>
                          {totals.variance > 0 ? "+" : ""}{AED(totals.variance)}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Button variant={count ? "secondary" : "primary"} size="sm" icon={count ? "pencil" : "plus"}
                        onClick={(e) => { e.stopPropagation(); setEditing(p.procId); }}>
                        {count ? "Edit" : "Create"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "28px 0", color: "var(--fg-3)" }}>No procurement requests match.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail pane */}
        {sel && (
          <div className="card" style={{ position: "sticky", top: 16 }}>
            <div className="card-head">
              <div>
                <div className="card-title-lg">{sel.title || sel.procId}</div>
                <div className="card-sub" style={{ fontFamily: "var(--font-mono)" }}>{sel.procId}</div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="icon-btn" title="Full view — entire request as one document" onClick={() => setFullViewFor(sel.procId)}><Icon name="maximize-2" size={16} /></button>
                <button className="icon-btn" title="Close" onClick={() => setSelected(null)}><Icon name="x" size={16} /></button>
              </div>
            </div>
            <div className="card-pad" style={{ paddingTop: 8 }}>
              {/* Meta */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
                {[
                  { lbl: "Project",  val: sel.projectName || "—" },
                  { lbl: "Stage",    val: (STAGE_BY_KEY[sel.currentStage] || {}).label || sel.currentStage || "—" },
                  { lbl: "Vendor",   val: sel.vendor || "Not awarded" },
                  { lbl: "Raised by", val: sel.raisedBy || "—" },
                  { lbl: "Est. value", val: sel.estValue ? AED(sel.estValue) : "—" },
                ].map((r) => (
                  <div key={r.lbl} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span style={{ color: "var(--fg-3)" }}>{r.lbl}</span>
                    <span style={{ fontWeight: 600, textAlign: "right" }}>{r.val}</span>
                  </div>
                ))}
              </div>

              {/* Category breakdown */}
              <div className="eyebrow" style={{ marginBottom: 8 }}>List by category · {(sel.items || []).length} item{(sel.items || []).length !== 1 ? "s" : ""}</div>
              {selCats.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                  {selCats.map((c) => (
                    <div key={c.category} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 7, height: 7, borderRadius: 2, background: "var(--brand-burgundy)", opacity: .65 }} />
                        {c.category}
                      </span>
                      <span className="text-mono" style={{ fontWeight: 600 }}>{AED(c.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "14px 0 18px", color: "var(--fg-3)", fontSize: 12.5 }}>
                  No items yet — create the list to get started.
                </div>
              )}

              {/* Totals */}
              {selCats.length > 0 && (
                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 10, marginBottom: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { lbl: "Subtotal", val: AED(selTotals.subtotal) },
                    { lbl: "VAT",      val: AED(selTotals.vat) },
                    { lbl: "Grand total", val: AED(selTotals.grand), bold: true },
                    ...(selTotals.budget ? [{ lbl: "Budget", val: AED(selTotals.budget) },
                      { lbl: "Variance", val: (selTotals.variance > 0 ? "+" : "") + AED(selTotals.variance),
                        color: selTotals.variance > 0 ? "var(--danger-700)" : "var(--success-700)", bold: true }] : []),
                  ].map((r) => (
                    <div key={r.lbl} style={{ display: "flex", justifyContent: "space-between", fontSize: r.bold ? 13 : 12.5 }}>
                      <span style={{ color: "var(--fg-3)", fontWeight: r.bold ? 600 : 400 }}>{r.lbl}</span>
                      <span className="text-mono" style={{ fontWeight: r.bold ? 700 : 600, color: r.color }}>{r.val}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button variant="primary" icon={(sel.items || []).length ? "pencil" : "plus"} style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setEditing(sel.procId)}>
                {(sel.items || []).length ? "Edit list" : "Create list"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
