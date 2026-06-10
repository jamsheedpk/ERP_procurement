import React, { useMemo, useState } from "react";
import { Icon, KPI, AED } from "@meridian/ui";
import { STAGE_BY_KEY, PHASE_COLOR, PRIORITY_META, STATUS_META, stageIndex, STAGE_KEYS } from "./stages.js";

export function ProcurementList({ items, onOpen }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const kpi = useMemo(() => ({
    total: items.length,
    inProgress: items.filter((p) => p.status === "in_progress").length,
    completed: items.filter((p) => p.status === "completed").length,
    value: items.reduce((s, p) => s + (p.estValue || 0), 0),
  }), [items]);

  const rows = useMemo(() => items.filter((p) => {
    if (status !== "all" && p.status !== status) return false;
    if (q) {
      const t = q.toLowerCase();
      return [p.title, p.procId, p.vendor, p.projectName].some((v) => (v || "").toLowerCase().includes(t));
    }
    return true;
  }), [items, q, status]);

  return (
    <div className="proc-page">
      <div className="proc-head">
        <div>
          <div className="proc-eyebrow">Procurement</div>
          <h1 className="proc-title">Procurement Lifecycle</h1>
          <div className="proc-sub">{kpi.total} requests · {kpi.inProgress} in progress · {kpi.completed} completed</div>
        </div>
      </div>

      <div className="proc-kpis">
        <KPI label="Total Requests" value={kpi.total} icon="layers" />
        <KPI label="In Progress" value={kpi.inProgress} sub="active" icon="loader" color="#2563B0" />
        <KPI label="Completed" value={kpi.completed} sub="delivered" icon="check-circle" color="#1F8A52" />
        <KPI label="Pipeline Value" value={AED(kpi.value)} icon="wallet" color="#9A6A11" />
      </div>

      <div className="proc-toolbar">
        <div className="proc-search">
          <Icon name="search" size={14} color="var(--fg-3)" />
          <input placeholder="Search title, ID, vendor…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="proc-filters">
          {["all", "in_progress", "completed", "on_hold", "cancelled"].map((s) => (
            <button key={s} className={"proc-filter" + (status === s ? " proc-filter--on" : "")} onClick={() => setStatus(s)}>
              {s === "all" ? "All" : (STATUS_META[s] || {}).label || s}
            </button>
          ))}
        </div>
      </div>

      <div className="proc-card">
        <table className="proc-table">
          <thead>
            <tr><th>Request</th><th>Stage</th><th>Vendor</th><th style={{ textAlign: "right" }}>Est. Value</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const stage = STAGE_BY_KEY[p.currentStage] || PROC_FALLBACK;
              const pc = PHASE_COLOR[stage.phase] || "var(--fg-3)";
              const pri = PRIORITY_META[p.priority] || PRIORITY_META.normal;
              const st = STATUS_META[p.status] || STATUS_META.in_progress;
              const n = stageIndex(p.currentStage) + 1;
              return (
                <tr key={p.procId} className="proc-row" onClick={() => onOpen(p.procId)}>
                  <td>
                    <div className="proc-row-title">{p.title}</div>
                    <div className="proc-row-id">{p.procId} · <span style={{ color: pri.color }}>{pri.label}</span></div>
                  </td>
                  <td>
                    <span className="proc-stage" style={{ color: pc, background: pc + "18" }}>
                      <Icon name={stage.icon} size={11} />{n}. {stage.label}
                    </span>
                  </td>
                  <td className="proc-cell-muted">{p.vendor || "—"}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{AED(p.estValue)}</td>
                  <td><span className="proc-status" style={{ color: st.color, background: st.bg }}>{st.label}</span></td>
                  <td><Icon name="chevron-right" size={15} color="var(--fg-4)" /></td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="proc-empty">No requests match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="proc-foot-note">Stage count source of truth: {STAGE_KEYS.length} stages · module-scoped (no global collisions).</div>
    </div>
  );
}

const PROC_FALLBACK = { label: "Enquiry", icon: "search", phase: "Initiation" };
