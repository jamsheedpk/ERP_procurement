import React from "react";
import { Icon, Button } from "../legacy.jsx";
import "../setup.js";
import ProcurementPageDefault, { ItemsPage, QuotesPage, itemsTotals, AED, STAGE_BY_KEY } from "./ProcurementPage.jsx";
const { useState: useStateVQ, useEffect: useEffectVQ, useMemo: useMemoVQ } = React;

/**
 * Vendor Quote Comparison — standalone module. Overview of every request's
 * sourcing state (vendors engaged, categories awarded), drilling into the same
 * QuotesPage comparison editor the lifecycle uses (single source of truth).
 */
export default function VendorQuotesPage() {
  const [procs, setProcs]       = useStateVQ(null);
  const [error, setError]       = useStateVQ(null);
  const [comparing, setComparing] = useStateVQ(null); // procId open in the comparison editor
  const [editingItems, setEditingItems] = useStateVQ(null); // procId open in the BOQ editor (reached from empty comparisons)
  const [q, setQ]               = useStateVQ("");

  const load = () => fetch(`${window.API}/procurement`)
    .then(async (r) => {
      const body = await r.json().catch(() => null);
      if (!r.ok) throw new Error((body && (body.error || body.message)) || `Request failed (${r.status})`);
      return body;
    })
    .then((d) => setProcs(Array.isArray(d) ? d : []))
    .catch((e) => setError(e.message || "Could not load procurement requests."));

  useEffectVQ(() => { load(); }, []);

  const rows = useMemoVQ(() => {
    const list = (procs || []).filter((p) =>
      q === "" || (p.title + " " + p.procId + " " + (p.projectName || "") + " " + (p.vendor || "")).toLowerCase().includes(q.toLowerCase()));
    return list.map((p) => {
      const cats = [...new Set((p.items || []).map((it) => (it.category || "").trim() || "Uncategorised"))];
      const vendors = [...new Set((p.categoryVendors || []).flatMap((cv) => cv.vendors || []))];
      const awards = p.categoryAwards || [];
      return { proc: p, itemCount: (p.items || []).length, cats, vendors, awards, totals: itemsTotals(p.items || []) };
    });
  }, [procs, q]);

  const kpis = useMemoVQ(() => rows.reduce((t, r) => ({
    ready: t.ready + (r.itemCount > 0 ? 1 : 0),
    vendors: t.vendors + r.vendors.length,
    awarded: t.awarded + r.awards.length,
    value: t.value + (r.awards.length ? r.totals.subtotal : 0),
  }), { ready: 0, vendors: 0, awarded: 0, value: 0 }), [rows]);

  // Same payload the lifecycle's handleSaveQuotes sends.
  const handleSaveQuotes = async (procId, payload) => {
    const body = { vendor: payload.vendor || "" };
    if (payload.items)            body.items           = payload.items;
    if (payload.categoryVendors)  body.categoryVendors = payload.categoryVendors;
    if (payload.categoryAwards)   body.categoryAwards  = payload.categoryAwards;
    if (payload.estValue != null) body.estValue        = payload.estValue;
    try {
      const res = await fetch(`${window.API}/procurement/${procId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const doc = await res.json();
      setProcs((prev) => (prev || []).map((p) => (p.procId === procId ? doc : p)));
    } catch (e) { console.error(e); }
    setComparing(null);
  };

  const handleSaveItems = async (procId, items, applyTotal) => {
    const body = applyTotal != null ? { items, estValue: applyTotal } : { items };
    try {
      const res = await fetch(`${window.API}/procurement/${procId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const doc = await res.json();
      setProcs((prev) => (prev || []).map((p) => (p.procId === procId ? doc : p)));
    } catch (e) { console.error(e); }
    setEditingItems(null);
    setComparing(procId); // back to the comparison the items were needed for
  };

  // Quote file attached/removed inside the editor — refresh that request in place.
  const handleUploaded = (doc) => setProcs((prev) => (prev || []).map((p) => (p.procId === doc.procId ? doc : p)));

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

  // BOQ drill-in (comparison needs items first).
  if (editingItems) {
    const proc = procs.find((p) => p.procId === editingItems);
    if (proc) return (
      <ItemsPage proc={proc} onBack={() => { setEditingItems(null); setComparing(editingItems); }}
        onSave={(list, applyTotal) => handleSaveItems(editingItems, list, applyTotal)}
        backLabel="Quote Comparison" crumbLabel={proc.title || proc.procId} backButton="Back to comparison" />
    );
  }

  // Comparison drill-in: the lifecycle's full editor (vendors, rates, awards, files, PDF).
  if (comparing) {
    const proc = procs.find((p) => p.procId === comparing);
    if (proc) return (
      <QuotesPage proc={proc} onBack={() => setComparing(null)}
        onSave={(payload) => handleSaveQuotes(comparing, payload)}
        onUploaded={handleUploaded}
        onManageItems={() => { setComparing(null); setEditingItems(proc.procId); }}
        backLabel="Quote Comparisons" crumbLabel={proc.title || proc.procId} backButton="Back to comparisons" />
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Procurement · Sourcing</div>
          <h1 className="page-title">Vendor Quote Comparison</h1>
          <div className="page-sub">Technical &amp; price comparison per request — engage vendors, capture rates and award categories.</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { lbl: "Ready to compare",   val: `${kpis.ready} / ${rows.length}`, ic: "scale" },
          { lbl: "Vendor engagements", val: kpis.vendors,                     ic: "truck" },
          { lbl: "Categories awarded", val: kpis.awarded,                     ic: "badge-check" },
          { lbl: "Awarded list value", val: kpis.value ? AED(kpis.value) : "—", ic: "banknote" },
        ].map((k) => (
          <div key={k.lbl} className="kpi">
            <div className="lbl">{k.lbl}</div>
            <div className="val">{k.val}</div>
            <div className="ico"><Icon name={k.ic} size={16} stroke={2} /></div>
          </div>
        ))}
      </div>

      {/* Requests table */}
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
              <th style={{ textAlign: "right" }}>Categories</th>
              <th style={{ textAlign: "right" }}>Vendors</th>
              <th>Awarded</th>
              <th style={{ width: 130 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ proc: p, itemCount, cats, vendors, awards }) => {
              const stage = STAGE_BY_KEY[p.currentStage] || { label: p.currentStage || "—" };
              const done = cats.length > 0 && awards.length >= cats.length;
              return (
                <tr key={p.procId} style={{ cursor: itemCount ? "pointer" : "default" }}
                  onClick={() => itemCount && setComparing(p.procId)}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.title || p.procId}</div>
                    <div style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{p.procId}</div>
                  </td>
                  <td>{p.projectName || "—"}</td>
                  <td><span className="chip">{stage.label}</span></td>
                  <td style={{ textAlign: "right" }} className="text-mono">{cats.length || "—"}</td>
                  <td style={{ textAlign: "right" }} className="text-mono">{vendors.length || "—"}</td>
                  <td>
                    {awards.length ? (
                      <span className={"chip " + (done ? "chip-success" : "chip-warning")}>
                        {awards.length}/{cats.length} · {done ? "complete" : "partial"}
                      </span>
                    ) : itemCount ? <span style={{ color: "var(--fg-4)", fontSize: 12 }}>Not started</span>
                      : <span style={{ color: "var(--fg-4)", fontSize: 12 }}>Needs BOQ list</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {itemCount ? (
                      <Button variant={awards.length ? "secondary" : "primary"} size="sm" icon="scale"
                        onClick={(e) => { e.stopPropagation(); setComparing(p.procId); }}>
                        Compare
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" icon="list-checks"
                        onClick={(e) => { e.stopPropagation(); setEditingItems(p.procId); }}>
                        Add items
                      </Button>
                    )}
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
    </div>
  );
}
