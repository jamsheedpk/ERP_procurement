import React from "react";
import { Icon, Button, AED } from "@meridian/ui";
import { PROC_STAGES, PHASE_COLOR, PRIORITY_META, STATUS_META, stageIndex, STAGE_KEYS } from "./stages.js";

export function ProcurementDetail({ proc, onBack }) {
  const curIdx = stageIndex(proc.currentStage);            // correct, module-scoped
  const isDone = proc.status === "completed";
  const st = STATUS_META[proc.status] || STATUS_META.in_progress;
  const pri = PRIORITY_META[proc.priority] || PRIORITY_META.normal;
  const histByStage = (proc.history || []).reduce((m, h) => { m[h.stage] = h; return m; }, {});

  return (
    <div className="proc-page">
      <div className="proc-head">
        <div>
          <button className="proc-back" onClick={onBack}><Icon name="arrow-left" size={13} /> Procurement Lifecycle</button>
          <h1 className="proc-title">{proc.title}</h1>
          <div className="proc-sub">
            <span style={{ fontFamily: "var(--font-mono)" }}>{proc.procId}</span>
            <span className="proc-status" style={{ color: st.color, background: st.bg, marginLeft: 8 }}>{st.label}</span>
          </div>
        </div>
      </div>

      <div className="proc-facts">
        {[["Department", proc.department || "—"], ["Vendor", proc.vendor || "—"], ["Est. Value", AED(proc.estValue)], ["Priority", pri.label]].map(([l, v]) => (
          <div key={l} className="proc-fact"><div className="proc-fact-l">{l}</div><div className="proc-fact-v">{v}</div></div>
        ))}
      </div>

      <div className="proc-stepper-head">Lifecycle · Stage {Math.min(curIdx + 1, STAGE_KEYS.length)} of {STAGE_KEYS.length}</div>
      <div className="proc-stepper">
        {PROC_STAGES.map((stage, i) => {
          const done = i < curIdx || (isDone && i <= curIdx);
          const current = i === curIdx && !isDone;
          const pc = PHASE_COLOR[stage.phase];
          const hist = histByStage[stage.key];
          return (
            <div key={stage.key} className="proc-step">
              {i < PROC_STAGES.length - 1 && <div className="proc-step-line" style={{ background: done ? "#1F8A52" : "var(--ink-100)" }} />}
              <div className="proc-step-dot" style={{
                background: done ? "#1F8A52" : current ? pc + "1A" : "var(--ink-50)",
                border: current ? `2px solid ${pc}` : done ? "none" : "1px solid var(--ink-200)",
              }}>
                {done ? <Icon name="check" size={14} color="#fff" stroke={3} />
                  : current ? <Icon name={stage.icon} size={13} color={pc} />
                  : <Icon name="lock" size={12} color="var(--fg-4)" />}
              </div>
              <div className="proc-step-body" style={{ opacity: done || current ? 1 : 0.6 }}>
                <div className="proc-step-title">
                  {i + 1}. {stage.label}
                  <span className="proc-step-phase" style={{ color: pc, background: pc + "15" }}>{stage.phase}</span>
                </div>
                {hist && (
                  <div className="proc-step-hist">✓ Signed off{hist.by ? " by " + hist.by : ""}{hist.note ? " — " + hist.note : ""}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 18 }}><Button variant="ghost" icon="arrow-left" onClick={onBack}>Back to list</Button></div>
    </div>
  );
}
