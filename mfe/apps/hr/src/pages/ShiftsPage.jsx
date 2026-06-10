import React from "react";
import { Icon, Avatar, AvatarRow, Chip, Button, IconButton, KPI, Meter, Segmented, Tabs, Card } from "../legacy.jsx";
import "../setup.js";
const { useState: useStateSH, useMemo: useMemoSH, useEffect: useEffectSH, useCallback: useCallbackSH } = React;

const SHIFT_TYPES = {
  morning: { label: "Morning",  time: "06:00 – 14:00", color: "#D78A14", bg: "#FEF3C7", icon: "sunrise"    },
  day:     { label: "Day",      time: "09:00 – 18:00", color: "#2563B0", bg: "#EFF6FF", icon: "sun"        },
  evening: { label: "Evening",  time: "14:00 – 22:00", color: "#534AB7", bg: "#EDE9FE", icon: "sunset"     },
  night:   { label: "Night",    time: "22:00 – 06:00", color: "#1E293B", bg: "#F1F5F9", icon: "moon"       },
  off:     { label: "Day Off",  time: "—",             color: "#A89DA3", bg: "#F3F4F6", icon: "circle-off"  },
  leave:   { label: "On Leave", time: "—",             color: "#B61B54", bg: "#FFF1F2", icon: "calendar-x" },
};

const DAYS   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function computeWeekDates(offset) {
  const today = new Date();
  const dow = today.getDay();                          // 0 = Sun
  const toMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(today);
  mon.setHours(0, 0, 0, 0);
  mon.setDate(today.getDate() + toMon + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function fmtWeekLabel(dates) {
  if (!dates.length) return "";
  const s = new Date(dates[0] + "T00:00:00");
  const e = new Date(dates[6] + "T00:00:00");
  if (s.getMonth() === e.getMonth())
    return `${s.getDate()}–${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
  return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
}

// ── Shift type picker popover ─────────────────────────────────────────────────
function ShiftPicker({ current, pos, onSelect, onClose }) {
  const W = typeof window !== "undefined" ? window.innerWidth  : 1200;
  const H = typeof window !== "undefined" ? window.innerHeight : 800;
  const popW = 200;
  const popH = 300; // approximate height of picker
  const safeX = Math.min(pos.x, W - popW - 8);
  const safeY = pos.y + 6 + popH > H ? pos.y - popH - 6 : pos.y + 6;
  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={onClose} />
      <div style={{
        position: "fixed", left: safeX, top: safeY, zIndex: 999,
        background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
        borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", padding: 6, minWidth: popW,
      }}>
        {Object.entries(SHIFT_TYPES).map(([key, s]) => (
          <button key={key} onClick={() => onSelect(key)} style={{
            display: "flex", alignItems: "center", gap: 9, width: "100%",
            padding: "7px 10px", borderRadius: 8, border: "none",
            background: key === current ? s.bg : "transparent",
            cursor: "pointer", fontFamily: "var(--font-sans)", textAlign: "left",
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: s.bg, border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={s.icon} size={13} color={s.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: key === current ? 700 : 500, color: s.color }}>{s.label}</div>
              <div style={{ fontSize: 10.5, color: "var(--fg-4)" }}>{s.time}</div>
            </div>
            {key === current && <Icon name="check" size={13} color={s.color} />}
          </button>
        ))}
      </div>
    </>
  );
}

// ── Assign Shift modal ────────────────────────────────────────────────────────
function AssignModal({ employees, defaultDate, onSave, onClose }) {
  const [form, setForm] = useStateSH({ empId: "", date: defaultDate, type: "day" });
  const [saving, setSaving] = useStateSH(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.empId) return;
    const emp = employees.find(e => e.empId === form.empId);
    if (!emp) return;
    setSaving(true);
    try {
      const res = await fetch(`${window.API}/shifts/${form.empId}/${form.date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:    form.type,
          empName: emp.name,
          dept:    emp.dept || "",
          role:    emp.title || emp.role || "",
          avatar:  emp.av || {},
        }),
      });
      onSave(await res.json());
      onClose();
    } catch { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontSize: 16, fontWeight: 700 }}>Assign Shift</div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-row">
            <label className="form-label">Employee</label>
            <select className="form-input" value={form.empId} onChange={e => set("empId", e.target.value)}>
              <option value="">Select employee…</option>
              {employees.filter(e => e.status !== "inactive").map(e => (
                <option key={e.empId} value={e.empId}>{e.name} — {e.dept}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={form.date} onChange={e => set("date", e.target.value)} />
          </div>
          <div className="form-row">
            <label className="form-label">Shift Type</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 4 }}>
              {Object.entries(SHIFT_TYPES).map(([key, s]) => (
                <label key={key} onClick={() => set("type", key)} style={{
                  display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                  padding: "7px 10px", borderRadius: 8,
                  background: form.type === key ? s.bg : "transparent",
                  border: `1px solid ${form.type === key ? s.color + "50" : "transparent"}`,
                }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${s.color}`, background: form.type === key ? s.color : "transparent", flexShrink: 0 }} />
                  <Icon name={s.icon} size={13} color={s.color} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: s.color }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: "var(--fg-4)" }}>{s.time}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !form.empId}>
            {saving ? "Saving…" : "Assign"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function ShiftsPage() {
  const [employees, setEmployees]     = useStateSH([]);
  const [shifts, setShifts]           = useStateSH([]);
  const [loading, setLoading]         = useStateSH(true);
  const [weekOffset, setWeekOffset]   = useStateSH(0);
  const [filterDept, setFilterDept]   = useStateSH("all");
  const [activeCell, setActiveCell]   = useStateSH(null);  // { empId, date, x, y, current, emp }
  const [saving, setSaving]           = useStateSH({});     // { "empId|date": true }
  const [showAdd, setShowAdd]         = useStateSH(false);

  const weekDates = computeWeekDates(weekOffset);
  const todayStr  = new Date().toISOString().slice(0, 10);

  useEffectSH(() => {
    const dates = computeWeekDates(weekOffset);
    setLoading(true);
    Promise.all([
      fetch(`${window.API}/employees`).then(r => r.json()),
      fetch(`${window.API}/shifts?from=${dates[0]}&to=${dates[6]}`).then(r => r.json()),
    ]).then(([emps, shs]) => {
      setEmployees(Array.isArray(emps) ? emps : []);
      setShifts(Array.isArray(shs) ? shs : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [weekOffset]);

  const shiftMap = useMemoSH(() => {
    const m = {};
    shifts.forEach(s => { m[`${s.empId}|${s.date}`] = s.type; });
    return m;
  }, [shifts]);

  const depts = useMemoSH(() => {
    const seen = new Set();
    employees.forEach(e => { if (e.dept) seen.add(e.dept); });
    return [...seen].sort();
  }, [employees]);

  const filtered = useMemoSH(() => {
    let list = employees.filter(e => e.status !== "inactive");
    if (filterDept !== "all") list = list.filter(e => e.dept === filterDept);
    return list;
  }, [employees, filterDept]);

  const grouped = useMemoSH(() => {
    const map = {};
    filtered.forEach(e => {
      const d = e.dept || "Other";
      if (!map[d]) map[d] = [];
      map[d].push(e);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const filteredIds = useMemoSH(() => new Set(filtered.map(e => e.empId)), [filtered]);

  const shiftSummary = useMemoSH(() => {
    const counts = { morning: 0, day: 0, evening: 0, night: 0, off: 0, leave: 0 };
    shifts.filter(s => filteredIds.has(s.empId))
          .forEach(s => { if (counts[s.type] !== undefined) counts[s.type]++; });
    return counts;
  }, [shifts, filteredIds]);

  const handleCellClick = useCallbackSH((e, emp, date) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const current = shiftMap[`${emp.empId}|${date}`] || (emp.status === "on-leave" ? "leave" : "day");
    setActiveCell({ empId: emp.empId, date, x: rect.left, y: rect.bottom, current, emp });
  }, [shiftMap]);

  const handleShiftSelect = useCallbackSH(async (type) => {
    if (!activeCell) return;
    const { empId, date, emp } = activeCell;
    const key = `${empId}|${date}`;
    setActiveCell(null);

    // Optimistic update
    setShifts(prev => {
      const idx = prev.findIndex(s => s.empId === empId && s.date === date);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], type };
        return copy;
      }
      return [...prev, {
        shiftId: `SHF-${empId}-${date}`, empId, date, type,
        empName: emp.name, dept: emp.dept || "", role: emp.title || emp.role || "", avatar: emp.av || {},
      }];
    });

    setSaving(s => ({ ...s, [key]: true }));
    try {
      const res = await fetch(`${window.API}/shifts/${empId}/${date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, empName: emp.name, dept: emp.dept || "",
          role: emp.title || emp.role || "", avatar: emp.av || {},
        }),
      });
      const doc = await res.json();
      setShifts(prev => prev.map(s => (s.empId === empId && s.date === date) ? doc : s));
    } catch { /* keep optimistic */ }
    finally {
      setSaving(s => { const n = { ...s }; delete n[key]; return n; });
    }
  }, [activeCell]);

  const handleAssignSave = useCallbackSH((doc) => {
    setShifts(prev => {
      const idx = prev.findIndex(s => s.empId === doc.empId && s.date === doc.date);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = doc; return copy; }
      return [...prev, doc];
    });
  }, []);

  const weekLabel  = fmtWeekLabel(weekDates);
  const isCurrWeek = weekOffset === 0;
  const defaultDate = weekDates.includes(todayStr) ? todayStr : weekDates[0] || todayStr;

  return (
    <div className="page">
      {activeCell && (
        <ShiftPicker
          current={activeCell.current}
          pos={{ x: activeCell.x, y: activeCell.y }}
          onSelect={handleShiftSelect}
          onClose={() => setActiveCell(null)}
        />
      )}
      {showAdd && (
        <AssignModal
          employees={employees}
          defaultDate={defaultDate}
          onSave={handleAssignSave}
          onClose={() => setShowAdd(false)}
        />
      )}

      <div className="page-head">
        <div>
          <div className="eyebrow">Time</div>
          <h1 className="page-title">Shift & Schedule</h1>
          <div className="page-sub">Weekly roster — {weekLabel}</div>
        </div>
        <div className="row">
          <div className="row" style={{ gap: 4 }}>
            <IconButton icon="chevron-left"  onClick={() => setWeekOffset(w => w - 1)} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-2)", minWidth: 86, textAlign: "center" }}>
              {isCurrWeek ? "This week" : weekOffset < 0 ? `${Math.abs(weekOffset)}w ago` : `+${weekOffset}w`}
            </span>
            <IconButton icon="chevron-right" onClick={() => setWeekOffset(w => w + 1)} />
          </div>
          {!isCurrWeek && (
            <Button variant="secondary" icon="rotate-ccw" onClick={() => setWeekOffset(0)}>Today</Button>
          )}
          <Button variant="primary" icon="plus" onClick={() => setShowAdd(true)}>Assign Shift</Button>
        </div>
      </div>

      {/* Legend strip */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {Object.entries(SHIFT_TYPES).map(([key, s]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: s.bg, border: `1px solid ${s.color}30` }}>
            <Icon name={s.icon} size={13} color={s.color} />
            <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
            <span style={{ fontSize: 11, color: s.color, opacity: 0.65 }}>{s.time}</span>
          </div>
        ))}
      </div>

      {/* Dept filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["all", ...depts].map(d => (
          <button key={d} className={"pill-btn" + (filterDept === d ? " active" : "")} onClick={() => setFilterDept(d)}>
            {d === "all" ? "All Departments" : d}
          </button>
        ))}
      </div>

      {/* ── Roster grid ── */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>

        {/* Header row */}
        <div className="shift-grid-head">
          <div className="shift-emp-col" style={{ borderRight: "1px solid var(--border-subtle)", padding: "10px 16px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)" }}>Employee</span>
          </div>
          {weekDates.map((date, i) => {
            const d = new Date(date + "T00:00:00");
            const isToday = date === todayStr;
            return (
              <div key={date} className="shift-day-col" style={{
                textAlign: "center", padding: "10px 4px",
                background:   isToday ? "var(--plum-50)"        : "transparent",
                borderBottom: isToday ? "2px solid var(--brand-burgundy)" : "none",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: isToday ? "var(--brand-burgundy)" : "var(--fg-3)" }}>{DAYS[i]}</div>
                <div style={{ fontSize: 11.5, fontWeight: 600,                           color: isToday ? "var(--brand-burgundy)" : "var(--fg-2)" }}>
                  {d.getDate()} {MONTHS[d.getMonth()]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "52px 0", color: "var(--fg-3)" }}>
            <div style={{ width: 28, height: 28, border: "3px solid var(--plum-100)", borderTopColor: "var(--brand-burgundy)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
            Loading roster…
          </div>
        ) : (
          <>
            {grouped.map(([dept, emps]) => (
              <React.Fragment key={dept}>
                {/* Dept subheader */}
                <div style={{ padding: "6px 16px", background: "var(--ink-50)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--fg-3)" }}>{dept}</span>
                </div>

                {emps.map(emp => (
                  <div key={emp.empId} className="shift-grid-row">
                    {/* Employee cell */}
                    <div className="shift-emp-col">
                      <Avatar name={emp.name} color={emp.av} size={26} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{emp.name}</div>
                        <div style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{emp.title || emp.role}</div>
                      </div>
                    </div>

                    {/* Shift cells */}
                    {weekDates.map((date) => {
                      const key     = `${emp.empId}|${date}`;
                      const type    = shiftMap[key] ?? (emp.status === "on-leave" ? "leave" : null);
                      const sh      = type ? SHIFT_TYPES[type] : null;
                      const isToday = date === todayStr;
                      const isBusy  = !!saving[key];
                      const isOpen  = activeCell?.empId === emp.empId && activeCell?.date === date;

                      return (
                        <div key={date} className="shift-day-col shift-cell"
                          style={{ background: isToday ? "var(--plum-50)" : "transparent", cursor: "pointer" }}
                          onClick={e => handleCellClick(e, emp, date)}>
                          {isBusy ? (
                            <div style={{ width: 14, height: 14, border: "2px solid var(--plum-100)", borderTopColor: "var(--brand-burgundy)", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "auto" }} />
                          ) : sh ? (
                            <div style={{
                              padding: "4px 5px", borderRadius: 6, textAlign: "center",
                              background: isOpen ? sh.color + "28" : sh.bg,
                              border: `1px solid ${sh.color}${isOpen ? "60" : "28"}`,
                              fontSize: 10, fontWeight: 700, color: sh.color,
                              whiteSpace: "nowrap", transition: "all 0.1s",
                            }}>
                              {sh.label}
                            </div>
                          ) : (
                            <div style={{ textAlign: "center", fontSize: 14, color: "var(--fg-4)", lineHeight: 1 }}>+</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </React.Fragment>
            ))}

            {filtered.length === 0 && (
              <div style={{ padding: "52px 0", textAlign: "center", color: "var(--fg-3)" }}>
                <Icon name="calendar-cog" size={32} />
                <div style={{ marginTop: 10, fontWeight: 600 }}>No employees match the filter</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Summary footer ── */}
      {!loading && filtered.length > 0 && (
        <div className="grid-4" style={{ marginTop: 24 }}>
          {[
            { label: "Day shifts",    count: shiftSummary.day + shiftSummary.morning,   color: "#2563B0", icon: "sun"        },
            { label: "Evening/Night", count: shiftSummary.evening + shiftSummary.night, color: "#534AB7", icon: "moon"       },
            { label: "On leave",      count: shiftSummary.leave,                         color: "#B61B54", icon: "calendar-x" },
            { label: "Days off",      count: shiftSummary.off,                           color: "#A89DA3", icon: "circle-off" },
          ].map(s => (
            <div key={s.label} className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px" }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={s.icon} size={18} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{s.count}</div>
                <div style={{ fontSize: 11.5, color: "var(--fg-3)" }}>{s.label} this week</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ShiftsPage });

export default ShiftsPage;
