import { useEffect, useState } from "react";
import { API_BASE } from "@meridian/api";

// Pinned demo dates — mirrors the monolith (data lives in May 2026).
const TODAY = new Date(2026, 4, 21);
const FMT_DATE = (d) => {
  const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return d.getDate() + " " + m[d.getMonth()] + " " + d.getFullYear();
};
const j = (path) => fetch(`${API_BASE}${path}`).then(async (r) => {
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error((body && (body.error || body.message)) || `Request failed (${r.status})`);
  return body;
});

/**
 * Builds the shared `DATA` object the HR pages expect (employees, departments,
 * leave, payroll, attendance, …) plus the mutation callbacks — a direct port of
 * the monolith App's central fan-out, scoped to the HR remote.
 */
export function useHrData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // Phase 1 — 4 calls needed to render Employees/Leave/Recruitment immediately.
    Promise.all([
      j("/employees"), j("/departments"), j("/leave-requests"), j("/leave-types"),
    ]).then(([employees, departments, leaveRequests, leaveTypes]) => {
      if (cancelled) return;
      const emps  = employees.map((e) => ({ ...e, id: e.empId }));
      const depts = departments.map((d) => ({ ...d, id: d.deptId }));
      const lvs   = leaveRequests.map((l) => ({ ...l, id: l.leaveId }));
      const types = leaveTypes.map((t) => ({ ...t, id: t.typeId }));
      const base = {
        employees: emps, departments: depts, leaveRequests: lvs, leaveTypes: types,
        openings: [], candidates: [], payrollRun: {}, renewals: [], activity: [],
        attendanceToday: [], weekAttendance: [], headcountTrend: [], monthEvents: [], pendingDocs: [],
        company: {
          name: "Meridian Logistics DMCC", short: "Meridian", headcount: emps.length,
          activeToday: emps.filter((e) => e.status === "active").length,
          onLeave: emps.filter((e) => e.status === "on-leave").length,
          pendingLeaves: lvs.filter((l) => l.status === "pending").length,
          expiringDocs: 0, openRoles: 0, payrollDue: "—", nextPayroll: "—",
        },
        today: TODAY, fmtDate: FMT_DATE,
      };
      setData(base);

      // Phase 2 — remaining 10 calls; update data when they land.
      Promise.all([
        j("/openings"), j("/candidates"), j("/payroll/latest"), j("/renewals"), j("/activity"),
        j("/attendance/today?date=2026-05-21"), j("/attendance/week?date=2026-05-21"),
        j("/headcount/trend"), j("/calendar-events?month=2026-05"), j("/documents?status=pending_signature"),
      ]).then(([openings, candidates, payrollRun, renewals, activity, attendanceToday, weekAttendance, headcountTrend, monthEvents, pendingDocs]) => {
        if (cancelled) return;
        const jobs  = openings.map((o) => ({ ...o, id: o.jobId }));
        const cands = candidates.map((c) => ({ ...c, id: c.candidateId }));
        setData((prev) => prev ? {
          ...prev, openings: jobs, candidates: cands, payrollRun, renewals, activity,
          attendanceToday, weekAttendance, headcountTrend,
          monthEvents, pendingDocs: Array.isArray(pendingDocs) ? pendingDocs : [],
          company: {
            ...prev.company,
            expiringDocs: renewals.filter((r) => r.severity === "danger" || r.severity === "warning").length,
            openRoles: jobs.length,
            payrollDue: payrollRun.runDate || "—",
            nextPayroll: payrollRun.gross ? "AED " + payrollRun.gross.toLocaleString() : "—",
          },
        } : prev);
      }).catch(() => { /* secondary data failure is non-fatal; keep what we have */ });
    }).catch((e) => { if (!cancelled) setError(e.message || "Could not load HR data."); });

    return () => { cancelled = true; };
  }, []);

  // Local optimistic mutations (mirror the monolith App handlers).
  const handleAdd = (type, item) => setData((p) => {
    if (!p) return p;
    switch (type) {
      case "employee":     return { ...p, employees: [...p.employees, { ...item, id: item.empId }] };
      case "leaveRequest": return { ...p, leaveRequests: [...p.leaveRequests, { ...item, id: item.leaveId }] };
      case "opening":      return { ...p, openings: [...p.openings, { ...item, id: item.jobId }] };
      case "candidate":    return { ...p, candidates: [...p.candidates, { ...item, id: item.candidateId }] };
      default:             return p;
    }
  });
  const handleUpdate = (type, item) => setData((p) => {
    if (!p) return p;
    switch (type) {
      case "candidate":  return { ...p, candidates: p.candidates.map((c) => c.candidateId === item.candidateId ? { ...item, id: item.candidateId } : c) };
      case "payrollRun": return { ...p, payrollRun: item };
      case "opening":    return { ...p, openings: p.openings.map((o) => o.jobId === item.jobId ? { ...item, id: item.jobId } : o) };
      default:           return p;
    }
  });
  const handleLeaveStatus = (leave, status) => {
    fetch(`${API_BASE}/leave-requests/${leave.leaveId || leave.id}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    }).then((r) => r.json()).then((updated) => setData((p) => ({
      ...p, leaveRequests: p.leaveRequests.map((l) => (l.leaveId === updated.leaveId || l.id === updated.leaveId) ? { ...updated, id: updated.leaveId } : l),
    }))).catch((e) => console.error("Leave status update failed:", e));
  };
  const upsertEmployee = (updated) => setData((p) => ({ ...p, employees: p.employees.map((e) => e.empId === updated.empId ? { ...updated, id: updated.empId } : e) }));
  const removeEmployee = (empId) => setData((p) => ({ ...p, employees: p.employees.filter((e) => e.empId !== empId) }));

  return { data, error, handleAdd, handleUpdate, handleLeaveStatus, upsertEmployee, removeEmployee };
}
