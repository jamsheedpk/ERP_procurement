import React from "react";
import { Icon, Avatar, AvatarRow, Chip, Button, IconButton, KPI, Meter, Segmented, Tabs, Card } from "../legacy.jsx";
import "../setup.js";
const { useState: useStateOB, useEffect: useEffectOB, useCallback: useCallbackOB, useMemo: useMemoOB } = React;

const OB_STAGES = [
  { id: "prestart",  label: "Pre-start",     color: "#2563B0", icon: "file-text" },
  { id: "week1",     label: "Week 1",         color: "#D78A14", icon: "calendar-check" },
  { id: "week2",     label: "Week 2",         color: "#534AB7", icon: "users" },
  { id: "settled",   label: "Settled In",     color: "#1F8A52", icon: "check-circle-2" },
];
const OFB_STAGES = [
  { id: "notice",    label: "Notice Period",  color: "#D78A14", icon: "clock" },
  { id: "handover",  label: "Handover",       color: "#2563B0", icon: "file-output" },
  { id: "clearance", label: "Clearance",      color: "#534AB7", icon: "shield-check" },
  { id: "exit",      label: "Exit Done",      color: "#1F8A52", icon: "log-out" },
];
const LLL_STAGES = [
  { id: "approved",   label: "Approved",      color: "#1F8A52", icon: "check-circle-2" },
  { id: "on_leave",   label: "On Leave",       color: "#2563B0", icon: "calendar-off" },
  { id: "returning",  label: "Returning",      color: "#D78A14", icon: "refresh-cw" },
  { id: "reinstated", label: "Reinstated",     color: "#534AB7", icon: "user-check" },
];

const DEFAULT_OB_STEPS = [
  { label: "Send offer letter",           stage: "prestart" },
  { label: "Background check",            stage: "prestart" },
  { label: "ID document collection",      stage: "prestart" },
  { label: "System access request",       stage: "prestart" },
  { label: "Desk & equipment setup",      stage: "prestart" },
  { label: "Orientation session",         stage: "week1" },
  { label: "Meet HR team",                stage: "week1" },
  { label: "Review company handbook",     stage: "week1" },
  { label: "IT setup complete",           stage: "week1" },
  { label: "Badge issued",                stage: "week1" },
  { label: "Meet department team",        stage: "week2" },
  { label: "Role briefing complete",      stage: "week2" },
  { label: "Assign buddy / mentor",       stage: "week2" },
  { label: "First project assigned",      stage: "week2" },
  { label: "Week 2 review & feedback",    stage: "week2" },
  { label: "30-day check-in done",        stage: "settled" },
  { label: "Goals set in system",         stage: "settled" },
  { label: "Benefits enrolled",           stage: "settled" },
  { label: "Training plan agreed",        stage: "settled" },
];
const DEFAULT_OFB_STEPS = [
  { label: "Resignation acknowledged",    stage: "notice" },
  { label: "Exit date confirmed",         stage: "notice" },
  { label: "Notice period tracking",      stage: "notice" },
  { label: "KT document created",         stage: "handover" },
  { label: "Handover meeting done",       stage: "handover" },
  { label: "Knowledge transfer complete", stage: "handover" },
  { label: "Replacement identified",      stage: "handover" },
  { label: "IT assets returned",          stage: "clearance" },
  { label: "System access revoked",       stage: "clearance" },
  { label: "Finance clearance issued",    stage: "clearance" },
  { label: "HR clearance issued",         stage: "clearance" },
  { label: "Exit interview done",         stage: "exit" },
  { label: "Final pay processed",         stage: "exit" },
  { label: "Experience letter issued",    stage: "exit" },
];
const DEFAULT_LLL_STEPS = [
  { label: "Leave request approved",           stage: "approved" },
  { label: "Handover plan created",            stage: "approved" },
  { label: "Backup / cover assigned",          stage: "approved" },
  { label: "Payroll team notified",            stage: "approved" },
  { label: "System access adjusted",           stage: "approved" },
  { label: "Leave tracker updated",            stage: "on_leave" },
  { label: "Monthly check-in scheduled",       stage: "on_leave" },
  { label: "Emergency contact confirmed",      stage: "on_leave" },
  { label: "Benefits continuation confirmed",  stage: "on_leave" },
  { label: "Return date confirmed with manager", stage: "returning" },
  { label: "Return-to-work meeting scheduled", stage: "returning" },
  { label: "IT access reinstated",             stage: "returning" },
  { label: "Desk / workspace prepared",        stage: "returning" },
  { label: "30-day reintegration check-in",    stage: "reinstated" },
  { label: "Goals realigned with manager",     stage: "reinstated" },
  { label: "Payroll fully reinstated",         stage: "reinstated" },
  { label: "Training plan updated",            stage: "reinstated" },
];

// ── Stage step card (master) ───────────────────────────────────────────────────
function StageStepCard({ stage, steps, allDefs, onChange }) {
  const [newStep, setNewStep] = useStateOB("");
  const [editIdx, setEditIdx] = useStateOB(null);
  const [editVal, setEditVal] = useStateOB("");

  const handleAdd = () => {
    const label = newStep.trim();
    if (!label) return;
    onChange([...allDefs, { label, stage: stage.id }]);
    setNewStep("");
  };

  const handleDelete = (step) => {
    onChange(allDefs.filter(d => d !== step));
  };

  const startEdit = (i, step) => { setEditIdx(i); setEditVal(step.label); };

  const handleEditSave = (step) => {
    const label = editVal.trim();
    if (!label) { setEditIdx(null); return; }
    onChange(allDefs.map(d => d === step ? { ...d, label } : d));
    setEditIdx(null);
  };

  const iconBtn = (onClick, icon, color) => (
    <button onClick={onClick} style={{
      width: 26, height: 26, borderRadius: 6, border: "none",
      background: "transparent", cursor: "pointer", display: "flex",
      alignItems: "center", justifyContent: "center", flexShrink: 0,
      color: color || "var(--fg-3)", transition: "background 0.12s",
    }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--ink-100)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <Icon name={icon} size={13} color={color || "var(--fg-3)"} />
    </button>
  );

  return (
    <div className="card" style={{ padding: "16px 18px", borderTop: `3px solid ${stage.color}` }}>
      {/* Stage header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: stage.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={stage.icon} size={15} color={stage.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: stage.color }}>{stage.label}</div>
          <div style={{ fontSize: 11, color: "var(--fg-4)" }}>{steps.length} step{steps.length !== 1 ? "s" : ""}</div>
        </div>
      </div>

      {steps.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--fg-4)", fontStyle: "italic", padding: "4px 0 8px" }}>No steps defined yet</div>
      )}

      {/* Step rows */}
      {steps.map((step, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: stage.color, flexShrink: 0 }} />
          {editIdx === i ? (
            <>
              <input
                className="form-input"
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") handleEditSave(step);
                  if (e.key === "Escape") setEditIdx(null);
                }}
                style={{ flex: 1, fontSize: 12, padding: "3px 8px", height: 28 }}
                autoFocus
              />
              {iconBtn(() => handleEditSave(step), "check", "#1F8A52")}
              {iconBtn(() => setEditIdx(null), "x", "var(--fg-3)")}
            </>
          ) : (
            <>
              <span style={{ flex: 1, fontSize: 12.5, color: "var(--fg-2)" }}>{step.label}</span>
              {iconBtn(() => startEdit(i, step), "edit-2")}
              {iconBtn(() => handleDelete(step), "trash-2", "#C0263A")}
            </>
          )}
        </div>
      ))}

      {/* Add new step row */}
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <input
          className="form-input"
          value={newStep}
          onChange={e => setNewStep(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder={`Add step to ${stage.label}…`}
          style={{ flex: 1, fontSize: 12 }}
        />
        <button
          onClick={handleAdd}
          disabled={!newStep.trim()}
          style={{
            display: "flex", alignItems: "center", gap: 5, padding: "0 12px",
            borderRadius: 8, border: `1px solid ${stage.color}40`,
            background: stage.color + "12", color: stage.color,
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: "var(--font-sans)", opacity: newStep.trim() ? 1 : 0.5,
            whiteSpace: "nowrap",
          }}>
          <Icon name="plus" size={13} color={stage.color} /> Add
        </button>
      </div>
    </div>
  );
}

// ── Steps master panel ─────────────────────────────────────────────────────────
function StepsMaster({ obSteps, ofbSteps, lllSteps, onObChange, onOfbChange, onLllChange }) {
  const [activeType, setActiveType] = useStateOB("onboard");

  const TYPE_MAP = {
    onboard:    { stages: OB_STAGES,  defs: obSteps,  onChange: onObChange,  default: DEFAULT_OB_STEPS  },
    offboard:   { stages: OFB_STAGES, defs: ofbSteps, onChange: onOfbChange, default: DEFAULT_OFB_STEPS },
    longLeave:  { stages: LLL_STAGES, defs: lllSteps, onChange: onLllChange, default: DEFAULT_LLL_STEPS },
  };
  const active = TYPE_MAP[activeType];
  const totalSteps = obSteps.length + ofbSteps.length + lllSteps.length;

  const handleReset = () => {
    if (!window.confirm("Reset to default steps? All customisations will be lost.")) return;
    active.onChange([...active.default]);
  };

  return (
    <div>
      <div className="card" style={{ padding: "18px 22px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: "#2563B015", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="list-checks" size={22} color="#2563B0" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--fg-1)" }}>Steps Master</div>
          <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>
            Define checklist steps for onboarding, offboarding & long leave · {totalSteps} steps total
          </div>
        </div>
        <button onClick={handleReset} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
          borderRadius: 8, border: "1px solid var(--border-subtle)",
          background: "var(--ink-50)", color: "var(--fg-2)", fontSize: 12,
          fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)",
        }}>
          <Icon name="rotate-ccw" size={13} color="var(--fg-3)" /> Reset to defaults
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        {[
          { id: "onboard",   label: "Onboarding",  icon: "door-open",    count: obSteps.length,  color: "#2563B0" },
          { id: "offboard",  label: "Offboarding",  icon: "log-out",      count: ofbSteps.length, color: "#C0263A" },
          { id: "longLeave", label: "Long Leave",   icon: "calendar-off", count: lllSteps.length, color: "#D78A14" },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveType(t.id)} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "8px 16px",
            borderRadius: 9, border: `2px solid ${activeType === t.id ? t.color : "var(--border-subtle)"}`,
            background: activeType === t.id ? t.color + "10" : "var(--bg-surface)",
            color: activeType === t.id ? t.color : "var(--fg-2)",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)",
            transition: "all 0.15s",
          }}>
            <Icon name={t.icon} size={15} color={activeType === t.id ? t.color : "var(--fg-3)"} />
            {t.label}
            <span style={{
              fontSize: 11, padding: "1px 7px", borderRadius: 10,
              background: activeType === t.id ? t.color + "20" : "var(--ink-100)",
              color: activeType === t.id ? t.color : "var(--fg-3)", fontWeight: 700,
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {active.stages.map(stage => (
          <StageStepCard
            key={stage.id}
            stage={stage}
            steps={active.defs.filter(d => d.stage === stage.id)}
            allDefs={active.defs}
            onChange={active.onChange}
          />
        ))}
      </div>
    </div>
  );
}

// ── Add modal ─────────────────────────────────────────────────────────────────
function AddModal({ tab, employees, taskDefs, onClose, onSave }) {
  const defaultStage = tab === "onboard" ? "prestart" : tab === "longLeave" ? "approved" : "notice";
  const [form, setForm] = useStateOB({
    empId: "", name: "", dept: "", role: "",
    stage: defaultStage,
    startDate: "", endDate: "", notes: "",
  });
  const [saving, setSaving] = useStateOB(false);
  const stages     = tab === "onboard" ? OB_STAGES : tab === "longLeave" ? LLL_STAGES : OFB_STAGES;
  const stageOrder = stages.map(s => s.id);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleEmpChange = e => {
    const emp = employees.find(x => x.empId === e.target.value);
    if (emp) {
      setForm(f => ({
        ...f,
        empId:  emp.empId,
        name:   emp.name,
        dept:   emp.dept || "",
        role:   emp.title || emp.role || "",
        avatar: emp.av || { bg: "#F4DDE8", fg: "#6F1947" },
      }));
    } else {
      set("empId", "");
    }
  };

  const handleSave = async () => {
    if (!form.empId) return;
    setSaving(true);
    const stageIdx = stageOrder.indexOf(form.stage);
    const tasks = taskDefs.map(d => ({
      ...d,
      done: stageOrder.indexOf(d.stage) < stageIdx,
    }));
    try {
      const res = await fetch(`${window.API}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: tab, tasks }),
      });
      const doc = await res.json();
      onSave(doc);
      onClose();
    } catch (err) {
      console.error("Add failed:", err);
      setSaving(false);
    }
  };

  const stepsByStage = useMemoOB(() => {
    const m = {};
    stages.forEach(s => { m[s.id] = taskDefs.filter(d => d.stage === s.id); });
    return m;
  }, [taskDefs, stages]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            Add {tab === "onboard" ? "Onboarding" : tab === "longLeave" ? "Long Leave" : "Offboarding"}
          </div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-row">
            <label className="form-label">Employee</label>
            <select className="form-input" value={form.empId} onChange={handleEmpChange}>
              <option value="">Select employee…</option>
              {employees.map(e => (
                <option key={e.empId} value={e.empId}>{e.name} — {e.dept}</option>
              ))}
            </select>
          </div>
          {tab === "longLeave" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-row">
                <label className="form-label">Leave Start</label>
                <input type="date" className="form-input" value={form.startDate}
                  onChange={e => set("startDate", e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Expected Return</label>
                <input type="date" className="form-input" value={form.endDate}
                  onChange={e => set("endDate", e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="form-row">
              <label className="form-label">{tab === "onboard" ? "Start Date" : "Last Day"}</label>
              <input type="date" className="form-input"
                value={tab === "onboard" ? form.startDate : form.endDate}
                onChange={e => tab === "onboard" ? set("startDate", e.target.value) : set("endDate", e.target.value)} />
            </div>
          )}
          <div className="form-row">
            <label className="form-label">Starting Stage</label>
            <select className="form-input" value={form.stage} onChange={e => set("stage", e.target.value)}>
              {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={3} value={form.notes}
              onChange={e => set("notes", e.target.value)} placeholder="Optional notes…"
              style={{ resize: "vertical" }} />
          </div>

          {/* Step preview */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 8 }}>
              Steps that will be created ({taskDefs.length})
            </div>
            <div style={{ background: "var(--ink-50)", borderRadius: 8, padding: "10px 12px", maxHeight: 160, overflowY: "auto" }}>
              {stages.map(s => {
                const sSteps = stepsByStage[s.id] || [];
                if (!sSteps.length) return null;
                return (
                  <div key={s.id} style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: s.color, marginBottom: 3 }}>{s.label}</div>
                    {sSteps.map((step, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11.5, color: "var(--fg-2)" }}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !form.empId}>
            {saving ? "Adding…" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Person card ───────────────────────────────────────────────────────────────
function PersonCard({ person, stages, onTaskToggle, onStageChange, onNoteSave, onDelete }) {
  const [open, setOpen]           = useStateOB(false);
  const [advancing, setAdvancing] = useStateOB(false);
  const [editingNote, setEditNote]= useStateOB(false);
  const [noteVal, setNoteVal]     = useStateOB(person.notes || "");
  const [savingNote, setSavingNote]= useStateOB(false);

  const stageOrder = stages.map(s => s.id);
  const stage  = stages.find(s => s.id === person.stage) || stages[0];
  const curIdx = stageOrder.indexOf(person.stage);

  const progress = person.progress !== undefined
    ? person.progress
    : (person.tasks.length ? Math.round(person.tasks.filter(t => t.done).length / person.tasks.length * 100) : 0);

  const handleAdvance = async () => {
    const nextIdx = curIdx + 1;
    if (nextIdx >= stageOrder.length) return;
    setAdvancing(true);
    await onStageChange(person.boardingId, stageOrder[nextIdx]);
    setAdvancing(false);
  };

  const handleNoteSave = async () => {
    setSavingNote(true);
    await onNoteSave(person.boardingId, noteVal);
    setSavingNote(false);
    setEditNote(false);
  };

  const nextStage = stages[curIdx + 1];
  const dateLabel = person.type === "onboard" ? "Start"
    : person.type === "longLeave" ? "Leave start"
    : "Last day";
  const dateValue = person.startDate || person.endDate || "—";
  const returnDate = person.type === "longLeave" ? (person.endDate || null) : null;

  return (
    <div className="ob-card" style={{ borderTop: `3px solid ${stage.color}` }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <Avatar name={person.name} color={person.avatar} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--fg-1)" }}>{person.name}</div>
          <div style={{ fontSize: 11.5, color: "var(--fg-3)" }}>{person.role} · {person.dept}</div>
          <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2 }}>
            {dateLabel}: <b>{dateValue}</b>
            {returnDate && <span style={{ marginLeft: 10 }}>Return: <b>{returnDate}</b></span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <IconButton icon={open ? "chevron-up" : "chevron-down"} onClick={() => setOpen(o => !o)} />
          <IconButton icon="trash-2" onClick={() => onDelete(person.boardingId)} />
        </div>
      </div>

      {/* Stage journey dots */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12 }}>
        {stages.map((s, i) => {
          const isPast    = i < curIdx;
          const isCurrent = i === curIdx;
          return (
            <React.Fragment key={s.id}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  border: `2px solid ${isCurrent || isPast ? s.color : "var(--border-subtle)"}`,
                  background: isPast ? s.color : isCurrent ? s.color + "25" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}>
                  {isPast    && <Icon name="check" size={9} color="#fff" />}
                  {isCurrent && <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }} />}
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: isCurrent ? s.color : "var(--fg-3)", whiteSpace: "nowrap" }}>
                  {s.label}
                </span>
              </div>
              {i < stages.length - 1 && (
                <div style={{ flex: 1, height: 2, background: isPast ? stage.color : "var(--border-subtle)", marginBottom: 12, minWidth: 8, transition: "background 0.2s" }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{ height: 5, borderRadius: 4, background: "var(--ink-100)", overflow: "hidden", marginTop: 10 }}>
        <div style={{ height: "100%", width: progress + "%", background: stage.color, borderRadius: 4, transition: "width 0.4s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
        <span style={{ fontSize: 11, color: "var(--fg-3)" }}>
          {person.tasks.filter(t => t.done).length}/{person.tasks.length} tasks
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: stage.color }}>{progress}%</span>
      </div>

      {/* Advance button */}
      {nextStage && (
        <button onClick={handleAdvance} disabled={advancing} style={{
          marginTop: 10, width: "100%", padding: "6px 0", borderRadius: 8,
          border: `1px solid ${stage.color}40`, background: stage.color + "12",
          color: stage.color, fontSize: 12, fontWeight: 600, cursor: advancing ? "wait" : "pointer",
          fontFamily: "var(--font-sans)", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 6, transition: "background 0.15s",
        }}>
          <Icon name="arrow-right" size={13} color={stage.color} />
          {advancing ? "Moving…" : `Move to ${nextStage.label}`}
        </button>
      )}

      {/* Expanded detail */}
      {open && (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
          {/* Notes */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)" }}>Notes</span>
              {!editingNote && (
                <button onClick={() => { setNoteVal(person.notes || ""); setEditNote(true); }}
                  style={{ fontSize: 11, color: "var(--brand-burgundy)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600 }}>
                  Edit
                </button>
              )}
            </div>
            {editingNote ? (
              <div>
                <textarea
                  value={noteVal}
                  onChange={e => setNoteVal(e.target.value)}
                  rows={3}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border-subtle)", fontSize: 12.5, fontFamily: "var(--font-sans)", resize: "vertical", boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
                  <button onClick={() => setEditNote(false)}
                    style={{ fontSize: 12, padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border-subtle)", background: "var(--ink-50)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                    Cancel
                  </button>
                  <button onClick={handleNoteSave} disabled={savingNote}
                    style={{ fontSize: 12, padding: "4px 12px", borderRadius: 6, border: "none", background: "var(--brand-burgundy)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, opacity: savingNote ? 0.7 : 1 }}>
                    {savingNote ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: person.notes ? "var(--fg-2)" : "var(--fg-4)", background: "var(--ink-50)", borderRadius: 7, padding: "7px 10px", fontStyle: person.notes ? "italic" : "normal" }}>
                {person.notes || "No notes yet."}
              </div>
            )}
          </div>

          {/* Checklist grouped by stage */}
          {stages.map(s => {
            const sTasks = person.tasks.filter(t => t.stage === s.id);
            if (!sTasks.length) return null;
            return (
              <div key={s.id} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: s.color, marginBottom: 5 }}>{s.label}</div>
                {sTasks.map(t => {
                  const globalIdx = person.tasks.indexOf(t);
                  return (
                    <div key={t.label}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 4px", borderRadius: 6, cursor: "pointer", transition: "background 0.12s" }}
                      onClick={() => onTaskToggle(person.boardingId, globalIdx, !t.done)}>
                      <div style={{
                        width: 16, height: 16, borderRadius: 4,
                        border: `2px solid ${t.done ? s.color : "var(--border-subtle)"}`,
                        background: t.done ? s.color : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s",
                      }}>
                        {t.done && <Icon name="check" size={9} color="#fff" />}
                      </div>
                      <span style={{ fontSize: 12.5, color: t.done ? "var(--fg-3)" : "var(--fg-2)", textDecoration: t.done ? "line-through" : "none" }}>
                        {t.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function OnboardingPage({ data }) {
  const { employees = [] } = data || {};

  const [tab, setTab]         = useStateOB("onboard");
  const [records, setRecords] = useStateOB([]);
  const [loading, setLoading] = useStateOB(true);
  const [showAdd, setShowAdd] = useStateOB(false);
  const [search, setSearch]   = useStateOB("");
  const [stageFilter, setStageFilter] = useStateOB("all");

  // Step definitions — persisted to localStorage
  const [obSteps, setObSteps] = useStateOB(() => {
    try { const s = localStorage.getItem("hrm_ob_steps"); return s ? JSON.parse(s) : DEFAULT_OB_STEPS; }
    catch { return DEFAULT_OB_STEPS; }
  });
  const [ofbSteps, setOfbSteps] = useStateOB(() => {
    try { const s = localStorage.getItem("hrm_ofb_steps"); return s ? JSON.parse(s) : DEFAULT_OFB_STEPS; }
    catch { return DEFAULT_OFB_STEPS; }
  });
  const [lllSteps, setLllSteps] = useStateOB(() => {
    try { const s = localStorage.getItem("hrm_lll_steps"); return s ? JSON.parse(s) : DEFAULT_LLL_STEPS; }
    catch { return DEFAULT_LLL_STEPS; }
  });

  useEffectOB(() => {
    try { localStorage.setItem("hrm_ob_steps",  JSON.stringify(obSteps));  } catch {}
  }, [obSteps]);
  useEffectOB(() => {
    try { localStorage.setItem("hrm_ofb_steps", JSON.stringify(ofbSteps)); } catch {}
  }, [ofbSteps]);
  useEffectOB(() => {
    try { localStorage.setItem("hrm_lll_steps", JSON.stringify(lllSteps)); } catch {}
  }, [lllSteps]);

  const stages = tab === "onboard" ? OB_STAGES : tab === "longLeave" ? LLL_STAGES : OFB_STAGES;
  const currentTaskDefs = tab === "onboard" ? obSteps : tab === "longLeave" ? lllSteps : ofbSteps;

  const fetchRecords = useCallbackOB(async (type) => {
    setLoading(true);
    try {
      const res  = await fetch(`${window.API}/onboarding?type=${type}`);
      const list = await res.json();
      setRecords(Array.isArray(list) ? list : []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffectOB(() => {
    if (tab === "steps") return;
    setSearch("");
    setStageFilter("all");
    fetchRecords(tab);
  }, [tab]);

  const handleTaskToggle = useCallbackOB(async (boardingId, taskIdx, done) => {
    setRecords(prev => prev.map(r => {
      if (r.boardingId !== boardingId) return r;
      const tasks = r.tasks.map((t, i) => i === taskIdx ? { ...t, done } : t);
      const progress = Math.round(tasks.filter(t => t.done).length / tasks.length * 100);
      return { ...r, tasks, progress };
    }));
    try {
      const res = await fetch(`${window.API}/onboarding/${boardingId}/tasks/${taskIdx}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      const updated = await res.json();
      setRecords(prev => prev.map(r => r.boardingId === boardingId ? updated : r));
    } catch { /* keep optimistic */ }
  }, []);

  const handleStageChange = useCallbackOB(async (boardingId, stage) => {
    setRecords(prev => prev.map(r => r.boardingId === boardingId ? { ...r, stage } : r));
    try {
      const res = await fetch(`${window.API}/onboarding/${boardingId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      const updated = await res.json();
      setRecords(prev => prev.map(r => r.boardingId === boardingId ? updated : r));
    } catch { /* keep optimistic */ }
  }, []);

  const handleNoteSave = useCallbackOB(async (boardingId, notes) => {
    try {
      const res = await fetch(`${window.API}/onboarding/${boardingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const updated = await res.json();
      setRecords(prev => prev.map(r => r.boardingId === boardingId ? updated : r));
    } catch { /* ignore */ }
  }, []);

  const handleDelete = useCallbackOB(async (boardingId) => {
    if (!window.confirm("Remove this record?")) return;
    setRecords(prev => prev.filter(r => r.boardingId !== boardingId));
    try {
      await fetch(`${window.API}/onboarding/${boardingId}`, { method: "DELETE" });
    } catch { /* already removed optimistically */ }
  }, []);

  const handleAdd = useCallbackOB((newRecord) => {
    setRecords(prev => [newRecord, ...prev]);
  }, []);

  const stageCounts = useMemoOB(() => {
    const m = {};
    stages.forEach(s => { m[s.id] = records.filter(r => r.stage === s.id).length; });
    return m;
  }, [records, stages]);

  const filtered = useMemoOB(() => {
    let list = records;
    if (stageFilter !== "all") list = list.filter(r => r.stage === stageFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.dept.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q)
      );
    }
    return list;
  }, [records, stageFilter, search]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">People & Culture</div>
          <h1 className="page-title">
            {tab === "steps" ? "Steps Master"
              : tab === "onboard" ? "Onboarding"
              : tab === "longLeave" ? "Long Leave"
              : "Offboarding"}
          </h1>
          <div className="page-sub">
            {tab === "steps"
              ? "Configure checklist steps for onboarding, offboarding & long leave"
              : tab === "longLeave"
              ? "Track employees on extended leave — maternity, medical, sabbatical"
              : "Track new hire journeys and departures"}
          </div>
        </div>
        <div className="row">
          <div className="seg-ctrl">
            <button className={"seg-btn" + (tab === "onboard"   ? " active" : "")} onClick={() => setTab("onboard")}>
              <Icon name="door-open" size={14} /> Onboarding
            </button>
            <button className={"seg-btn" + (tab === "offboard"  ? " active" : "")} onClick={() => setTab("offboard")}>
              <Icon name="log-out" size={14} /> Offboarding
            </button>
            <button className={"seg-btn" + (tab === "longLeave" ? " active" : "")} onClick={() => setTab("longLeave")}>
              <Icon name="calendar-off" size={14} /> Long Leave
            </button>
            <button className={"seg-btn" + (tab === "steps"     ? " active" : "")} onClick={() => setTab("steps")}>
              <Icon name="list-checks" size={14} /> Steps
            </button>
          </div>
          {tab !== "steps" && (
            <Button variant="primary" icon="plus" onClick={() => setShowAdd(true)}>Add</Button>
          )}
        </div>
      </div>

      {/* Steps master view */}
      {tab === "steps" ? (
        <StepsMaster
          obSteps={obSteps}
          ofbSteps={ofbSteps}
          lllSteps={lllSteps}
          onObChange={setObSteps}
          onOfbChange={setOfbSteps}
          onLllChange={setLllSteps}
        />
      ) : (
        <>
          {/* Stage KPI strip */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            {stages.map(s => (
              <div key={s.id} className="card" onClick={() => setStageFilter(f => f === s.id ? "all" : s.id)}
                style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "16px 18px",
                  borderTop: `3px solid ${s.color}`, cursor: "pointer",
                  outline: stageFilter === s.id ? `2px solid ${s.color}` : "none", outlineOffset: 2 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={s.icon} size={17} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--fg-1)" }}>
                    {loading ? "—" : (stageCounts[s.id] || 0)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Search + filter bar */}
          <div className="row" style={{ marginBottom: 20, gap: 10 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
              <Icon name="search" size={14} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                className="form-input"
                style={{ paddingLeft: 32 }}
                placeholder="Search by name, department or role…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {stageFilter !== "all" && (
              <button onClick={() => setStageFilter("all")}
                style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "1px solid var(--brand-burgundy)", background: "var(--plum-50)", color: "var(--brand-burgundy)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                {stages.find(s => s.id === stageFilter)?.label} <Icon name="x" size={11} color="var(--brand-burgundy)" />
              </button>
            )}
          </div>

          {/* Cards */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--fg-3)" }}>
              <div style={{ width: 32, height: 32, border: "3px solid var(--plum-100)", borderTopColor: "var(--brand-burgundy)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--fg-3)" }}>
              <Icon name={tab === "onboard" ? "door-open" : tab === "longLeave" ? "calendar-off" : "log-out"} size={36} />
              <div style={{ marginTop: 12, fontWeight: 600, fontSize: 14 }}>
                {records.length === 0
                  ? `No ${tab === "onboard" ? "onboarding" : tab === "longLeave" ? "long leave" : "offboarding"} records`
                  : "No matches for your search"}
              </div>
              {records.length === 0 && (
                <div style={{ fontSize: 13, marginTop: 4 }}>Click "Add" to create one</div>
              )}
            </div>
          ) : (
            <div className="grid-3" style={{ alignItems: "start" }}>
              {filtered.map(person => (
                <PersonCard
                  key={person.boardingId}
                  person={person}
                  stages={stages}
                  onTaskToggle={handleTaskToggle}
                  onStageChange={handleStageChange}
                  onNoteSave={handleNoteSave}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showAdd && (
        <AddModal
          tab={tab}
          employees={employees}
          taskDefs={currentTaskDefs}
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
        />
      )}
    </div>
  );
}

Object.assign(window, { OnboardingPage });

export default OnboardingPage;
