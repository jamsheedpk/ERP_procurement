import React from "react";
import { Icon, Button } from "../legacy.jsx";
import "../setup.js";
import ProcurementPageDefault, { ItemsPage, QuotesPage, POPage, PaymentAppPage, AED, STAGE_BY_KEY } from "./ProcurementPage.jsx";
import ProcFullView from "./ProcFullView.jsx";
const { useState: useStatePA, useEffect: useEffectPA, useMemo: useMemoPA } = React;

/**
 * Application for Payment — standalone module. Overview of every request's
 * payment-application state (per awarded vendor), drilling into the same
 * PaymentAppPage editor the lifecycle uses. Missing prerequisites route to the
 * LPO / comparison / BOQ editors without leaving the module.
 */
export default function PaymentApplicationsPage() {
  const [procs, setProcs] = useStatePA(null);
  const [error, setError] = useStatePA(null);
  const [payFor, setPayFor]         = useStatePA(null); // procId open in the payment-app editor
  const [poFor, setPoFor]           = useStatePA(null); // procId open in the LPO editor
  const [comparingFor, setComparingFor] = useStatePA(null);
  const [itemsFor, setItemsFor]     = useStatePA(null);
  const [fullViewFor, setFullViewFor] = useStatePA(null); // procId open in full view
  const [q, setQ] = useStatePA("");

  const load = () => fetch(`${window.API}/procurement`)
    .then(async (r) => {
      const body = await r.json().catch(() => null);
      if (!r.ok) throw new Error((body && (body.error || body.message)) || `Request failed (${r.status})`);
      return body;
    })
    .then((d) => setProcs(Array.isArray(d) ? d : []))
    .catch((e) => setError(e.message || "Could not load procurement requests."));

  useEffectPA(() => { load(); }, []);

  const patch = async (procId, body) => {
    try {
      const res = await fetch(`${window.API}/procurement/${procId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const doc = await res.json();
      setProcs((prev) => (prev || []).map((p) => (p.procId === procId ? doc : p)));
    } catch (e) { console.error(e); }
  };

  const rows = useMemoPA(() => {
    const list = (procs || []).filter((p) =>
      q === "" || (p.title + " " + p.procId + " " + (p.projectName || "") + " " + (p.vendor || "")).toLowerCase().includes(q.toLowerCase()));
    return list.map((p) => ({
      proc: p,
      itemCount: (p.items || []).length,
      awards: p.categoryAwards || [],
      pos: p.purchaseOrders || [],
      apps: p.paymentApplications || [],
      poValue: p.poAmount || (p.purchaseOrders || []).reduce((s, x) => s + (x.total || 0), 0),
    }));
  }, [procs, q]);

  const kpis = useMemoPA(() => rows.reduce((t, r) => ({
    withApps: t.withApps + (r.apps.length > 0 ? 1 : 0),
    apps: t.apps + r.apps.length,
    ready: t.ready + (r.awards.length > 0 && r.apps.length === 0 ? 1 : 0),
    value: t.value + (r.apps.length ? r.poValue : 0),
  }), { withApps: 0, apps: 0, ready: 0, value: 0 }), [rows]);

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

  // Full view — the whole request as one printable document.
  if (fullViewFor) {
    const proc = procs.find((p) => p.procId === fullViewFor);
    if (proc) return <ProcFullView proc={proc} backLabel="Payment Applications" onBack={() => setFullViewFor(null)} />;
  }

  // ── Drill chain (deepest first). Each Back/save returns one level up. ──
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

  if (poFor) {
    const proc = procs.find((p) => p.procId === poFor);
    if (proc) return (
      <POPage proc={proc}
        onBack={() => { setPoFor(null); setPayFor(poFor); }}
        onSave={async (purchaseOrders) => {
          const poAmount = purchaseOrders.reduce((s, x) => s + (x.total || 0), 0);
          await patch(poFor, { purchaseOrders, poAmount });
          setPoFor(null); setPayFor(poFor);
        }}
        onCompare={(p) => { setPoFor(null); setComparingFor(p.procId); }}
        backLabel="Payment Applications" crumbLabel={proc.title || proc.procId} backButton="Back to applications" />
    );
  }

  // Payment application drill-in: the lifecycle's full editor (per-vendor apps, retainage, PDFs).
  if (payFor) {
    const proc = procs.find((p) => p.procId === payFor);
    if (proc) return (
      <PaymentAppPage proc={proc}
        onBack={() => setPayFor(null)}
        onSave={async (paymentApplications) => { await patch(payFor, { paymentApplications }); setPayFor(null); }}
        onIssuePOs={(p) => { setPayFor(null); setPoFor(p.procId); }}
        backLabel="Payment Applications" crumbLabel={proc.title || proc.procId} backButton="Back to applications" />
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Procurement · Payment</div>
          <h1 className="page-title">Application for Payment</h1>
          <div className="page-sub">Progress-payment applications per awarded vendor — contract sums, retainage and current dues.</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { lbl: "Requests with apps", val: `${kpis.withApps} / ${rows.length}`, ic: "file-plus" },
          { lbl: "Applications",       val: kpis.apps,                           ic: "files" },
          { lbl: "Ready to apply",     val: kpis.ready,                          ic: "hourglass" },
          { lbl: "Applied PO value",   val: kpis.value ? AED(kpis.value) : "—",  ic: "banknote" },
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
              <th style={{ textAlign: "right" }}>LPOs</th>
              <th style={{ textAlign: "right" }}>Applications</th>
              <th style={{ textAlign: "right" }}>PO value</th>
              <th>Status</th>
              <th style={{ width: 130 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ proc: p, itemCount, awards, pos, apps, poValue }) => {
              const stage = STAGE_BY_KEY[p.currentStage] || { label: p.currentStage || "—" };
              const ready = awards.length > 0;
              return (
                <tr key={p.procId} style={{ cursor: ready ? "pointer" : "default" }}
                  onClick={() => ready && setPayFor(p.procId)}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.title || p.procId}</div>
                    <div style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{p.procId}</div>
                  </td>
                  <td>{p.projectName || "—"}</td>
                  <td><span className="chip">{stage.label}</span></td>
                  <td style={{ textAlign: "right" }} className="text-mono">{pos.length || "—"}</td>
                  <td style={{ textAlign: "right" }} className="text-mono">{apps.length || "—"}</td>
                  <td style={{ textAlign: "right" }} className="text-mono">{poValue ? AED(poValue) : "—"}</td>
                  <td>
                    {apps.length ? <span className="chip chip-success">Applied</span>
                      : ready ? <span className="chip chip-warning">Ready to apply</span>
                      : itemCount ? <span style={{ color: "var(--fg-4)", fontSize: 12 }}>Needs awards</span>
                      : <span style={{ color: "var(--fg-4)", fontSize: 12 }}>Needs BOQ list</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <button className="icon-btn" title="Full view — entire request as one document"
                        onClick={(e) => { e.stopPropagation(); setFullViewFor(p.procId); }}>
                        <Icon name="maximize-2" size={15} />
                      </button>
                      {ready ? (
                        <Button variant={apps.length ? "secondary" : "primary"} size="sm" icon="file-plus"
                          onClick={(e) => { e.stopPropagation(); setPayFor(p.procId); }}>
                          {apps.length ? "Manage" : "Apply"}
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" icon={itemCount ? "scale" : "list-checks"}
                          onClick={(e) => { e.stopPropagation(); itemCount ? setComparingFor(p.procId) : setItemsFor(p.procId); }}>
                          {itemCount ? "Compare" : "Add items"}
                        </Button>
                      )}
                    </div>
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
