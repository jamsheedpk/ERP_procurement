import React from "react";
import { Icon, Button } from "../legacy.jsx";
import { downloadElementAsPdf } from "@meridian/ui";
import { itemsTotals, AED, PROC_STAGES, STAGE_BY_KEY, STATUS_META } from "./ProcurementPage.jsx";

const fmtDT = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? String(iso) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

function Section({ icon, title, sub, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Icon name={icon} size={15} color="var(--brand-burgundy)" />
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--fg-1)" }}>{title}</div>
        {sub && <div style={{ fontSize: 11.5, color: "var(--fg-3)" }}>· {sub}</div>}
      </div>
      <div style={{ borderTop: "2px solid var(--brand-burgundy)", paddingTop: 12 }}>{children}</div>
    </div>
  );
}

const th = { textAlign: "left", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--fg-3)", fontWeight: 600, padding: "7px 10px", background: "var(--ink-50)", borderBottom: "1px solid var(--border-subtle)" };
const td = { padding: "7px 10px", fontSize: 12.5, borderBottom: "1px solid var(--border-subtle)", verticalAlign: "top" };
const right = { textAlign: "right", whiteSpace: "nowrap" };

/**
 * Full View — the entire procurement request as one continuous document:
 * summary, lifecycle progress, BOQ, sourcing & awards, LPOs, payment
 * applications, attachments and history, in a single printable page.
 */
export default function ProcFullView({ proc, onBack, backLabel = "Procurement Lifecycle" }) {
  const items  = proc.items || [];
  const totals = itemsTotals(items);
  const st     = STATUS_META[proc.status] || STATUS_META.in_progress;
  const curIdx = PROC_STAGES.findIndex((s) => s.key === proc.currentStage);
  const histByStage = (proc.history || []).reduce((m, h) => { m[h.stage] = h; return m; }, {});
  const awards = proc.categoryAwards || [];
  const awardByCat = {}; awards.forEach((a) => { awardByCat[a.category] = a.vendor; });
  const catVendors = proc.categoryVendors || [];
  const cats = [...new Set([...catVendors.map((c) => c.category), ...items.map((it) => (it.category || "").trim() || "Uncategorised")])];
  const catAmount = {};
  items.forEach((it) => { const k = (it.category || "").trim() || "Uncategorised"; catAmount[k] = (catAmount[k] || 0) + (Number(it.qty) || 0) * (Number(it.unitPrice != null ? it.unitPrice : it.estPrice) || 0); });
  const pos  = proc.purchaseOrders || [];
  const apps = proc.paymentApplications || [];
  const files = proc.quoteFiles || [];
  const FILE_BASE = (window.API || "").replace(/\/api$/, "");

  const meta = [
    { lbl: "Project",       val: proc.projectName || "—" },
    { lbl: "Department",    val: proc.department || "—" },
    { lbl: "Raised by",     val: proc.raisedBy || "—" },
    { lbl: "Priority",      val: proc.priority || "—" },
    { lbl: "Awarded vendor(s)", val: proc.vendor || "Not awarded" },
    { lbl: "Est. value",    val: proc.estValue ? AED(proc.estValue) : "—" },
    { lbl: "PO value",      val: proc.poAmount ? AED(proc.poAmount) : "—" },
    { lbl: "Created",       val: fmtDT(proc.createdAt) },
  ];

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      {/* Head */}
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={onBack} style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
              color: "var(--brand-burgundy)", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600 }}>
              <Icon name="arrow-left" size={13} /> {backLabel}
            </button>
            <span style={{ color: "var(--fg-4)" }}>/</span>
            <span>Full view</span>
          </div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="file-text" size={20} /> {proc.title}
          </h1>
          <div className="page-sub" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "monospace" }}>{proc.procId}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 5, background: st.bg, color: st.color }}>{st.label}</span>
            <span className="chip">{(STAGE_BY_KEY[proc.currentStage] || {}).label || proc.currentStage}</span>
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Button variant="secondary" icon="download"
            onClick={() => downloadElementAsPdf(document.getElementById("fullview-doc"), proc.procId + "-full-view.pdf")}>PDF</Button>
          <Button variant="secondary" icon="printer" onClick={() => window.print()}>Print</Button>
          <Button variant="ghost" icon="arrow-left" onClick={onBack}>Back</Button>
        </div>
      </div>

      <div className="card" id="fullview-doc" style={{ padding: "26px 30px" }}>
        {/* 1 · Summary */}
        <Section icon="info" title="Request summary">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px 22px" }}>
            {meta.map((m) => (
              <div key={m.lbl}>
                <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--fg-3)", fontWeight: 600 }}>{m.lbl}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)", marginTop: 3 }}>{m.val}</div>
              </div>
            ))}
          </div>
          {proc.description && (
            <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.55, background: "var(--ink-50)", borderRadius: 8, padding: "10px 13px" }}>
              {proc.description}
            </div>
          )}
        </Section>

        {/* 2 · Lifecycle progress */}
        <Section icon="git-merge" title="Lifecycle progress" sub={`stage ${Math.max(curIdx + 1, 1)} of ${PROC_STAGES.length}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {PROC_STAGES.map((s, i) => {
              const done = i < curIdx, current = i === curIdx;
              const h = histByStage[s.key];
              return (
                <div key={s.key} style={{ display: "flex", gap: 12, alignItems: "flex-start", position: "relative", paddingBottom: i < PROC_STAGES.length - 1 ? 12 : 0 }}>
                  {i < PROC_STAGES.length - 1 && <div style={{ position: "absolute", left: 11, top: 24, bottom: 0, width: 2, background: done ? "var(--success-500)" : "var(--border-subtle)" }} />}
                  <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    background: done ? "var(--success-500)" : current ? "var(--brand-burgundy)" : "var(--bg-surface)",
                    border: done || current ? "none" : "2px solid var(--border-subtle)", color: done || current ? "#fff" : "var(--fg-4)" }}>
                    <Icon name={done ? "check" : s.icon} size={12} stroke={2.5} />
                  </div>
                  <div style={{ flex: 1, display: "flex", justifyContent: "space-between", gap: 10, minWidth: 0 }}>
                    <div>
                      <span style={{ fontSize: 12.5, fontWeight: current ? 700 : 600, color: current ? "var(--brand-burgundy)" : done ? "var(--fg-1)" : "var(--fg-3)" }}>
                        {i + 1}. {s.label}
                      </span>
                      <span style={{ fontSize: 11.5, color: "var(--fg-4)", marginLeft: 8 }}>{s.action}</span>
                    </div>
                    {h && <div style={{ fontSize: 11, color: "var(--fg-3)", whiteSpace: "nowrap" }}>{h.by} · {fmtDT(h.at)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* 3 · Material & Labour list */}
        <Section icon="list-checks" title="Material & Labour list" sub={items.length ? `${items.length} line item${items.length !== 1 ? "s" : ""}` : "not prepared"}>
          {items.length ? (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={{ ...th, width: 30 }}>#</th><th style={th}>Category</th><th style={th}>Description</th>
                  <th style={th}>Unit</th><th style={{ ...th, ...right }}>Qty</th><th style={{ ...th, ...right }}>Rate</th><th style={{ ...th, ...right }}>Amount</th>
                </tr></thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td style={td}>{i + 1}</td>
                      <td style={td}>{it.category || "—"}</td>
                      <td style={{ ...td, maxWidth: 360 }}>{it.description || "—"}</td>
                      <td style={td}>{it.unit || "—"}</td>
                      <td style={{ ...td, ...right }} className="text-mono">{Number(it.qty) || 0}</td>
                      <td style={{ ...td, ...right }} className="text-mono">{AED(Number(it.unitPrice != null ? it.unitPrice : it.estPrice) || 0)}</td>
                      <td style={{ ...td, ...right }} className="text-mono">{AED((Number(it.qty) || 0) * (Number(it.unitPrice != null ? it.unitPrice : it.estPrice) || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <div style={{ minWidth: 240, display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    { lbl: "Subtotal", val: AED(totals.subtotal) },
                    { lbl: "VAT", val: AED(totals.vat) },
                    { lbl: "Grand total", val: AED(totals.grand), bold: true },
                    ...(totals.budget ? [{ lbl: "Budget", val: AED(totals.budget) },
                      { lbl: "Variance", val: (totals.variance > 0 ? "+" : "") + AED(totals.variance), color: totals.variance > 0 ? "var(--danger-700)" : "var(--success-700)", bold: true }] : []),
                  ].map((r) => (
                    <div key={r.lbl} style={{ display: "flex", justifyContent: "space-between", fontSize: r.bold ? 13 : 12.5 }}>
                      <span style={{ color: "var(--fg-3)", fontWeight: r.bold ? 700 : 400 }}>{r.lbl}</span>
                      <span className="text-mono" style={{ fontWeight: r.bold ? 700 : 600, color: r.color }}>{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : <div style={{ fontSize: 12.5, color: "var(--fg-3)" }}>No items captured yet.</div>}
        </Section>

        {/* 4 · Sourcing & awards */}
        <Section icon="scale" title="Sourcing & awards" sub={awards.length ? `${awards.length}/${cats.length} categor${cats.length === 1 ? "y" : "ies"} awarded` : "not started"}>
          {cats.length && (catVendors.length || awards.length) ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={th}>Category</th><th style={th}>Vendors invited</th><th style={th}>Awarded to</th><th style={{ ...th, ...right }}>List amount</th>
              </tr></thead>
              <tbody>
                {cats.map((c) => {
                  const cv = catVendors.find((x) => x.category === c);
                  return (
                    <tr key={c}>
                      <td style={{ ...td, fontWeight: 600 }}>{c}</td>
                      <td style={td}>{(cv?.vendors || []).join(", ") || "—"}</td>
                      <td style={td}>{awardByCat[c]
                        ? <span className="chip chip-success">{awardByCat[c]}</span>
                        : <span style={{ color: "var(--fg-4)" }}>Pending</span>}</td>
                      <td style={{ ...td, ...right }} className="text-mono">{catAmount[c] ? AED(catAmount[c]) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <div style={{ fontSize: 12.5, color: "var(--fg-3)" }}>No vendor comparison yet.</div>}
        </Section>

        {/* 5 · Purchase orders */}
        <Section icon="file-output" title="Local purchase orders" sub={pos.length ? `${pos.length} LPO${pos.length !== 1 ? "s" : ""} · ${AED(proc.poAmount || pos.reduce((s, x) => s + (x.total || 0), 0))}` : "none issued"}>
          {pos.length ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={th}>PO number</th><th style={th}>Vendor</th><th style={th}>Date</th><th style={th}>Status</th><th style={{ ...th, ...right }}>Total</th>
              </tr></thead>
              <tbody>
                {pos.map((po, i) => (
                  <tr key={i}>
                    <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{po.poNumber || "—"}</td>
                    <td style={td}>{po.vendor || "—"}</td>
                    <td style={td}>{po.date || "—"}</td>
                    <td style={td}><span className="chip">{po.status || "draft"}</span></td>
                    <td style={{ ...td, ...right }} className="text-mono">{AED(po.total || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div style={{ fontSize: 12.5, color: "var(--fg-3)" }}>No purchase orders issued yet.</div>}
        </Section>

        {/* 6 · Payment applications */}
        <Section icon="file-plus" title="Payment applications" sub={apps.length ? `${apps.length} application${apps.length !== 1 ? "s" : ""}` : "none"}>
          {apps.length ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={th}>App no.</th><th style={th}>Vendor</th><th style={th}>Date</th><th style={th}>Status</th>
              </tr></thead>
              <tbody>
                {apps.map((a, i) => (
                  <tr key={i}>
                    <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{a.appNumber || "—"}</td>
                    <td style={td}>{a.vendor || "—"}</td>
                    <td style={td}>{a.dateOfApplication || "—"}</td>
                    <td style={td}><span className="chip">{a.status || "draft"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div style={{ fontSize: 12.5, color: "var(--fg-3)" }}>No payment applications yet.</div>}
        </Section>

        {/* 7 · Attachments */}
        <Section icon="paperclip" title="Attachments" sub={files.length ? `${files.length} file${files.length !== 1 ? "s" : ""}` : "none"}>
          {files.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {files.map((f, i) => (
                <a key={i} href={FILE_BASE + f.url} target="_blank" rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--brand-burgundy)", textDecoration: "none" }}>
                  <Icon name="file-text" size={14} />
                  <span style={{ fontWeight: 600 }}>{f.name || f.url?.split("/").pop()}</span>
                  <span style={{ color: "var(--fg-4)", fontSize: 11.5 }}>{f.category} · {f.vendor}</span>
                </a>
              ))}
            </div>
          ) : <div style={{ fontSize: 12.5, color: "var(--fg-3)" }}>No files attached.</div>}
          {proc.proformaFile && (
            <a href={FILE_BASE + (proc.proformaFile.url || "")} target="_blank" rel="noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--brand-burgundy)", textDecoration: "none", marginTop: 6 }}>
              <Icon name="receipt" size={14} /><span style={{ fontWeight: 600 }}>Proforma invoice</span>
            </a>
          )}
        </Section>

        {/* 8 · History */}
        <Section icon="history" title="History" sub={(proc.history || []).length ? `${proc.history.length} event${proc.history.length !== 1 ? "s" : ""}` : "no events"}>
          {(proc.history || []).length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...proc.history].reverse().map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 12.5, alignItems: "baseline" }}>
                  <span style={{ color: "var(--fg-4)", fontSize: 11.5, whiteSpace: "nowrap", minWidth: 150 }}>{fmtDT(h.at)}</span>
                  <span style={{ fontWeight: 600 }}>{h.label}</span>
                  <span style={{ color: "var(--fg-3)" }}>{h.action}</span>
                  <span style={{ color: "var(--fg-4)", marginLeft: "auto", whiteSpace: "nowrap" }}>{h.by}</span>
                </div>
              ))}
            </div>
          ) : <div style={{ fontSize: 12.5, color: "var(--fg-3)" }}>Nothing recorded yet.</div>}
        </Section>

        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 12, fontSize: 11, color: "var(--fg-4)", display: "flex", justifyContent: "space-between" }}>
          <span>Meridian Logistics DMCC · Procurement</span>
          <span>{proc.procId} · generated {fmtDT(new Date().toISOString())}</span>
        </div>
      </div>
    </div>
  );
}
