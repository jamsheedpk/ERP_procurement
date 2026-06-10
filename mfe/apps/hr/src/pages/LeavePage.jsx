import React from "react";
import { Icon, Avatar, AvatarRow, Chip, Button, IconButton, KPI, Meter, Segmented, Tabs, Card } from "../legacy.jsx";
import "../setup.js";
const {
  useState:    useStateL,
  useMemo:     useMemoL,
  useEffect:   useEffectL,
  useCallback: useCallbackL,
} = React;

function LeavePage({ data, onApprove, onDecline, onAdd }) {
  const { employees = [], company = {} } = data || {};

  // ── Self-fetched data ──
  const [requests,     setRequests]     = useStateL([]);
  const [types,        setTypes]        = useStateL([]);
  const [monthEvents,  setMonthEvents]  = useStateL({});
  const [loading,      setLoading]      = useStateL(true);
  const [currentMonth, setCurrentMonth] = useStateL("2026-05");

  // ── UI state ──
  const [tab,        setTab]        = useStateL("pending");
  const [selectedId, setSelectedId] = useStateL(null);
  const [search,     setSearch]     = useStateL("");
  const [typeFilter, setTypeFilter] = useStateL("all");
  const [deptFilter, setDeptFilter] = useStateL("all");
  const [showModal,  setShowModal]  = useStateL(false);
  const [actioning,  setActioning]  = useStateL(null);

  // ── Initial fetch ──
  useEffectL(() => {
    Promise.all([
      fetch(`${API}/leave-requests`).then(r => r.json()),
      fetch(`${API}/leave-types`).then(r => r.json()),
      fetch(`${API}/calendar-events?month=${currentMonth}`).then(r => r.json()),
    ]).then(([reqs, tps, evts]) => {
      const norm = reqs.map(r => ({ ...r, id: r.leaveId }));
      setRequests(norm);
      setTypes(tps.map(t => ({ ...t, id: t.typeId || t.id })));
      setMonthEvents(evts || {});
      const first = norm.find(r => r.status === "pending");
      setSelectedId(first ? first.leaveId : null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // ── Refetch calendar when month changes ──
  useEffectL(() => {
    if (loading) return;
    fetch(`${API}/calendar-events?month=${currentMonth}`)
      .then(r => r.json())
      .then(evts => setMonthEvents(evts || {}))
      .catch(() => setMonthEvents({}));
  }, [currentMonth]);

  const changeMonth = (delta) => setCurrentMonth(prev => {
    const [y, m] = prev.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // ── Leave type helpers ──
  const ltMap = useMemoL(() => {
    const m = {};
    types.forEach(t => { m[t.typeId || t.id] = t; });
    return m;
  }, [types]);

  const typeColor = (type) => ltMap[type]?.color || "#A89DA3";
  const typeIcon  = (type) => ltMap[type]?.icon  || "calendar-off";

  // ── Counts ──
  const counts = useMemoL(() => ({
    pending:  requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    declined: requests.filter(r => r.status === "declined").length,
  }), [requests]);

  // ── Unique depts ──
  const uniqueDepts = useMemoL(() =>
    [...new Set(requests.map(r => r.dept).filter(Boolean))].sort(),
    [requests]
  );

  // ── Filtered list ──
  const list = useMemoL(() => requests.filter(r => {
    if (r.status !== tab) return false;
    if (search && !(r.emp + " " + r.dept).toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (deptFilter !== "all" && r.dept !== deptFilter) return false;
    return true;
  }), [requests, tab, search, typeFilter, deptFilter]);

  // ── Selected leave ──
  const selected = useMemoL(() =>
    requests.find(r => r.leaveId === selectedId) || null,
    [requests, selectedId]
  );

  // ── Real leave balance from employee record ──
  const empBalance = useMemoL(() => {
    if (!selected) return null;
    const emp = employees.find(e => e.empId === selected.empId);
    if (!emp?.leave) return null;
    const total = emp.leave.annual || 22;
    const used  = emp.leave.used   || 0;
    return { total, used, remaining: total - used };
  }, [selected, employees]);

  // ── Type breakdown strip ──
  const typeBreakdown = useMemoL(() =>
    types
      .map(lt => ({
        ...lt,
        pending:  requests.filter(r => r.type === (lt.typeId || lt.id) && r.status === "pending").length,
        approved: requests.filter(r => r.type === (lt.typeId || lt.id) && r.status === "approved").length,
      }))
      .filter(lt => lt.pending + lt.approved > 0),
    [types, requests]
  );

  // ── Approve ──
  const handleApprove = useCallbackL(async (leave) => {
    if (actioning) return;
    setActioning(leave.leaveId);
    setRequests(prev => prev.map(r => r.leaveId === leave.leaveId ? { ...r, status: "approved" } : r));
    try {
      const res = await fetch(`${API}/leave-requests/${leave.leaveId}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      const updated = await res.json();
      setRequests(prev => prev.map(r => r.leaveId === updated.leaveId ? { ...updated, id: updated.leaveId } : r));
      onApprove && onApprove({ ...updated, id: updated.leaveId });
    } catch {
      setRequests(prev => prev.map(r => r.leaveId === leave.leaveId ? { ...r, status: "pending" } : r));
    } finally { setActioning(null); }
  }, [actioning, onApprove]);

  // ── Decline ──
  const handleDecline = useCallbackL(async (leave) => {
    if (actioning) return;
    setActioning(leave.leaveId);
    setRequests(prev => prev.map(r => r.leaveId === leave.leaveId ? { ...r, status: "declined" } : r));
    try {
      const res = await fetch(`${API}/leave-requests/${leave.leaveId}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "declined" }),
      });
      const updated = await res.json();
      setRequests(prev => prev.map(r => r.leaveId === updated.leaveId ? { ...updated, id: updated.leaveId } : r));
      onDecline && onDecline({ ...updated, id: updated.leaveId });
    } catch {
      setRequests(prev => prev.map(r => r.leaveId === leave.leaveId ? { ...r, status: "pending" } : r));
    } finally { setActioning(null); }
  }, [actioning, onDecline]);

  // ── Cancel / delete ──
  const handleCancel = useCallbackL(async (leave) => {
    if (!confirm(`Cancel leave request for ${leave.emp}?`)) return;
    setRequests(prev => prev.filter(r => r.leaveId !== leave.leaveId));
    if (selectedId === leave.leaveId) setSelectedId(null);
    try {
      await fetch(`${API}/leave-requests/${leave.leaveId}`, { method: "DELETE" });
    } catch {
      setRequests(prev => [...prev, leave]);
    }
  }, [selectedId]);

  // ── Add new request ──
  const handleNewRequest = (item) => {
    const norm = { ...item, id: item.leaveId };
    setRequests(prev => [norm, ...prev]);
    onAdd && onAdd("leaveRequest", norm);
    setTab("pending");
    setSelectedId(item.leaveId);
  };

  // ── Dynamic calendar ──
  const calData = useMemoL(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    const daysInMonth     = new Date(y, m, 0).getDate();
    const daysInPrevMonth = new Date(y, m - 1, 0).getDate();
    const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Mon = 0
    const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
    const cells = Array.from({ length: totalCells }, (_, i) => i - offset + 1);
    const MNAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const todayRef = new Date(2026, 4, 21);
    return {
      cells, daysInMonth, daysInPrevMonth,
      label: MNAMES[m - 1] + " " + y,
      isCurrentMonth: y === todayRef.getFullYear() && m === todayRef.getMonth() + 1,
      todayDay: todayRef.getDate(),
    };
  }, [currentMonth]);

  const selColor = selected ? typeColor(selected.type) : "#A89DA3";

  // ── Loading ──
  if (loading) return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
      <div style={{ width: 32, height: 32, border: "3px solid var(--plum-100)", borderTopColor: "var(--brand-burgundy)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div className="page">

      {/* ── Header ── */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Time · Leave management</div>
          <h1 className="page-title">Leave</h1>
          <div className="page-sub">
            Approve requests, view team calendar, and manage leave policies for the {company.name} workforce.
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Button variant="secondary" icon="settings">Policies</Button>
          <Button variant="primary" icon="calendar-plus" onClick={() => setShowModal(true)}>Request leave</Button>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <KPI label="Pending approvals"    value={counts.pending}     icon="bell-ring"      delta="+3" />
        <KPI label="On leave today"       value={company.onLeave || 0} icon="palmtree"     delta="−2" deltaDir="down" />
        <KPI label="Avg days taken (YTD)" value="6.8"                icon="trending-up"    delta="+0.4" />
        <KPI label="Unplanned absences"   value="11"                 icon="alert-triangle" delta="+2" />
      </div>

      {/* ── Leave type breakdown strip (clickable filters) ── */}
      {typeBreakdown.length > 0 && (
        <div className="leave-type-strip" style={{ marginBottom: 20 }}>
          {typeBreakdown.map(lt => {
            const total   = lt.pending + lt.approved;
            const key     = lt.typeId || lt.id;
            const active  = typeFilter === key;
            return (
              <div key={key} className="leave-type-card"
                style={{
                  borderTop: `3px solid ${lt.color}`,
                  cursor: "pointer",
                  outline: active ? `2px solid ${lt.color}` : "none",
                  outlineOffset: 2,
                }}
                onClick={() => setTypeFilter(prev => prev === key ? "all" : key)}
              >
                <div className="leave-type-card-icon" style={{ background: lt.color + "18", color: lt.color }}>
                  <Icon name={lt.icon || "calendar-off"} size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                    <span className="text-mono" style={{ fontSize: 20, fontWeight: 700, color: lt.color, letterSpacing: "-0.02em" }}>{total}</span>
                    {lt.pending > 0 && (
                      <span className="text-mono" style={{ fontSize: 10.5, color: "var(--warning-700)", fontWeight: 600 }}>{lt.pending} pending</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--fg-2)", fontWeight: 500, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {lt.name}
                  </div>
                </div>
              </div>
            );
          })}
          {typeFilter !== "all" && (
            <button onClick={() => setTypeFilter("all")}
              style={{ alignSelf: "center", padding: "4px 10px", fontSize: 11.5, borderRadius: 12, border: "1px solid var(--ink-200)", background: "transparent", cursor: "pointer", color: "var(--fg-3)" }}>
              Clear filter ✕
            </button>
          )}
        </div>
      )}

      {/* ── Main two-column layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20, marginBottom: 20 }}>

        {/* ── Requests inbox ── */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ borderBottom: "1px solid var(--ink-100)" }}>
            <div style={{ padding: "0 16px" }}>
              <Tabs active={tab} onChange={(t) => {
                setTab(t);
                const first = requests.find(r => r.status === t);
                setSelectedId(first ? first.leaveId : null);
              }} tabs={[
                { id: "pending",  label: "Pending",  count: counts.pending },
                { id: "approved", label: "Approved", count: counts.approved },
                { id: "declined", label: "Declined", count: counts.declined },
              ]} />
            </div>

            {/* Filter bar */}
            <div className="row" style={{ gap: 8, padding: "8px 16px 10px" }}>
              <div className="search" style={{ flex: 1 }}>
                <Icon name="search" size={13} color="var(--fg-3)" />
                <input
                  placeholder="Search name or department…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select className="fi"
                style={{ width: 148, fontSize: 12, padding: "4px 24px 4px 8px", height: 30 }}
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
              >
                <option value="all">All departments</option>
                {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div style={{ maxHeight: 520, overflowY: "auto" }}>
            {list.length === 0 ? (
              <div className="leave-empty">
                <Icon name="inbox" size={32} color="var(--ink-300)" />
                <div>No {tab} requests{search ? ` matching "${search}"` : ""}</div>
              </div>
            ) : list.map(l => {
              const isSel = l.leaveId === selectedId;
              const tc    = typeColor(l.type);
              return (
                <div key={l.leaveId}
                  onClick={() => setSelectedId(l.leaveId)}
                  className={"lreq-item" + (isSel ? " lreq-item--sel" : "")}
                  style={{
                    borderLeft: `3px solid ${isSel ? tc : "transparent"}`,
                    background: isSel ? tc + "0D" : undefined,
                  }}
                >
                  <div className="lreq-icon" style={{ background: tc + "18", color: tc }}>
                    <Icon name={typeIcon(l.type)} size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {l.emp}
                      </div>
                      <span className="lreq-days-badge" style={{ background: tc + "18", color: tc, border: `1px solid ${tc}44` }}>
                        {l.days}d
                      </span>
                    </div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.dept} · submitted {l.submitted}
                    </div>
                    <div className="row-tight" style={{ marginTop: 7, gap: 6, alignItems: "center" }}>
                      <span className="lreq-type-chip" style={{ background: tc + "18", color: tc, border: `1px solid ${tc}33` }}>
                        {l.typeLbl}
                      </span>
                      <span className="muted" style={{ fontSize: 11 }}>·</span>
                      <span className="text-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
                        {l.from.split(" ").slice(0, 2).join(" ")} → {l.to.split(" ").slice(0, 2).join(" ")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Detail pane ── */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          {selected ? (
            <>
              <div style={{ height: 4, background: selColor, borderRadius: "var(--radius-md) var(--radius-md) 0 0", flexShrink: 0 }} />

              <div className="card-head" style={{ gap: 14 }}>
                <div className="lreq-detail-icon" style={{ background: selColor + "18", color: selColor }}>
                  <Icon name={typeIcon(selected.type)} size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="card-title-lg">{selected.emp}</div>
                  <div className="card-sub">
                    {selected.typeLbl} · {selected.days} day{selected.days > 1 ? "s" : ""} · {selected.leaveId}
                  </div>
                </div>
                <Chip kind={selected.status === "pending" ? "warning" : selected.status === "approved" ? "success" : "danger"}>
                  {selected.status[0].toUpperCase() + selected.status.slice(1)}
                </Chip>
              </div>

              <div className="card-pad" style={{ flex: 1, overflowY: "auto" }}>
                <div className="attr-grid">
                  <div className="attr"><div className="k">From</div><div className="v mono">{selected.from}</div></div>
                  <div className="attr"><div className="k">To</div><div className="v mono">{selected.to}</div></div>
                  <div className="attr"><div className="k">Approver</div><div className="v">{selected.approver}</div></div>
                  <div className="attr"><div className="k">Submitted</div><div className="v mono">{selected.submitted}</div></div>
                </div>

                <div className="divider" />

                <div className="label" style={{ marginBottom: 8 }}>Reason</div>
                <div className="leave-reason-box">
                  {selected.reason || <span className="muted">No reason provided.</span>}
                </div>

                <div className="divider" />

                <div className="label" style={{ marginBottom: 10 }}>Conflicts &amp; balance</div>
                <div className="stack" style={{ gap: 10 }}>
                  {empBalance && (
                    <div className="leave-balance-block">
                      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8, fontSize: 12.5 }}>
                        <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Annual leave balance</span>
                        <span className="text-mono" style={{ fontWeight: 700, fontSize: 12.5, color: empBalance.remaining >= 5 ? "var(--success-700)" : "var(--warning-700)" }}>
                          {empBalance.remaining} / {empBalance.total} days left
                        </span>
                      </div>
                      <div className="meter">
                        <span style={{
                          width: `${Math.max(0, empBalance.remaining / empBalance.total) * 100}%`,
                          background: empBalance.remaining >= 5 ? "var(--success-500)" : "var(--warning-500)",
                        }} />
                      </div>
                      <div className="row" style={{ justifyContent: "space-between", marginTop: 6, fontSize: 11 }}>
                        <span className="muted">Used: {empBalance.used} days</span>
                        <span className="muted">Remaining: {empBalance.remaining} days</span>
                      </div>
                    </div>
                  )}
                  <div className="leave-conflict-row">
                    <Icon name="users" size={13} color="var(--fg-3)" />
                    <span>Team members away in this period</span>
                    <span className="text-mono" style={{ fontWeight: 600, marginLeft: "auto", color: "var(--warning-700)" }}>2</span>
                    <span className="muted" style={{ fontSize: 11 }}>(Tariq B., Reema K.)</span>
                  </div>
                </div>

                <div className="divider" />

                <div className="label" style={{ marginBottom: 8 }}>Approval history</div>
                <div className="timeline">
                  <div className="tl-item done">
                    <div className="when">{selected.submitted} · 14:22</div>
                    <div className="what">Request submitted</div>
                    <div className="who">by {selected.emp}</div>
                  </div>
                  {selected.status !== "pending" ? (
                    <div className={"tl-item " + (selected.status === "approved" ? "done" : "")}>
                      <div className="when">Updated</div>
                      <div className="what">{selected.status === "approved" ? "Approved" : "Declined"} by {selected.approver}</div>
                    </div>
                  ) : (
                    <div className="tl-item muted">
                      <div className="when">Pending</div>
                      <div className="what">Awaiting decision from {selected.approver}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="drawer-foot">
                {selected.status === "pending" ? (
                  <>
                    <Button variant="ghost" size="sm" icon="message-circle">Ask for info</Button>
                    <div className="row" style={{ gap: 8 }}>
                      <Button variant="danger" size="sm" icon="x"
                        onClick={() => handleDecline(selected)}
                        disabled={actioning === selected.leaveId}>
                        Decline
                      </Button>
                      <Button variant="primary" size="sm" icon="check"
                        onClick={() => handleApprove(selected)}
                        disabled={actioning === selected.leaveId}>
                        {actioning === selected.leaveId ? "Saving…" : "Approve"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="row" style={{ gap: 8, width: "100%", justifyContent: "flex-end" }}>
                    <Button variant="ghost" size="sm" icon="trash-2"
                      onClick={() => handleCancel(selected)}>
                      Cancel request
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="leave-empty" style={{ height: "100%", minHeight: 300 }}>
              <Icon name="mouse-pointer-click" size={32} color="var(--ink-300)" />
              <div>Select a request to review</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Team calendar ── */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title-lg">Team calendar — {calData.label}</div>
            <div className="card-sub">Approved leaves, public holidays, WFH and events across all teams</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Segmented value="team" onChange={() => {}} options={[
              { value: "team", label: "Team" },
              { value: "dept", label: "Department" },
              { value: "all",  label: "All" },
            ]} />
            <Button variant="secondary" size="sm" icon="chevron-left" onClick={() => changeMonth(-1)} />
            <Button variant="ghost" size="sm">{calData.label}</Button>
            <Button variant="secondary" size="sm" icon="chevron-right" onClick={() => changeMonth(1)} />
          </div>
        </div>
        <div className="card-pad">
          <div className="cal">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <div key={d} className="cal-h">{d}</div>)}
            {calData.cells.map((dnum, i) => {
              const inMonth = dnum >= 1 && dnum <= calData.daysInMonth;
              const dispNum = inMonth ? dnum
                : dnum < 1   ? calData.daysInPrevMonth + dnum
                :               dnum - calData.daysInMonth;
              const isToday = inMonth && calData.isCurrentMonth && dnum === calData.todayDay;
              const events  = inMonth ? (monthEvents[dnum] || []) : [];
              return (
                <div key={i} className={"cal-d " + (inMonth ? "" : "off") + (isToday ? " today" : "")}>
                  <div className="n">{dispNum}</div>
                  {events.slice(0, 3).map((e, j) => (
                    <div key={j} className={"pill " + (e.kind === "leave" ? "pill-leave" : e.kind === "holiday" ? "pill-holiday" : e.kind === "wfh" ? "pill-wfh" : "pill-event")}>
                      {e.label}
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className="muted" style={{ fontSize: 10 }}>+{events.length - 3} more</div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="cal-legend">
            <span className="cal-legend-item"><span className="cal-legend-sw" style={{ background: "#FCF2E1", border: "1px solid #f1cd87" }} />Annual / sick leave</span>
            <span className="cal-legend-item"><span className="cal-legend-sw" style={{ background: "#E8EFF8", border: "1px solid #a8c0e0" }} />Public holiday</span>
            <span className="cal-legend-item"><span className="cal-legend-sw" style={{ background: "#E8F5EE", border: "1px solid #97c8a9" }} />WFH</span>
            <span className="cal-legend-item"><span className="cal-legend-sw" style={{ background: "#FBF3F7", border: "1px solid var(--plum-200)" }} />Company event</span>
          </div>
        </div>
      </div>

      {/* ── Request leave modal ── */}
      {showModal && (
        <RequestLeaveModal
          employees={employees}
          leaveTypes={types}
          onClose={() => setShowModal(false)}
          onSave={(item) => { handleNewRequest(item); setShowModal(false); }}
        />
      )}
    </div>
  );
}

// ── Request Leave Modal ──────────────────────────────────────────────────────
function RequestLeaveModal({ employees, leaveTypes, onClose, onSave }) {
  const [form, setForm] = useStateL({
    empId: employees[0]?.empId || "",
    type:  leaveTypes[0]?.typeId || leaveTypes[0]?.id || "annual",
    from: "", to: "", reason: "",
  });
  const [saving, setSaving] = useStateL(false);
  const [err,    setErr]    = useStateL("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const calcDays = () => {
    if (!form.from || !form.to) return 0;
    return Math.max(0, Math.round((new Date(form.to) - new Date(form.from)) / 86400000) + 1);
  };

  const selLt = leaveTypes.find(t => (t.typeId || t.id) === form.type);
  const days  = calcDays();

  const handleSubmit = async () => {
    if (!form.from || !form.to) { setErr("Please select both start and end dates."); return; }
    if (new Date(form.to) < new Date(form.from)) { setErr("End date cannot be before start date."); return; }
    const emp = employees.find(e => e.empId === form.empId);
    if (!emp) return;
    setSaving(true); setErr("");
    const body = {
      leaveId:   "LR-" + Date.now().toString().slice(-6),
      empId:     emp.empId, emp: emp.name, dept: emp.dept,
      type:      form.type, typeLbl: selLt?.name || form.type,
      from:      form.from, to: form.to, days: calcDays(),
      reason:    form.reason, status: "pending",
      submitted: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      approver:  emp.manager || "HR",
    };
    try {
      const res = await fetch(`${API}/leave-requests`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      onSave(await res.json());
    } catch (e) { setErr(e.message || "Failed to submit."); setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-head-icon" style={selLt ? { background: selLt.color + "18", color: selLt.color } : undefined}>
            <Icon name={selLt?.icon || "calendar-plus"} size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-title">Request leave</div>
            <div className="modal-subtitle">Submit a leave request for manager approval.</div>
          </div>
          <button className="icon-btn modal-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div className="modal-body stack" style={{ gap: 14 }}>
          <div className="form-group">
            <label className="label">Employee</label>
            <select className="fi" value={form.empId} onChange={e => set("empId", e.target.value)}>
              {employees.map(e => <option key={e.empId} value={e.empId}>{e.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Leave type</label>
            <select className="fi" value={form.type} onChange={e => set("type", e.target.value)}>
              {leaveTypes.map(t => <option key={t.typeId || t.id} value={t.typeId || t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="label">From date <span className="req">*</span></label>
              <input className="fi" type="date" value={form.from}
                onChange={e => { set("from", e.target.value); err && setErr(""); }} />
            </div>
            <div className="form-group">
              <label className="label">To date <span className="req">*</span></label>
              <input className="fi" type="date" value={form.to}
                onChange={e => { set("to", e.target.value); err && setErr(""); }} />
            </div>
          </div>

          {days > 0 && (
            <div className="row" style={{
              gap: 8, padding: "8px 12px",
              background: selLt ? selLt.color + "12" : "var(--plum-50)",
              border: `1px solid ${selLt ? selLt.color + "33" : "var(--plum-100)"}`,
              borderRadius: 8,
            }}>
              <Icon name="calendar-check" size={14} color={selLt?.color || "var(--brand-burgundy)"} />
              <span style={{ fontSize: 12.5, color: selLt?.color || "var(--brand-burgundy)", fontWeight: 600 }}>
                {days} working day{days !== 1 ? "s" : ""} selected
              </span>
            </div>
          )}

          <div className="form-group">
            <label className="label">
              Reason <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400, color: "var(--fg-3)" }}>(optional)</span>
            </label>
            <textarea className="fi" value={form.reason}
              onChange={e => set("reason", e.target.value)}
              rows={3} placeholder="Briefly describe the reason for your leave…" />
          </div>

          {err && (
            <div className="form-err">
              <Icon name="alert-circle" size={15} color="var(--danger-700)" />{err}
            </div>
          )}
        </div>

        <div className="modal-foot">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="calendar-plus"
            onClick={handleSubmit}
            disabled={saving || !form.from || !form.to}>
            {saving ? "Submitting…" : "Submit request"}
          </Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LeavePage });

export default LeavePage;
