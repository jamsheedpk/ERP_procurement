import React from "react";
import { Icon, Button } from "../legacy.jsx";
import "../setup.js";
import ProcurementPageDefault, { ItemsPage, QuotesPage, POPage, itemsTotals, AED, STAGE_BY_KEY } from "./ProcurementPage.jsx";
const { useState: useStatePO, useEffect: useEffectPO, useMemo: useMemoPO } = React;

/**
 * Local Purchase Orders — standalone module. Overview of every request's LPO
 * state (awarded vendors → POs issued → value), drilling into the same POPage
 * editor the lifecycle uses. Prerequisite gaps route to the comparison / BOQ
 * editors without leaving the module.
 */
export default function PurchaseOrdersPage() {
  const [procs, setProcs] = useStatePO(null);
  const [error, setError] = useStatePO(null);
  const [poFor, setPoFor]           = useStatePO(null); // procId open in the PO editor
  const [comparingFor, setComparingFor] = useStatePO(null); // procId open in quote comparison
  const [itemsFor, setItemsFor]     = useStatePO(null); // procId open in the BOQ editor
  const [q, setQ] = useStatePO("");

  const load = () => fetch(`${window.API}/procurement`)
    .then(async (r) => {
      const body = await r.json().catch(() => null);
      if (!r.ok) throw new Error((body && (body.error || body.message)) || `Request failed (${r.status})`);
      return body;
    })
    .then((d) => setProcs(Array.isArray(d) ? d : []))
    .catch((e) => setError(e.message || "Could not load procurement requests."));

  useEffectPO(() => { load(); }, []);

  const patch = async (procId, body) => {
    try {
      const res = await fetch(`${window.API}/procurement/${procId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const doc = await res.json();
      setProcs((prev) => (prev || []).map((p) => (p.procId === procId ? doc : p)));
    } catch (e) { console.error(e); }
  };

  const rows = useMemoPO(() => {
    const list = (procs || []).filter((p) =>
      q === "" || (p.title + " " + p.procId + " " + (p.projectName || "") + " " + (p.vendor || "")).toLowerCase().includes(q.toLowerCase()));
    return list.map((p) => {
      const pos = p.purchaseOrders || [];
      return {
        proc: p,
        itemCount: (p.items || []).length,
        awards: p.categoryAwards || [],
        pos,
        poValue: p.poAmount || pos.reduce((s, x) => s + (x.total || 0), 0),
      };
    });
  }, [procs, q]);

  const kpis = useMemoPO(() => rows.reduce((t, r) => ({
    issued: t.issued + r.pos.length,
    withPOs: t.withPOs + (r.pos.length > 0 ? 1 : 0),
    awaiting: t.awaiting + (r.awards.length > 0 && r.pos.length === 0 ? 1 : 0),
    value: t.value + r.poValue,
  }), { issued: 0, withPOs: 0, awaiting: 0, value: 0 }), [rows]);

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

  // BOQ drill-in (deepest level — reached from an empty comparison).
  if (itemsFor) {
    const proc = procs.find((p) => p.procId === itemsFor);
    if (proc) return (
      <ItemsPage proc={proc}
        onBack={() => { setItemsFor(null); setComparingFor(itemsFor); }}
        onSave={async (list, applyTotal) => {
          await patch(itemsFor, applyTotal != null ? { items: list, estValue: applyTotal } : { items: list });
          setItemsFor(null); setComparingFor(itemsFor);
        }}
        backLabel="Quote Comparison" crumbLabel={proc.title || proc.procId} backButton="Back to comparison" />
    );
  }

  // Comparison drill-in (POs are built on awarded categories).
  if (comparingFor) {
    const proc = procs.find((p) => p.procId === comparingFor);
    if (proc) return (
      <QuotesPage proc={proc}
        onBack={() => { setComparingFor(null); setPoFor(comparingFor); }}
        onSave={async (payload) => {
          const body = { vendor: payload.vendor || "" };
          if (payload.items)            body.items           = payload.items;
          if (payload.categoryVendors)  body.categoryVendors = payload.categoryVendors;
          if (payload.categoryAwards)   body.categoryAwards  = payload.categoryAwards;
          if (payload.estValue != null) body.estValue        = payload.estValue;
          await patch(comparingFor, body);
          setComparingFor(null); setPoFor(comparingFor);
        }}
        onUploaded={(doc) => setProcs((prev) => (prev || []).map((p) => (p.procId === doc.procId ? doc : p)))}
        onManageItems={() => { setComparingFor(null); setItemsFor(proc.procId); }}
        backLabel="Purchase Orders" crumbLabel={proc.title || proc.procId} backButton="Back to orders" />
    );
  }

  // PO drill-in: the lifecycle's full LPO editor (per-vendor POs, summary PDF).
  if (poFor) {
    const proc = procs.find((p) => p.procId === poFor);
    if (proc) return (
      <POPage proc={proc}
        onBack={() => setPoFor(null)}
        onSave={async (purchaseOrders) => {
          const poAmount = purchaseOrders.reduce((s, x) => s + (x.total || 0), 0);
          await patch(poFor, { purchaseOrders, poAmount });
          setPoFor(null);
        }}
        onCompare={(p) => { setPoFor(null); setComparingFor(p.procId); }}
        backLabel="Purchase Orders" crumbLabel={proc.title || proc.procId} backButton="Back to orders" />
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Procurement · Ordering</div>
          <h1 className="page-title">Local Purchase Orders</h1>
          <div className="page-sub">One LPO per awarded vendor — issue, value and download purchase orders per request.</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { lbl: "Requests with LPOs", val: `${kpis.withPOs} / ${rows.length}`, ic: "file-output" },
          { lbl: "LPOs issued",        val: kpis.issued,                        ic: "files" },
          { lbl: "Awaiting LPO",       val: kpis.awaiting,                      ic: "hourglass" },
          { lbl: "Committed value",    val: kpis.value ? AED(kpis.value) : "—", ic: "banknote" },
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
              <th style={{ textAlign: "right" }}>Awarded vendors</th>
              <th style={{ textAlign: "right" }}>LPOs</th>
              <th style={{ textAlign: "right" }}>PO value</th>
              <th>Status</th>
              <th style={{ width: 130 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ proc: p, itemCount, awards, pos, poValue }) => {
              const stage = STAGE_BY_KEY[p.currentStage] || { label: p.currentStage || "—" };
              const awardedVendors = [...new Set(awards.map((a) => a.vendor))];
              const ready = awards.length > 0;
              return (
                <tr key={p.procId} style={{ cursor: ready ? "pointer" : "default" }}
                  onClick={() => ready && setPoFor(p.procId)}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.title || p.procId}</div>
                    <div style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{p.procId}</div>
                  </td>
                  <td>{p.projectName || "—"}</td>
                  <td><span className="chip">{stage.label}</span></td>
                  <td style={{ textAlign: "right" }} className="text-mono">{awardedVendors.length || "—"}</td>
                  <td style={{ textAlign: "right" }} className="text-mono">{pos.length || "—"}</td>
                  <td style={{ textAlign: "right" }} className="text-mono">{poValue ? AED(poValue) : "—"}</td>
                  <td>
                    {pos.length ? <span className="chip chip-success">Issued</span>
                      : ready ? <span className="chip chip-warning">Awaiting LPO</span>
                      : itemCount ? <span style={{ color: "var(--fg-4)", fontSize: 12 }}>Needs awards</span>
                      : <span style={{ color: "var(--fg-4)", fontSize: 12 }}>Needs BOQ list</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {ready ? (
                      <Button variant={pos.length ? "secondary" : "primary"} size="sm" icon="file-output"
                        onClick={(e) => { e.stopPropagation(); setPoFor(p.procId); }}>
                        {pos.length ? "Manage" : "Issue"}
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" icon={itemCount ? "scale" : "list-checks"}
                        onClick={(e) => { e.stopPropagation(); itemCount ? setComparingFor(p.procId) : setItemsFor(p.procId); }}>
                        {itemCount ? "Compare" : "Add items"}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "28px 0", color: "var(--fg-3)" }}>No procurement requests match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
