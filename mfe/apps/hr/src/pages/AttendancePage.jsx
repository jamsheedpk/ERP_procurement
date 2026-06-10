import React from "react";
import { Icon, Avatar, AvatarRow, Chip, Button, IconButton, KPI, Meter, Segmented, Tabs, Card } from "../legacy.jsx";
import "../setup.js";
const { useState: useStateA, useEffect: useEffectA, useCallback: useCallbackA, useMemo: useMemoA } = React;

const API_BASE = window.API || "http://localhost:5000/api";

const ATT_STATUS_META = {
  present: { label: "Present",  color: "#1F8A52", icon: "check-circle-2" },
  late:    { label: "Late",     color: "#D78A14", icon: "alarm-clock" },
  wfh:     { label: "WFH",      color: "#2563B0", icon: "monitor" },
  leave:   { label: "On leave", color: "#B61B54", icon: "calendar-x" },
  absent:  { label: "No-show",  color: "#C0263A", icon: "x-circle" },
};

const WEEK_LEGEND = [
  { key: "Present", color: "#1F8A52" },
  { key: "WFH",     color: "#2563B0" },
  { key: "Leave",   color: "#B61B54" },
  { key: "No-show", color: "#C0263A" },
];

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(isoStr) {
  const d = new Date(isoStr + "T00:00:00");
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtShort(isoStr) {
  const d = new Date(isoStr + "T00:00:00");
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}
function addDays(isoStr, n) {
  const d = new Date(isoStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── Mark Attendance Modal ─────────────────────────────────────────────────────
function MarkModal({ employees, date, existingRecords, onClose, onSave }) {
  const [empId, setEmpId]   = useStateA("");
  const [status, setStatus] = useStateA("present");
  const [clockIn, setClockIn] = useStateA("09:00");
  const [notes, setNotes]   = useStateA("");
  const [saving, setSaving] = useStateA(false);

  const emp = employees.find(e => e.empId === empId);

  const handleSave = async () => {
    if (!empId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/attendance/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date, empId,
          name:     emp?.name || "",
          dept:     emp?.dept || "",
          role:     emp?.title || emp?.role || "",
          status,
          clockIn:  ["present","late"].includes(status) ? clockIn : "",
          clockOut: "",
          hoursWorked: "",
          location: emp?.location || "",
          notes,
          avatar:   emp?.av || { bg: "#F4DDE8", fg: "#6F1947" },
        }),
      });
      const doc = await res.json();
      onSave(doc);
      onClose();
    } catch (err) {
      console.error("Mark attendance failed:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--bg-surface)", borderRadius: 16, padding: 28, width: 440, boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Mark Attendance</div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{fmtShort(date)}</div>
          </div>
          <IconButton icon="x" onClick={onClose} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", display: "block", marginBottom: 5 }}>Employee</label>
            <select style={{ width: "100%", height: 36, padding: "0 10px", borderRadius: 8, border: "1px solid var(--border-subtle)", fontSize: 13, fontFamily: "var(--font-sans)" }}
              value={empId} onChange={e => setEmpId(e.target.value)}>
              <option value="">Select employee…</option>
              {employees.map(e => (
                <option key={e.empId} value={e.empId}>{e.name} — {e.dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", display: "block", marginBottom: 8 }}>Status</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {Object.entries(ATT_STATUS_META).map(([key, meta]) => (
                <button key={key}
                  onClick={() => setStatus(key)}
                  style={{
                    padding: "8px 6px", borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-sans)",
                    border: `2px solid ${status === key ? meta.color : "var(--border-subtle)"}`,
                    background: status === key ? meta.color + "15" : "var(--ink-50)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    transition: "all 0.15s",
                  }}>
                  <Icon name={meta.icon} size={16} color={status === key ? meta.color : "var(--fg-3)"} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: status === key ? meta.color : "var(--fg-3)" }}>{meta.label}</span>
                </button>
              ))}
            </div>
          </div>

          {["present","late"].includes(status) && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", display: "block", marginBottom: 5 }}>Clock-in time</label>
              <input type="time" value={clockIn} onChange={e => setClockIn(e.target.value)}
                style={{ width: "100%", height: 36, padding: "0 10px", borderRadius: 8, border: "1px solid var(--border-subtle)", fontSize: 13, fontFamily: "var(--font-sans)" }} />
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", display: "block", marginBottom: 5 }}>Notes (optional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Doctor appointment, client site…"
              style={{ width: "100%", height: 36, padding: "0 10px", borderRadius: 8, border: "1px solid var(--border-subtle)", fontSize: 13, fontFamily: "var(--font-sans)" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
          <button onClick={onClose} style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid var(--border-subtle)", background: "var(--ink-50)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !empId}
            style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: "var(--brand-burgundy)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)", opacity: saving || !empId ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SVG Donut ─────────────────────────────────────────────────────────────────
function DonutRing({ segments, total }) {
  const size = 160, sw = 28;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  const arcs = segments.map(sg => {
    const dash = total > 0 ? (sg.v / total) * circ : 0;
    const arc = { ...sg, dash, offset: acc };
    acc += dash;
    return arc;
  });
  return (
    <div className="att-donut">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--ink-100)" strokeWidth={sw} />
        {arcs.map((arc, i) => (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={arc.c} strokeWidth={sw}
            strokeDasharray={`${arc.dash} ${circ - arc.dash}`} strokeDashoffset={-arc.offset} />
        ))}
      </svg>
      <div className="att-donut-center">
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--fg-1)", lineHeight: 1 }}>{total}</div>
        <div style={{ fontSize: 10, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginTop: 3 }}>total</div>
      </div>
    </div>
  );
}

// ── Week bar chart ────────────────────────────────────────────────────────────
function WeekBarChart({ week, todayLabel }) {
  const maxTotal = Math.max(...week.map(d => d.segments.reduce((s, sg) => s + (sg.value || 0), 0)), 1);
  return (
    <div className="att-week-chart">
      {week.map((day, i) => {
        const total = day.segments.reduce((s, sg) => s + (sg.value || 0), 0);
        const hPct = (total / maxTotal) * 100;
        const isToday = day.label === todayLabel;
        return (
          <div key={i} className="att-week-col">
            <div className="att-week-val">{total > 0 ? total : ""}</div>
            <div className="att-week-bar-wrap">
              <div className={"att-week-bar" + (isToday ? " att-week-bar--today" : "")} style={{ height: `${hPct}%` }}>
                {total > 0 && day.segments.map((sg, j) => (
                  <div key={j} style={{ flex: sg.value, background: sg.color, minHeight: sg.value > 0 ? 1 : 0 }}
                    title={`${sg.key}: ${sg.value}`} />
                ))}
              </div>
            </div>
            <div className={"att-week-day" + (isToday ? " att-week-day--today" : "")}>{day.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function AttendancePage({ data }) {
  const { employees = [] } = data || {};

  const TODAY_ISO = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useStateA(TODAY_ISO);
  const [records, setRecords]           = useStateA([]);
  const [weekData, setWeekData]         = useStateA(data?.weekAttendance || []);
  const [loading, setLoading]           = useStateA(true);
  const [weekLoading, setWeekLoading]   = useStateA(false);
  const [statusFilter, setStatusFilter] = useStateA("all");
  const [search, setSearch]             = useStateA("");
  const [showMark, setShowMark]         = useStateA(false);
  const [attPage,     setAttPage]     = useStateA(1);
  const [attPageSize, setAttPageSize] = useStateA(10);

  // Fetch per-employee records for selected date — auto-seeds full roster if needed
  const fetchRecords = useCallbackA(async (date) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/attendance/init-day`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const list = await res.json();
      setRecords(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch attendance records:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch week bar chart data
  const fetchWeek = useCallbackA(async (date) => {
    setWeekLoading(true);
    try {
      const res = await fetch(`${API_BASE}/attendance/week?date=${date}`);
      const wk = await res.json();
      if (Array.isArray(wk) && wk.length > 0) setWeekData(wk);
    } catch (err) {
      console.error("Failed to fetch week data:", err);
    } finally {
      setWeekLoading(false);
    }
  }, []);

  useEffectA(() => {
    fetchRecords(selectedDate);
    fetchWeek(selectedDate);
  }, [selectedDate]);

  const navigate = (delta) => setSelectedDate(d => addDays(d, delta));

  // Derived stats from records
  const statusCounts = useMemoA(() => {
    const m = { present: 0, late: 0, wfh: 0, leave: 0, absent: 0 };
    records.forEach(r => { if (m[r.status] !== undefined) m[r.status]++; });
    return m;
  }, [records]);

  const donutSegments = useMemoA(() => {
    const COLOR = { present: "#1F8A52", late: "#D78A14", wfh: "#2563B0", leave: "#B61B54", absent: "#C0263A" };
    const LABEL = { present: "Present", late: "Late", wfh: "WFH", leave: "On leave", absent: "No-show" };
    return Object.entries(statusCounts).filter(([, v]) => v > 0).map(([k, v]) => ({ lbl: LABEL[k], v, c: COLOR[k] }));
  }, [statusCounts]);

  const deptBreakdown = useMemoA(() => {
    const m = {};
    records.forEach(r => {
      if (!m[r.dept]) m[r.dept] = { dept: r.dept, present: 0, late: 0, wfh: 0, leave: 0, absent: 0, total: 0 };
      const d = m[r.dept]; d.total++;
      if (d[r.status] !== undefined) d[r.status]++;
    });
    return Object.values(m).sort((a, b) => b.total - a.total);
  }, [records]);

  const filtered = useMemoA(() => {
    const q = search.toLowerCase();
    return records.filter(r =>
      (statusFilter === "all" || r.status === statusFilter) &&
      (!q || r.name.toLowerCase().includes(q) || r.dept.toLowerCase().includes(q) || r.empId.toLowerCase().includes(q))
    );
  }, [records, statusFilter, search]);

  useEffectA(() => { setAttPage(1); }, [statusFilter, search, selectedDate, attPageSize]);

  const attTotalPages  = Math.max(1, Math.ceil(filtered.length / attPageSize));
  const attSafePage    = Math.min(attPage, attTotalPages);
  const attStart       = (attSafePage - 1) * attPageSize;
  const attPageRows    = filtered.slice(attStart, attStart + attPageSize);
  const attNavBtn      = (dis) => ({ width:30, height:30, borderRadius:7, border:"1px solid var(--border-subtle)", background:"var(--bg-surface)", cursor:dis?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:dis?0.4:1 });
  const attPageButtons = useMemoA(() => {
    if (attTotalPages <= 7) return Array.from({ length: attTotalPages }, (_, i) => i + 1);
    const left  = Math.max(2, attSafePage - 2);
    const right = Math.min(attTotalPages - 1, attSafePage + 2);
    const r = [1];
    if (left > 2) r.push("...");
    for (let i = left; i <= right; i++) r.push(i);
    if (right < attTotalPages - 1) r.push("...");
    if (attTotalPages > 1) r.push(attTotalPages);
    return r;
  }, [attTotalPages, attSafePage]);

  const donutTotal    = donutSegments.reduce((s, sg) => s + sg.v, 0);
  const presentCount  = statusCounts.present + statusCounts.late + statusCounts.wfh;
  const rateOverall   = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

  // Today's day label for week chart highlight
  const todayLabel = (() => {
    const d = new Date(selectedDate + "T00:00:00");
    return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
  })();

  // When a record is saved via the modal, upsert into records state
  const handleRecordSaved = useCallbackA((doc) => {
    setRecords(prev => {
      const idx = prev.findIndex(r => r.recordId === doc.recordId);
      if (idx >= 0) return prev.map((r, i) => i === idx ? doc : r);
      return [...prev, doc].sort((a, b) => a.name.localeCompare(b.name));
    });
  }, []);

  // Inline status update
  const handleStatusChange = useCallbackA(async (recordId, newStatus) => {
    setRecords(prev => prev.map(r => r.recordId === recordId ? { ...r, status: newStatus } : r));
    try {
      await fetch(`${API_BASE}/attendance/records/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Status update failed:", err);
    }
  }, []);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Time · Attendance</div>
          <h1 className="page-title">Attendance</h1>
          <div className="page-sub">
            {fmtDate(selectedDate)} · {loading ? "Loading…" : `${records.length} employees · ${rateOverall}% attendance rate`}
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <IconButton icon="chevron-left" onClick={() => navigate(-1)} title="Previous day" />
          <button style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)", color: "var(--fg-1)" }}>
            {fmtShort(selectedDate)}
          </button>
          <IconButton icon="chevron-right" onClick={() => navigate(1)} title="Next day" />
          <Button variant="secondary" icon="download">Export</Button>
          <Button variant="primary" icon="clock" onClick={() => setShowMark(true)}>Mark Attendance</Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="att-kpi-row" style={{ marginBottom: 20 }}>
        {Object.entries(ATT_STATUS_META).map(([key, meta]) => {
          const cnt = statusCounts[key] || 0;
          const pct = records.length > 0 ? Math.round((cnt / records.length) * 100) : 0;
          const isActive = statusFilter === key;
          return (
            <div key={key} className="kpi att-kpi"
              style={{ cursor: "pointer", borderTop: `3px solid ${isActive ? meta.color : "transparent"}`, boxShadow: isActive ? `var(--shadow-md), 0 0 0 1px ${meta.color}33` : undefined }}
              onClick={() => setStatusFilter(isActive ? "all" : key)}>
              <div className="lbl">{meta.label}</div>
              <div className="val" style={{ color: meta.color }}>{loading ? "—" : cnt}</div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{pct}% of workforce</div>
              <div className="ico" style={{ background: meta.color + "18", color: meta.color }}>
                <Icon name={meta.icon} size={16} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.65fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Weekly bar */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title-lg">Weekly attendance</div>
              <div className="card-sub">Mon – Sun · current week</div>
            </div>
            <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
              {WEEK_LEGEND.map(lt => (
                <span key={lt.key} className="att-legend-item">
                  <span className="att-legend-dot" style={{ background: lt.color }} />{lt.key}
                </span>
              ))}
            </div>
          </div>
          <div className="card-pad">
            {weekLoading
              ? <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-3)", fontSize: 13 }}>Loading…</div>
              : <WeekBarChart week={weekData} todayLabel={todayLabel} />
            }
          </div>
        </div>

        {/* Today's donut */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title-lg">Day breakdown</div>
              <div className="card-sub">{fmtShort(selectedDate)} · {donutTotal} employees</div>
            </div>
          </div>
          <div className="card-pad">
            {loading
              ? <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-3)", fontSize: 13 }}>Loading…</div>
              : (
                <div className="att-donut-wrap">
                  <DonutRing segments={donutSegments} total={donutTotal} />
                  <div className="att-donut-legend">
                    {donutSegments.map((sg, i) => (
                      <div key={i} className="att-donut-legend-row">
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: sg.c, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 12.5, color: "var(--fg-2)" }}>{sg.lbl}</span>
                        <span className="text-mono" style={{ fontSize: 13, fontWeight: 700, color: sg.c }}>{sg.v}</span>
                        <span className="muted" style={{ fontSize: 11, minWidth: 34, textAlign: "right" }}>
                          {donutTotal > 0 ? Math.round((sg.v / donutTotal) * 100) : 0}%
                        </span>
                      </div>
                    ))}
                    {donutSegments.length === 0 && !loading && (
                      <div style={{ color: "var(--fg-3)", fontSize: 12 }}>No records for this date</div>
                    )}
                  </div>
                </div>
              )
            }
          </div>
        </div>
      </div>

      {/* Department breakdown */}
      {deptBreakdown.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-head">
            <div>
              <div className="card-title-lg">Department breakdown</div>
              <div className="card-sub">Attendance across all departments · {fmtShort(selectedDate)}</div>
            </div>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Department</th>
                <th style={{ textAlign: "center" }}>Total</th>
                <th style={{ textAlign: "center", color: ATT_STATUS_META.present.color }}>Present</th>
                <th style={{ textAlign: "center", color: ATT_STATUS_META.late.color }}>Late</th>
                <th style={{ textAlign: "center", color: ATT_STATUS_META.wfh.color }}>WFH</th>
                <th style={{ textAlign: "center", color: ATT_STATUS_META.leave.color }}>Leave</th>
                <th style={{ textAlign: "center", color: ATT_STATUS_META.absent.color }}>Absent</th>
                <th style={{ minWidth: 140 }}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {deptBreakdown.map(d => {
                const here = d.present + d.late + d.wfh;
                const rate = d.total > 0 ? Math.round((here / d.total) * 100) : 0;
                const rateColor = rate >= 90 ? ATT_STATUS_META.present.color : rate >= 75 ? ATT_STATUS_META.late.color : ATT_STATUS_META.absent.color;
                return (
                  <tr key={d.dept}>
                    <td style={{ fontWeight: 600 }}>{d.dept}</td>
                    <td className="cell-mono" style={{ textAlign: "center" }}>{d.total}</td>
                    <td className="cell-mono" style={{ textAlign: "center", color: ATT_STATUS_META.present.color, fontWeight: 600 }}>{d.present}</td>
                    <td className="cell-mono" style={{ textAlign: "center", color: ATT_STATUS_META.late.color }}>{d.late || "—"}</td>
                    <td className="cell-mono" style={{ textAlign: "center", color: ATT_STATUS_META.wfh.color }}>{d.wfh || "—"}</td>
                    <td className="cell-mono" style={{ textAlign: "center", color: ATT_STATUS_META.leave.color }}>{d.leave || "—"}</td>
                    <td className="cell-mono" style={{ textAlign: "center", color: ATT_STATUS_META.absent.color }}>{d.absent || "—"}</td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <div className="meter" style={{ flex: 1 }}>
                          <span style={{ width: `${rate}%`, background: rateColor }} />
                        </div>
                        <span className="text-mono" style={{ fontSize: 12, fontWeight: 700, color: rateColor, minWidth: 32, textAlign: "right" }}>{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee roster */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title-lg">Employee roster</div>
            <div className="card-sub">{filtered.length} of {records.length} employees</div>
          </div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex" }}>
              <Icon name="search" size={14} color="var(--fg-4)" />
            </span>
            <input className="fi" style={{ paddingLeft: 32, width: 210, height: 32, fontSize: 13 }}
              placeholder="Search employees…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Status filter pills */}
        <div className="att-status-filter">
          <button className={"att-filter-btn" + (statusFilter === "all" ? " att-filter-btn--active" : "")}
            onClick={() => setStatusFilter("all")}>
            All <span className="att-filter-ct">{records.length}</span>
          </button>
          {Object.entries(ATT_STATUS_META).map(([key, meta]) => {
            const isActive = statusFilter === key;
            return (
              <button key={key}
                className={"att-filter-btn" + (isActive ? " att-filter-btn--active" : "")}
                style={isActive ? { background: meta.color + "18", color: meta.color, borderColor: meta.color + "55" } : {}}
                onClick={() => setStatusFilter(isActive ? "all" : key)}>
                <span className="att-filter-dot" style={{ background: meta.color }} />
                {meta.label}
                <span className="att-filter-ct">{statusCounts[key]}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "var(--fg-3)" }}>
            <div style={{ width: 28, height: 28, border: "3px solid var(--plum-100)", borderTopColor: "var(--brand-burgundy)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
            Loading records…
          </div>
        ) : (
          <>
          <table className="tbl">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Status</th>
                <th>Clock-in</th>
                <th>Clock-out</th>
                <th>Hours</th>
                <th>Location</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {attPageRows.map(rec => {
                const meta = ATT_STATUS_META[rec.status] || ATT_STATUS_META.absent;
                return (
                  <tr key={rec.recordId} style={{ opacity: rec.status === "absent" ? 0.65 : 1 }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar name={rec.name} color={rec.avatar} size={28} />
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)" }}>{rec.name}</div>
                          <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{rec.empId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="cell-muted">{rec.dept}</td>
                    <td>
                      {/* Inline status selector */}
                      <select
                        value={rec.status}
                        onChange={e => handleStatusChange(rec.recordId, e.target.value)}
                        style={{
                          padding: "3px 8px", borderRadius: 6, border: `1px solid ${meta.color}40`,
                          background: meta.color + "15", color: meta.color, fontSize: 11.5,
                          fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)",
                        }}>
                        {Object.entries(ATT_STATUS_META).map(([k, m]) => (
                          <option key={k} value={k}>{m.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="cell-mono">
                      {rec.clockIn
                        ? <span style={{ color: rec.status === "late" ? ATT_STATUS_META.late.color : "var(--fg-2)" }}>{rec.clockIn}</span>
                        : <span className="muted">—</span>}
                    </td>
                    <td className="cell-mono">
                      {rec.clockOut ? <span>{rec.clockOut}</span> : <span className="muted">—</span>}
                    </td>
                    <td className="cell-mono">
                      {rec.hoursWorked ? <span>{rec.hoursWorked}h</span> : <span className="muted">—</span>}
                    </td>
                    <td className="cell-muted">{rec.location || "—"}</td>
                    <td>
                      <IconButton icon="edit-2" title="Edit" onClick={() => setShowMark(true)} />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "48px 20px", color: "var(--fg-3)" }}>
                    <div><Icon name="users" size={28} color="var(--ink-300)" /></div>
                    <div style={{ marginTop: 8, fontSize: 13 }}>No records match the current filter</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filtered.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderTop:"1px solid var(--border-subtle)", flexWrap:"wrap", gap:8 }}>
              <div style={{ fontSize:12.5, color:"var(--fg-3)" }}>
                {attStart+1}–{Math.min(attStart+attPageSize, filtered.length)} of {filtered.length} employees
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:12, color:"var(--fg-3)" }}>Rows</span>
                <select value={attPageSize} onChange={e => { setAttPageSize(Number(e.target.value)); setAttPage(1); }}
                  style={{ height:28, fontSize:12, padding:"0 6px", borderRadius:6, border:"1px solid var(--border-subtle)", background:"var(--bg-surface)" }}>
                  {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <div style={{ display:"flex", gap:4 }}>
                  <button onClick={() => setAttPage(1)} disabled={attSafePage===1} style={attNavBtn(attSafePage===1)}><span style={{fontSize:12}}>«</span></button>
                  <button onClick={() => setAttPage(attSafePage-1)} disabled={attSafePage===1} style={attNavBtn(attSafePage===1)}><span style={{fontSize:12}}>‹</span></button>
                  {attPageButtons.map((b,i) => b==="..." ? (
                    <span key={"e"+i} style={{width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"var(--fg-3)"}}>…</span>
                  ) : (
                    <button key={b} onClick={() => setAttPage(b)} style={{width:30,height:30,borderRadius:7,border:"1px solid var(--border-subtle)",cursor:"pointer",fontSize:12,fontWeight:b===attSafePage?700:400,background:b===attSafePage?"#2563B0":"var(--bg-surface)",color:b===attSafePage?"#fff":"var(--fg-1)"}}>
                      {b}
                    </button>
                  ))}
                  <button onClick={() => setAttPage(attSafePage+1)} disabled={attSafePage===attTotalPages} style={attNavBtn(attSafePage===attTotalPages)}><span style={{fontSize:12}}>›</span></button>
                  <button onClick={() => setAttPage(attTotalPages)} disabled={attSafePage===attTotalPages} style={attNavBtn(attSafePage===attTotalPages)}><span style={{fontSize:12}}>»</span></button>
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {showMark && (
        <MarkModal
          employees={employees}
          date={selectedDate}
          existingRecords={records}
          onClose={() => setShowMark(false)}
          onSave={handleRecordSaved}
        />
      )}
    </div>
  );
}

Object.assign(window, { AttendancePage });

export default AttendancePage;
