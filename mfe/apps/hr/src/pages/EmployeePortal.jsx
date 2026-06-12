import React from "react";
import { Avatar, AvatarRow, Icon, Button, KPI, Chip, Meter } from "../legacy.jsx";
import { API_BASE as API } from "@meridian/api";
import { ACCENT_THEMES, getSavedAccent, setAccent } from "@meridian/theme";
const { useState: useStateEP, useEffect: useEffectEP, useMemo: useMemoEP } = React;

/* Theme swatches for the sidebar foot — same palettes as the admin shell picker. */
function EpThemePicker() {
  const [accent, setAccentState] = useStateEP(getSavedAccent);
  return (
    <div className="ep-theme">
      <div className="ep-theme-label"><Icon name="palette" size={12} /> Theme</div>
      <div className="ep-theme-swatches">
        {Object.entries(ACCENT_THEMES).map(([hex, t]) => (
          <button
            key={hex}
            className={"ep-swatch" + (accent === hex ? " ep-swatch--active" : "")}
            style={{ background: `linear-gradient(135deg, ${t.magenta}, ${hex})` }}
            title={t.name}
            aria-label={`${t.name} theme`}
            onClick={() => { setAccent(hex); setAccentState(hex); }}
          >
            {accent === hex && <Icon name="check" size={11} color="#fff" stroke={3} />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────────────────── */
const EP_NAV = [
  { sec: "Overview", items: [
    { id: "home",     label: "Home",        icon: "layout-dashboard" },
  ]},
  { sec: "Work", items: [
    { id: "projects", label: "My Projects", icon: "folder-kanban" },
  ]},
  { sec: "My Time", items: [
    { id: "leave",    label: "Leave",       icon: "calendar-off" },
    { id: "attend",   label: "Attendance",  icon: "clock" },
  ]},
  { sec: "Money", items: [
    { id: "payslip",  label: "Payslip",     icon: "wallet" },
  ]},
  { sec: "Account", items: [
    { id: "profile",  label: "My Profile",  icon: "user" },
  ]},
];

/* Project stage / priority styling — mirrors ProjectPage conventions */
const EP_STAGE_META = {
  quotation:         { label: "Quotation",         icon: "file-text",      color: "#2563B0" },
  discussion:        { label: "Discussion",        icon: "message-circle", color: "#D78A14" },
  approved:          { label: "Approved",          icon: "check-circle-2", color: "#1F8A52" },
  advance_collected: { label: "Advance Collected", icon: "banknote",       color: "#534AB7" },
  work_started:      { label: "Work Started",      icon: "hard-hat",       color: "#6F1947" },
  completed:         { label: "Completed",         icon: "flag",           color: "#0F6E56" },
  on_hold:           { label: "On Hold",           icon: "pause-circle",   color: "#807379" },
  cancelled:         { label: "Cancelled",         icon: "x-circle",       color: "#C0263A" },
};
const EP_PRI_META = {
  low:    { label: "Low",    color: "#A89DA3" },
  medium: { label: "Medium", color: "#D78A14" },
  high:   { label: "High",   color: "#C0263A" },
  urgent: { label: "Urgent", color: "#B61B54" },
};
function epStageMeta(s) { return EP_STAGE_META[s] || EP_STAGE_META.quotation; }
function epProjAmount(p) {
  if (p.stage === "completed" && p.finalAmount > 0) return { amount: p.finalAmount, label: "Final" };
  if (p.approvedAmount > 0) return { amount: p.approvedAmount, label: "Approved" };
  return { amount: p.quotationAmount || 0, label: "Quotation" };
}

const LEAVE_TYPE_COLORS = {
  annual:       "#1F8A52",
  sick:         "#2563B0",
  hajj:         "#854F0B",
  wfh:          "#534AB7",
  emergency:    "#C0263A",
  bereavement:  "#5C5156",
};

const STATUS_META_EP = {
  pending:  { bg: "#FEF3C7", fg: "#92400E", label: "Pending"  },
  approved: { bg: "#D1FAE5", fg: "#065F46", label: "Approved" },
  declined: { bg: "#FEE2E2", fg: "#991B1B", label: "Declined" },
};

function typeColor(type) { return LEAVE_TYPE_COLORS[type] || "#A89DA3"; }
function typeIcon(type, leaveTypes) {
  const lt = leaveTypes.find(t => (t.typeId || t.id) === type);
  return lt?.icon || "calendar-off";
}

function LeaveChip({ status }) {
  const m = STATUS_META_EP[status] || STATUS_META_EP.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: m.bg, color: m.fg }}>
      {m.label}
    </span>
  );
}

/* ── Main portal shell ────────────────────────────────────────────────── */
function EmployeePortal({ authUser, token, onLogout, embedded }) {
  const [profile,    setProfile]    = useStateEP(null);
  const [leaves,     setLeaves]     = useStateEP([]);
  const [leaveTypes, setLeaveTypes] = useStateEP([]);
  const [payslip,    setPayslip]    = useStateEP(null);
  const [projects,   setProjects]   = useStateEP([]);
  const [loading,    setLoading]    = useStateEP(true);
  const [error,      setError]      = useStateEP(null);
  const [route,      setRoute]      = useStateEP("home");
  const [collapsed,  setCollapsed]  = useStateEP(() => {
    try { return localStorage.getItem("meridian_ep_collapsed") === "1"; } catch { return false; }
  });
  const toggleCollapsed = () => setCollapsed(c => {
    try { localStorage.setItem("meridian_ep_collapsed", c ? "0" : "1"); } catch { /* private mode */ }
    return !c;
  });
  const [showReq,    setShowReq]    = useStateEP(false);

  useEffectEP(() => {
    const headers = { Authorization: `Bearer ${token}` };
    let myName = authUser.name;
    let myEmpId = authUser.empId; // refreshed from my-profile — the login-time copy can be stale (e.g. admin linked after sign-in)
    Promise.all([
      fetch(`${API}/auth/my-profile`, { headers }).then(r => r.json()),
      fetch(`${API}/leave-types`).then(r => r.json()),
    ]).then(([profileData, types]) => {
      if (profileData.message) throw new Error(profileData.message);
      setProfile(profileData.employee);
      myName = profileData.employee.name;
      myEmpId = profileData.employee.empId;
      setLeaveTypes(types);
      return Promise.all([
        fetch(`${API}/leave-requests?empId=${profileData.employee.empId}`).then(r => r.json()),
        fetch(`${API}/payroll/latest`).then(r => r.json()),
        fetch(`${API}/projects`).then(r => r.json()),
      ]);
    }).then(([lvs, payrollRun, allProjects]) => {
      setLeaves(lvs);
      const line = (payrollRun.lines || []).find(l => l.empId === myEmpId);
      setPayslip(line || null);
      // Projects this employee is assigned to (as lead or site engineer), matched by name
      const mine = (Array.isArray(allProjects) ? allProjects : []).filter(p =>
        (p.assignedTo && p.assignedTo === myName) || (p.siteEngineer && p.siteEngineer === myName)
      );
      setProjects(mine);
      setLoading(false);
    }).catch(err => { setError(err.message || "Could not load your profile."); setLoading(false); });
  }, []);

  useEffectEP(() => {
    const t = setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 60);
    return () => clearTimeout(t);
  }, [loading, route, showReq, leaves]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 14, color: "var(--fg-3)" }}>
      <div style={{ width: 36, height: 36, border: "3px solid var(--plum-100)", borderTopColor: "var(--brand-burgundy)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontSize: 13 }}>Loading your portal…</div>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 10, color: "var(--fg-2)", padding: 40 }}>
      <Icon name="alert-circle" size={32} color="var(--danger-700)" />
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--danger-700)" }}>Could not load profile</div>
      <div style={{ fontSize: 13 }}>{error}</div>
      <Button variant="ghost" size="sm" onClick={onLogout} icon="log-out">Sign out</Button>
    </div>
  );

  const emp = profile;
  const addLeave = (lv) => setLeaves(prev => [{ ...lv, id: lv.leaveId }, ...prev]);
  const updateProject = (doc) => setProjects(prev => prev.map(p => p.projectId === doc.projectId ? doc : p));

  const pageProps = { emp, leaves, leaveTypes, payslip, projects, token, onNav: setRoute, onRequestLeave: () => setShowReq(true), addLeave, onProjectUpdate: updateProject };

  let page;
  if      (route === "home")     page = <EmpHome     {...pageProps} />;
  else if (route === "projects") page = <EmpProjects {...pageProps} />;
  else if (route === "leave")    page = <EmpLeave    {...pageProps} showReq={showReq} setShowReq={setShowReq} />;
  else if (route === "attend")   page = <EmpAttend   {...pageProps} />;
  else if (route === "payslip")  page = <EmpPayslip  {...pageProps} />;
  else if (route === "profile")  page = <EmpProfile  {...pageProps} />;
  else page = <EmpHome {...pageProps} />;

  // Embedded mode (admin "My Portal" inside the HR app): the shell + HR sidebars
  // already frame the page, so swap the portal's own sidebar for a tab strip.
  if (embedded) return (
    <div className="ep-embedded">
      <div className="ep-tabs">
        {EP_NAV.flatMap(sec => sec.items).map(it => (
          <button
            key={it.id}
            className={"ep-tab" + (route === it.id ? " ep-tab--active" : "")}
            onClick={() => setRoute(it.id)}
          >
            <Icon name={it.icon} size={15} />
            <span>{it.label}</span>
          </button>
        ))}
      </div>
      {page}
      {showReq && route !== "leave" && (
        <RequestLeaveModal
          employee={emp} leaveTypes={leaveTypes} token={token}
          onClose={() => setShowReq(false)}
          onSaved={(lv) => { addLeave(lv); setShowReq(false); }}
        />
      )}
    </div>
  );

  return (
    <div className={"ep-shell" + (collapsed ? " ep-shell--collapsed" : "")}>
      {/* Sidebar */}
      <aside className="ep-sidebar">
        <div className="ep-sidebar-brand">
          <div className="ep-sidebar-mark">M</div>
          {!collapsed && (
            <div>
              <div className="ep-sidebar-name">Meridian ERP</div>
              <div className="ep-sidebar-sub">Employee Portal</div>
            </div>
          )}
          <button className="ep-collapse" title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={toggleCollapsed}>
            <Icon name={collapsed ? "panel-left-open" : "panel-left-close"} size={14} />
          </button>
        </div>

        <div className="ep-sidebar-avatar" title={collapsed ? `${emp.name} · ${emp.empId}` : undefined}>
          <Avatar name={emp.name} color={emp.av} />
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div className="ep-sidebar-emp-name">{emp.name}</div>
              <div className="ep-sidebar-emp-sub">{emp.empId} · {emp.dept}</div>
            </div>
          )}
        </div>

        <nav className="ep-nav">
          {EP_NAV.map((sec, si) => (
            <div key={si} className="ep-nav-section">
              {!collapsed && <div className="ep-nav-heading">{sec.sec}</div>}
              {sec.items.map(it => (
                <button
                  key={it.id}
                  className={"ep-nav-item" + (route === it.id ? " ep-nav-item--active" : "")}
                  title={collapsed ? it.label : undefined}
                  onClick={() => setRoute(it.id)}
                >
                  <Icon name={it.icon} size={16} />
                  {!collapsed && <span>{it.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="ep-sidebar-foot">
          {!collapsed && <EpThemePicker />}
          <button className="ep-logout" onClick={onLogout} title={collapsed ? "Sign out" : undefined}>
            <Icon name="log-out" size={14} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ep-main">
        {page}
      </main>

      {showReq && route !== "leave" && (
        <RequestLeaveModal
          employee={emp} leaveTypes={leaveTypes} token={token}
          onClose={() => setShowReq(false)}
          onSaved={(lv) => { addLeave(lv); setShowReq(false); }}
        />
      )}
    </div>
  );
}

/* ── Home page ────────────────────────────────────────────────────────── */
function EmpHome({ emp, leaves, leaveTypes, payslip, onNav, onRequestLeave }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const remaining = (emp.leave?.annual || 22) - (emp.leave?.used || 0);
  const pendingCount = leaves.filter(l => l.status === "pending").length;
  const upcoming = leaves.filter(l => l.status === "approved").slice(0, 3);

  const docAlerts = [
    emp.visaExpires && emp.visaExpires !== "—" && { label: "Visa expires", date: emp.visaExpires, icon: "shield", urgent: emp.visaExpires.includes("Jun 2026") },
    emp.eidExpires  && { label: "Emirates ID expires", date: emp.eidExpires,  icon: "credit-card", urgent: false },
  ].filter(Boolean);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Employee Portal · Overview</div>
          <h1 className="page-title">{greeting}, {emp.name.split(" ")[0]}</h1>
          <div className="page-sub">{emp.title} · {emp.dept} · {emp.location}</div>
        </div>
        <Button variant="primary" icon="calendar-plus" onClick={onRequestLeave}>Request leave</Button>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="kpi" style={{ cursor: "pointer" }} onClick={() => onNav("leave")}>
          <div className="lbl">Leave remaining</div>
          <div className="val" style={{ color: remaining <= 5 ? "var(--warning-700)" : "var(--success-700)" }}>{remaining}</div>
          <div className="muted" style={{ fontSize: 11.5 }}>{emp.leave?.used || 0} of {emp.leave?.annual || 22} days used</div>
          <div className="ico" style={{ background: "var(--success-50)", color: "var(--success-700)" }}><Icon name="palmtree" size={16} /></div>
        </div>
        <div className="kpi">
          <div className="lbl">Days present (May)</div>
          <div className="val">17</div>
          <div className="muted" style={{ fontSize: 11.5 }}>81% attendance rate</div>
          <div className="ico" style={{ background: "var(--info-50)", color: "var(--info-700)" }}><Icon name="check-circle-2" size={16} /></div>
        </div>
        <div className="kpi" style={{ cursor: "pointer" }} onClick={() => onNav("leave")}>
          <div className="lbl">Pending requests</div>
          <div className="val" style={{ color: pendingCount > 0 ? "var(--warning-700)" : "var(--fg-1)" }}>{pendingCount}</div>
          <div className="muted" style={{ fontSize: 11.5 }}>{pendingCount > 0 ? "Awaiting approval" : "All clear"}</div>
          <div className="ico" style={{ background: "var(--warning-50)", color: "var(--warning-700)" }}><Icon name="clock" size={16} /></div>
        </div>
        <div className="kpi" style={{ cursor: "pointer" }} onClick={() => onNav("payslip")}>
          <div className="lbl">Net pay (May 2026)</div>
          <div className="val" style={{ fontSize: 20 }}>{payslip ? `${(payslip.net / 1000).toFixed(1)}K` : "—"}</div>
          <div className="muted" style={{ fontSize: 11.5 }}>{payslip ? `AED ${payslip.net.toLocaleString()}` : "No payslip yet"}</div>
          <div className="ico" style={{ background: "var(--plum-50)", color: "var(--brand-burgundy)" }}><Icon name="wallet" size={16} /></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Upcoming leave */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title-lg">Upcoming leave</div>
              <div className="card-sub">Approved requests going forward</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNav("leave")}>View all</Button>
          </div>
          <div>
            {upcoming.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>
                <Icon name="sun" size={24} color="var(--ink-300)" />
                <div style={{ marginTop: 8 }}>No upcoming approved leave</div>
              </div>
            ) : upcoming.map((lv, i) => {
              const tc = typeColor(lv.type);
              const ti = typeIcon(lv.type, leaveTypes);
              return (
                <div key={lv.leaveId || i} className="ep-leave-row" style={{ borderLeft: `3px solid ${tc}` }}>
                  <div className="ep-leave-icon" style={{ background: tc + "18", color: tc }}>
                    <Icon name={ti} size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{lv.typeLbl || lv.type}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{lv.from} → {lv.to}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="text-mono" style={{ fontSize: 13, fontWeight: 700, color: tc }}>{lv.days}d</div>
                    <LeaveChip status={lv.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions + doc alerts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="card-head" style={{ paddingBottom: 12 }}>
              <div className="card-title-lg">Quick actions</div>
            </div>
            <div className="card-pad" style={{ paddingTop: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Request leave",     icon: "calendar-plus", action: onRequestLeave, primary: true },
                { label: "My projects",       icon: "folder-kanban", action: () => onNav("projects") },
                { label: "View payslip",      icon: "wallet",        action: () => onNav("payslip") },
                { label: "My attendance",     icon: "clock",         action: () => onNav("attend") },
                { label: "Profile & docs",    icon: "user",          action: () => onNav("profile") },
              ].map(({ label, icon, action, primary }) => (
                <button key={label} onClick={action} className={"ep-quick-btn" + (primary ? " ep-quick-btn--primary" : "")}>
                  <Icon name={icon} size={15} />
                  <span>{label}</span>
                  <Icon name="chevron-right" size={14} color="var(--fg-4)" style={{ marginLeft: "auto" }} />
                </button>
              ))}
            </div>
          </div>

          {docAlerts.length > 0 && (
            <div className="card">
              <div className="card-head" style={{ paddingBottom: 12 }}>
                <div className="card-title-lg">Document alerts</div>
              </div>
              <div className="card-pad" style={{ paddingTop: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {docAlerts.map((alert, i) => (
                  <div key={i} className="ep-doc-alert" style={{ borderColor: alert.urgent ? "var(--warning-200)" : "var(--border-subtle)", background: alert.urgent ? "var(--warning-50)" : "var(--ink-50)" }}>
                    <Icon name={alert.icon} size={14} color={alert.urgent ? "var(--warning-700)" : "var(--fg-3)"} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: alert.urgent ? "var(--warning-700)" : "var(--fg-2)" }}>{alert.label}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>{alert.date}</div>
                    </div>
                    {alert.urgent && <span style={{ fontSize: 10, fontWeight: 700, background: "var(--warning-200)", color: "var(--warning-700)", padding: "2px 7px", borderRadius: 999 }}>Soon</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leave balance */}
      <div className="card">
        <div className="card-head">
          <div className="card-title-lg">Leave balance</div>
          <Button variant="ghost" size="sm" onClick={() => onNav("leave")}>Request leave</Button>
        </div>
        <div className="card-pad">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { label: "Annual leave",    total: emp.leave?.annual || 22, used: emp.leave?.used || 0, color: "#1F8A52", icon: "palmtree" },
              { label: "Sick leave",      total: 10, used: 2,  color: "#2563B0", icon: "thermometer" },
              { label: "WFH days",        total: 12, used: 5,  color: "#534AB7", icon: "monitor" },
            ].map(({ label, total, used, color, icon }) => {
              const rem = total - used;
              const pct = Math.round((used / total) * 100);
              return (
                <div key={label} className="ep-balance-card" style={{ borderTop: `3px solid ${color}` }}>
                  <div className="row" style={{ gap: 10, marginBottom: 12, alignItems: "center" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: color + "18", color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={icon} size={16} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13.5 }}>{label}</span>
                  </div>
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                    <span className="muted">{used} used</span>
                    <span style={{ fontWeight: 700, color, fontSize: 16, fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>{rem} left</span>
                  </div>
                  <div className="meter">
                    <span style={{ width: `${pct}%`, background: pct > 80 ? "var(--danger-500)" : pct > 60 ? "var(--warning-500)" : color }} />
                  </div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 5 }}>{total} days total</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── My Projects page ─────────────────────────────────────────────────── */
function EmpProjects({ emp, projects, onNav, onProjectUpdate }) {
  const [stageFilter, setStageFilter] = useStateEP("all");
  const [openProj,    setOpenProj]    = useStateEP(null);

  // Keep both the list and the open modal in sync after a discussion is added.
  const handleProjUpdate = (doc) => { if (onProjectUpdate) onProjectUpdate(doc); setOpenProj(doc); };

  const active = projects.filter(p => ["completed", "cancelled", "on_hold"].indexOf(p.stage) < 0);
  const stats = {
    total:     projects.length,
    active:    active.length,
    completed: projects.filter(p => p.stage === "completed").length,
    leading:   projects.filter(p => p.assignedTo === emp.name).length,
  };

  const filtered = stageFilter === "all" ? projects : projects.filter(p => p.stage === stageFilter);

  // Stage filter pills, only for stages that actually appear
  const presentStages = [];
  projects.forEach(p => { if (presentStages.indexOf(p.stage) < 0) presentStages.push(p.stage); });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Work · Projects</div>
          <h1 className="page-title">My Projects</h1>
          <div className="page-sub">{stats.total} assigned · {stats.active} active · {stats.completed} completed</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="kpi">
          <div className="lbl">Assigned to me</div>
          <div className="val">{stats.total}</div>
          <div className="muted" style={{ fontSize: 11.5 }}>across all stages</div>
          <div className="ico" style={{ background: "var(--plum-50)", color: "var(--brand-burgundy)" }}><Icon name="folder-kanban" size={16} /></div>
        </div>
        <div className="kpi">
          <div className="lbl">Active</div>
          <div className="val" style={{ color: "var(--success-700)" }}>{stats.active}</div>
          <div className="muted" style={{ fontSize: 11.5 }}>in progress</div>
          <div className="ico" style={{ background: "var(--success-50)", color: "var(--success-700)" }}><Icon name="activity" size={16} /></div>
        </div>
        <div className="kpi">
          <div className="lbl">Completed</div>
          <div className="val" style={{ color: "var(--info-700)" }}>{stats.completed}</div>
          <div className="muted" style={{ fontSize: 11.5 }}>delivered</div>
          <div className="ico" style={{ background: "var(--info-50)", color: "var(--info-700)" }}><Icon name="flag" size={16} /></div>
        </div>
        <div className="kpi">
          <div className="lbl">Leading</div>
          <div className="val">{stats.leading}</div>
          <div className="muted" style={{ fontSize: 11.5 }}>as project lead</div>
          <div className="ico" style={{ background: "var(--warning-50)", color: "var(--warning-700)" }}><Icon name="user-check" size={16} /></div>
        </div>
      </div>

      {/* Project list */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title-lg">Assigned projects</div>
            <div className="card-sub">Projects where you are the lead or site engineer</div>
          </div>
        </div>

        {projects.length === 0 ? (
          <div style={{ padding: "56px 20px", textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>
            <Icon name="folder-open" size={28} color="var(--ink-300)" />
            <div style={{ marginTop: 10, fontWeight: 600, fontSize: 14, color: "var(--fg-2)" }}>No projects assigned to you yet</div>
            <div style={{ marginTop: 4 }}>Projects you lead or supervise will appear here.</div>
          </div>
        ) : (
          <React.Fragment>
            {/* Stage filter pills */}
            <div className="att-status-filter">
              <button className={"att-filter-btn" + (stageFilter === "all" ? " att-filter-btn--active" : "")} onClick={() => setStageFilter("all")}>
                All <span className="att-filter-ct">{projects.length}</span>
              </button>
              {presentStages.map(s => {
                const m = epStageMeta(s);
                return (
                  <button key={s} className={"att-filter-btn" + (stageFilter === s ? " att-filter-btn--active" : "")} onClick={() => setStageFilter(s)}>
                    {m.label} <span className="att-filter-ct">{projects.filter(p => p.stage === s).length}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "4px 16px 16px" }}>
              {filtered.map(p => {
                const sm = epStageMeta(p.stage);
                const pri = EP_PRI_META[p.priority] || EP_PRI_META.medium;
                const role = p.assignedTo === emp.name ? "Project Lead" : "Site Engineer";
                return (
                  <div key={p.projectId} className="card ep-proj-card" style={{ padding: 14, borderLeft: `3px solid ${sm.color}`, cursor: "pointer" }}
                    onClick={() => setOpenProj(p)} role="button" title="View project details">
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="row-tight" style={{ gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--fg-1)" }}>{p.title}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: sm.color + "18", color: sm.color }}>
                            <Icon name={sm.icon} size={10} />{sm.label}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: pri.color + "18", color: pri.color }}>{pri.label}</span>
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {p.projectId}{p.partyName ? ` · ${p.partyName}` : ""}{p.location ? ` · ${p.location}` : ""}
                        </div>
                        <div className="row-tight" style={{ gap: 6, marginTop: 8 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--fg-3)", background: "var(--ink-50)", padding: "2px 8px", borderRadius: 999 }}>
                            <Icon name="user-check" size={11} />{role}
                          </span>
                          {p.expectedCompletion && p.stage !== "completed" && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--fg-3)", background: "var(--ink-50)", padding: "2px 8px", borderRadius: 999 }}>
                              <Icon name="calendar" size={11} />Due {p.expectedCompletion}
                            </span>
                          )}
                        </div>
                      </div>
                      <Icon name="chevron-right" size={16} color="var(--fg-4)" />
                    </div>
                  </div>
                );
              })}
            </div>
          </React.Fragment>
        )}
      </div>

      {openProj && <EmpProjectDetail project={openProj} emp={emp} onClose={() => setOpenProj(null)} onProjectUpdate={handleProjUpdate} />}
    </div>
  );
}

/* ── Project detail (read-only, no financials) ────────────────────────────── */
const EP_PROJ_STAGE_FLOW = ["quotation", "discussion", "approved", "advance_collected", "work_started", "completed"];

function EmpProjectDetail({ project: p, emp, onClose, onProjectUpdate }) {
  const sm = epStageMeta(p.stage);
  const pri = EP_PRI_META[p.priority] || EP_PRI_META.medium;
  const role = p.assignedTo === emp.name ? "Project Lead" : "Site Engineer";
  const isClosed = p.stage === "cancelled" || p.stage === "on_hold";
  const curIdx = EP_PROJ_STAGE_FLOW.indexOf(p.stage);

  // Add-discussion form
  const todayISO = new Date().toISOString().slice(0, 10);
  const [showForm, setShowForm] = useStateEP(false);
  const [form, setForm]   = useStateEP({ date: todayISO, notes: "", outcome: "" });
  const [saving, setSaving] = useStateEP(false);
  const [err, setErr]     = useStateEP("");
  const setF = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErr(""); };

  const submitDiscussion = async () => {
    if (!form.notes.trim()) { setErr("Please enter a note."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API}/projects/${p.projectId}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: form.date || todayISO, notes: form.notes.trim(), outcome: form.outcome.trim(), by: emp.name }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const doc = await res.json();
      if (onProjectUpdate) onProjectUpdate(doc);
      setForm({ date: todayISO, notes: "", outcome: "" });
      setShowForm(false);
    } catch (e) { setErr("Could not save the discussion. Please try again."); }
    setSaving(false);
  };

  const info = [
    { icon: "building-2", label: "Client", value: p.partyName },
    { icon: "map-pin",    label: "Location", value: p.location },
    { icon: "home",       label: "Type", value: p.type },
    { icon: "flag",       label: "Priority", value: pri.label },
    { icon: "user",       label: "Assigned to", value: p.assignedTo },
    { icon: "hard-hat",   label: "Site engineer", value: p.siteEngineer },
  ].filter(f => f.value);

  const dates = [
    { label: "Quotation",           value: p.quotationDate },
    { label: "Approved",            value: p.approvedDate },
    { label: "Advance collected",   value: p.advanceDate },
    { label: "Work started",        value: p.workStartDate },
    { label: "Expected completion", value: p.expectedCompletion },
    { label: "Completed",           value: p.completionDate },
  ].filter(d => d.value);

  const discussions = Array.isArray(p.discussions) ? p.discussions : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620, width: "100%" }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-head-icon" style={{ background: sm.color + "18", color: sm.color }}>
            <Icon name={sm.icon} size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-title">{p.title}</div>
            <div className="modal-subtitle">{p.projectId} · {role}</div>
          </div>
          <button className="icon-btn modal-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div className="modal-body stack" style={{ gap: 18 }}>
          {/* Current stage banner */}
          <div className="row" style={{ gap: 8, padding: "9px 12px", borderRadius: 9, background: sm.color + "14", alignItems: "center" }}>
            <Icon name={sm.icon} size={15} color={sm.color} />
            <span style={{ fontSize: 13, fontWeight: 700, color: sm.color }}>{sm.label}</span>
            {isClosed && <span style={{ fontSize: 11, color: "var(--fg-3)" }}>· this project is {sm.label.toLowerCase()}</span>}
          </div>

          {/* Stage timeline */}
          {!isClosed && (
            <div>
              <div className="ep-detail-heading">Stage progress</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {EP_PROJ_STAGE_FLOW.map((s, i) => {
                  const m = epStageMeta(s);
                  const done = i < curIdx, cur = i === curIdx;
                  return (
                    <div key={s} className="row-tight" style={{ gap: 5, alignItems: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600,
                        padding: "3px 9px", borderRadius: 999,
                        background: cur ? m.color : done ? m.color + "22" : "var(--ink-50)",
                        color: cur ? "#fff" : done ? m.color : "var(--fg-4)" }}>
                        {done && <Icon name="check" size={10} />}{m.label}
                      </span>
                      {i < EP_PROJ_STAGE_FLOW.length - 1 && <Icon name="chevron-right" size={12} color="var(--fg-4)" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info grid */}
          <div>
            <div className="ep-detail-heading">Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {info.map(f => (
                <div key={f.label} className="row" style={{ gap: 10, alignItems: "center" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--ink-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={f.icon} size={13} color="var(--fg-3)" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, color: "var(--fg-4)" }}>{f.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textTransform: f.label === "Type" ? "capitalize" : "none" }}>{f.value}</div>
                  </div>
                </div>
              ))}
            </div>
            {p.description && <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.5 }}>{p.description}</div>}
          </div>

          {/* Key dates */}
          {dates.length > 0 && (
            <div>
              <div className="ep-detail-heading">Key dates</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {dates.map(d => (
                  <div key={d.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--ink-100)", fontSize: 12.5 }}>
                    <span style={{ color: "var(--fg-3)" }}>{d.label}</span>
                    <span style={{ fontWeight: 600, color: "var(--fg-1)" }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discussion log */}
          <div>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div className="ep-detail-heading" style={{ marginBottom: 0 }}>Discussion log {discussions.length > 0 && <span style={{ color: "var(--fg-4)", fontWeight: 400 }}>· {discussions.length}</span>}</div>
              {!showForm && !isClosed && (
                <Button variant="ghost" size="sm" icon="message-square-plus" onClick={() => { setShowForm(true); setErr(""); }}>Add discussion</Button>
              )}
            </div>

            {showForm && (
              <div style={{ margin: "10px 0 14px", padding: 12, borderRadius: 10, border: "1px solid var(--border-subtle)", background: "var(--ink-50)" }}>
                <div className="form-grid" style={{ marginBottom: 10 }}>
                  <div className="form-group">
                    <label className="label">Date</label>
                    <input className="fi" type="date" value={form.date} onChange={e => setF("date", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label">Outcome <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400, color: "var(--fg-3)" }}>(optional)</span></label>
                    <input className="fi" value={form.outcome} onChange={e => setF("outcome", e.target.value)} placeholder="e.g. Proceed to next stage" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Note <span className="req">*</span></label>
                  <textarea className="fi" rows={3} value={form.notes} onChange={e => setF("notes", e.target.value)} placeholder="What was discussed or done on site…" />
                </div>
                {err && <div className="form-err" style={{ marginTop: 8 }}><Icon name="alert-circle" size={14} color="var(--danger-700)" />{err}</div>}
                <div className="row" style={{ justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                  <Button variant="secondary" size="sm" onClick={() => { setShowForm(false); setErr(""); }}>Cancel</Button>
                  <Button variant="primary" size="sm" icon="check" onClick={submitDiscussion} disabled={saving || !form.notes.trim()}>
                    {saving ? "Saving…" : "Post discussion"}
                  </Button>
                </div>
              </div>
            )}

            {discussions.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "var(--fg-4)", padding: "6px 0" }}>No discussions recorded yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {discussions.map((d, i) => (
                  <div key={i} style={{ padding: "10px 12px", borderRadius: 9, background: "var(--ink-50)", borderLeft: "3px solid var(--brand-burgundy)" }}>
                    <div className="row" style={{ justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--fg-2)" }}>{d.by || "—"}</span>
                      <span style={{ fontSize: 11, color: "var(--fg-4)" }}>{d.date || ""}</span>
                    </div>
                    {d.notes && <div style={{ fontSize: 12.5, color: "var(--fg-1)", lineHeight: 1.5 }}>{d.notes}</div>}
                    {d.outcome && <div style={{ fontSize: 11.5, color: "var(--success-700)", marginTop: 3 }}>→ {d.outcome}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-foot">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Leave page ───────────────────────────────────────────────────────── */
function EmpLeave({ emp, leaves, leaveTypes, token, addLeave }) {
  const [showReq, setShowReq] = useStateEP(false);
  const [filter,  setFilter]  = useStateEP("all");

  const counts = useMemoEP(() => ({
    all:      leaves.length,
    pending:  leaves.filter(l => l.status === "pending").length,
    approved: leaves.filter(l => l.status === "approved").length,
    declined: leaves.filter(l => l.status === "declined").length,
  }), [leaves]);

  const filtered = useMemoEP(() =>
    filter === "all" ? leaves : leaves.filter(l => l.status === filter),
    [leaves, filter]
  );

  const remaining = (emp.leave?.annual || 22) - (emp.leave?.used || 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">My Time · Leave</div>
          <h1 className="page-title">Leave</h1>
          <div className="page-sub">{remaining} annual days remaining · {counts.pending} pending approval</div>
        </div>
        <Button variant="primary" icon="calendar-plus" onClick={() => setShowReq(true)}>Request leave</Button>
      </div>

      {/* Balance cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 22 }}>
        {[
          { label: "Annual leave",  total: emp.leave?.annual || 22, used: emp.leave?.used || 0,  color: "#1F8A52", icon: "palmtree" },
          { label: "Sick leave",    total: 10, used: 2,  color: "#2563B0", icon: "thermometer" },
          { label: "WFH days",      total: 12, used: 5,  color: "#534AB7", icon: "monitor" },
        ].map(({ label, total, used, color, icon }) => {
          const rem = total - used;
          const pct = Math.round((used / total) * 100);
          return (
            <div key={label} className="card ep-balance-card" style={{ borderTop: `3px solid ${color}` }}>
              <div className="row" style={{ gap: 12, marginBottom: 12, alignItems: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: color + "18", color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={icon} size={17} />
                </div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 10, alignItems: "baseline" }}>
                <span className="muted" style={{ fontSize: 12 }}>{used} used</span>
                <span style={{ fontWeight: 700, color, fontSize: 24, fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>{rem}</span>
              </div>
              <div className="meter">
                <span style={{ width: `${pct}%`, background: pct > 80 ? "var(--danger-500)" : pct > 60 ? "var(--warning-500)" : color }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--fg-4)" }}>
                <span>{pct}% used</span>
                <span>{total} total</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Request history */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title-lg">My requests</div>
            <div className="card-sub">{counts.all} total · {counts.approved} approved · {counts.pending} pending</div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="att-status-filter">
          {[
            { id: "all",      label: "All"      },
            { id: "pending",  label: "Pending"  },
            { id: "approved", label: "Approved" },
            { id: "declined", label: "Declined" },
          ].map(f => (
            <button
              key={f.id}
              className={"att-filter-btn" + (filter === f.id ? " att-filter-btn--active" : "")}
              onClick={() => setFilter(f.id)}
            >
              {f.label} <span className="att-filter-ct">{counts[f.id]}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>
            <Icon name="inbox" size={28} color="var(--ink-300)" />
            <div style={{ marginTop: 8 }}>No {filter === "all" ? "" : filter} requests yet</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th style={{ textAlign: "center" }}>Days</th>
                <th>Reason</th>
                <th>Submitted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lv, i) => {
                const tc = typeColor(lv.type);
                return (
                  <tr key={lv.leaveId || i}>
                    <td>
                      <span className="lreq-type-chip" style={{ background: tc + "18", color: tc, border: `1px solid ${tc}33` }}>
                        {lv.typeLbl || lv.type}
                      </span>
                    </td>
                    <td className="cell-mono">{lv.from}</td>
                    <td className="cell-mono">{lv.to}</td>
                    <td className="cell-mono" style={{ textAlign: "center", fontWeight: 700 }}>{lv.days}</td>
                    <td className="cell-muted" style={{ maxWidth: 200 }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lv.reason || "—"}</span>
                    </td>
                    <td className="cell-mono">{lv.submitted}</td>
                    <td><LeaveChip status={lv.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showReq && (
        <RequestLeaveModal
          employee={emp} leaveTypes={leaveTypes} token={token}
          onClose={() => setShowReq(false)}
          onSaved={(lv) => { addLeave(lv); setShowReq(false); }}
        />
      )}
    </div>
  );
}

/* ── Attendance page ──────────────────────────────────────────────────── */
function EmpAttend({ emp }) {
  const days = useMemoEP(() => {
    const result = [];
    const h = emp.empId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    for (let d = 1; d <= 31; d++) {
      const date = new Date(2026, 4, d);
      if (date.getMonth() !== 4) break;
      const dow = date.getDay();
      const isWeekend = dow === 0 || dow === 6;
      const isFuture  = d > 21;
      if (isWeekend) { result.push({ d, dow, status: "weekend" }); continue; }
      if (isFuture)  { result.push({ d, dow, status: "future" }); continue; }
      const n = (h + d) % 16;
      const status = n === 0 ? "absent" : n <= 1 ? "late" : n === 2 ? "wfh" : "present";
      const clockIn  = status === "late" ? `0${9 + Math.floor((35 + (h + d) % 55) / 60)}:${((35 + (h + d) % 55) % 60).toString().padStart(2,"0")} AM`
                     : status === "present" ? `0${7 + Math.floor((45 + (h + d) % 75) / 60)}:${((45 + (h + d) % 75) % 60).toString().padStart(2,"0")} AM`
                     : null;
      const clockOut = (status === "present" || status === "late") ? "06:00 PM" : null;
      const hours    = status === "wfh" ? "8:00h" : status === "present" ? `${Math.floor((480 + (h + d) % 60) / 60)}:${((480 + (h + d) % 60) % 60).toString().padStart(2,"0")}h` : status === "late" ? `${Math.floor((480 - (35 + (h + d) % 30)) / 60)}:${((480 - (35 + (h + d) % 30)) % 60).toString().padStart(2,"0")}h` : null;
      result.push({ d, dow, status, clockIn, clockOut, hours });
    }
    return result;
  }, [emp]);

  const stats = useMemoEP(() => {
    const wd = days.filter(d => d.status !== "weekend" && d.status !== "future");
    return {
      present: wd.filter(d => d.status === "present").length,
      late:    wd.filter(d => d.status === "late").length,
      wfh:     wd.filter(d => d.status === "wfh").length,
      absent:  wd.filter(d => d.status === "absent").length,
      total:   wd.length,
    };
  }, [days]);

  const S = { present: "#1F8A52", late: "#D78A14", wfh: "#2563B0", absent: "#C0263A", weekend: "var(--ink-100)", future: "var(--ink-50)" };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">My Time · Attendance</div>
          <h1 className="page-title">Attendance</h1>
          <div className="page-sub">May 2026 · {stats.present + stats.late + stats.wfh} of {stats.total} working days attended</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "Present",  value: stats.present, color: S.present, icon: "check-circle-2" },
          { label: "Late",     value: stats.late,    color: S.late,    icon: "alarm-clock" },
          { label: "WFH",      value: stats.wfh,     color: S.wfh,     icon: "monitor" },
          { label: "Absent",   value: stats.absent,  color: S.absent,  icon: "x-circle" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="kpi" style={{ borderTop: `3px solid ${color}` }}>
            <div className="lbl">{label}</div>
            <div className="val" style={{ color }}>{value}</div>
            <div className="muted" style={{ fontSize: 11.5 }}>days in May</div>
            <div className="ico" style={{ background: color + "18", color }}><Icon name={icon} size={16} /></div>
          </div>
        ))}
      </div>

      {/* Calendar heatmap */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <div className="card-title-lg">Monthly view — May 2026</div>
          <div className="row" style={{ gap: 12 }}>
            {[["Present","#1F8A52"],["Late","#D78A14"],["WFH","#2563B0"],["Absent","#C0263A"]].map(([l,c]) => (
              <span key={l} className="att-legend-item"><span className="att-legend-dot" style={{ background: c }} />{l}</span>
            ))}
          </div>
        </div>
        <div className="card-pad">
          <div className="ep-attend-cal">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
              <div key={d} className="ep-attend-cal-h">{d}</div>
            ))}
            {/* Leading empty cells for Mon=1 in May 2026 (May 1 is Fri = dow 5) */}
            {[0,1,2,3].map(i => <div key={"e"+i} />)}
            {days.map(({ d, dow, status, clockIn, hours }) => {
              const isToday = d === 21;
              const bg = status === "weekend" ? "var(--ink-50)" : status === "future" ? "transparent" : S[status] + "22";
              const border = isToday ? `2px solid var(--brand-burgundy)` : `1px solid ${status === "weekend" || status === "future" ? "var(--ink-100)" : S[status] + "44"}`;
              return (
                <div key={d} className="ep-attend-day" style={{ background: bg, border }}>
                  <span style={{ fontWeight: isToday ? 700 : 500, color: status === "future" ? "var(--fg-4)" : status === "weekend" ? "var(--fg-4)" : "var(--fg-1)" }}>{d}</span>
                  {status !== "weekend" && status !== "future" && (
                    <span className="ep-attend-day-dot" style={{ background: S[status] }} />
                  )}
                  {clockIn && <span style={{ fontSize: 9, color: "var(--fg-4)", lineHeight: 1 }}>{clockIn}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail table */}
      <div className="card">
        <div className="card-head">
          <div className="card-title-lg">Day-by-day log</div>
        </div>
        <table className="tbl">
          <thead>
            <tr><th>Date</th><th>Day</th><th>Status</th><th>Clock in</th><th>Clock out</th><th>Hours</th></tr>
          </thead>
          <tbody>
            {days.filter(d => d.status !== "weekend" && d.status !== "future").map(({ d, status, clockIn, clockOut, hours }) => {
              const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
              const date = new Date(2026, 4, d);
              const color = S[status];
              return (
                <tr key={d}>
                  <td className="cell-mono">{"2026-05-" + d.toString().padStart(2,"0")}</td>
                  <td className="cell-muted">{DOW[date.getDay()]}</td>
                  <td>
                    <span className="att-status-chip" style={{ background: color + "18", color, border: `1px solid ${color}33` }}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </td>
                  <td className="cell-mono">{clockIn || <span className="muted">—</span>}</td>
                  <td className="cell-mono">{clockOut || <span className="muted">—</span>}</td>
                  <td className="cell-mono">{hours || <span className="muted">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Payslip page ─────────────────────────────────────────────────────── */
function EmpPayslip({ emp, payslip }) {
  if (!payslip) return (
    <div className="page">
      <div className="page-head"><div><div className="eyebrow">Money · Payslip</div><h1 className="page-title">Payslip</h1></div></div>
      <div className="card card-pad" style={{ textAlign: "center", padding: "60px 20px", color: "var(--fg-3)" }}>
        <Icon name="wallet" size={32} color="var(--ink-300)" />
        <div style={{ marginTop: 10, fontSize: 13 }}>No payslip available yet for this month.</div>
      </div>
    </div>
  );

  const rows = [
    { label: "Basic salary",   value: payslip.base,                 type: "earning" },
    { label: "Allowances",     value: payslip.allowances,           type: "earning" },
    ...(payslip.overtime ? [{ label: "Overtime",  value: payslip.overtime, type: "earning" }] : []),
    ...(payslip.bonus    ? [{ label: "Bonus",     value: payslip.bonus,    type: "earning" }] : []),
    { label: "Deductions",     value: payslip.deductions,           type: "deduction" },
  ];
  const totalEarnings = (payslip.base || 0) + (payslip.allowances || 0) + (payslip.overtime || 0) + (payslip.bonus || 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Money · Payslip</div>
          <h1 className="page-title">Payslip — May 2026</h1>
          <div className="page-sub">{emp.name} · {emp.empId} · {emp.dept}</div>
        </div>
        <Button variant="secondary" icon="download">Download PDF</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Pay breakdown */}
        <div className="card">
          <div className="card-head"><div className="card-title-lg">Pay breakdown</div></div>
          <div className="card-pad">
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {rows.map(({ label, value, type }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid var(--ink-100)" }}>
                  <span style={{ fontSize: 13, color: "var(--fg-2)" }}>{label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: type === "deduction" ? "var(--danger-700)" : "var(--fg-1)" }}>
                    {type === "deduction" ? "− " : "+ "}AED {value.toLocaleString()}
                  </span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 0" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--fg-1)" }}>Net pay</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: "var(--success-700)", letterSpacing: "-0.02em" }}>
                  AED {payslip.net.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="card-head"><div className="card-title-lg">Summary</div></div>
            <div className="card-pad">
              {[
                { label: "Gross earnings", value: `AED ${totalEarnings.toLocaleString()}`, color: "var(--success-700)" },
                { label: "Total deductions", value: `AED ${(payslip.deductions || 0).toLocaleString()}`, color: "var(--danger-700)" },
                { label: "Net pay", value: `AED ${payslip.net.toLocaleString()}`, color: "var(--fg-1)", large: true },
              ].map(({ label, value, color, large }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--ink-100)", alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: large ? 16 : 13.5, fontWeight: 700, color }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: 14 }}>
                <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--fg-3)" }}>
                  <span>Deductions ratio</span>
                  <span>{Math.round((payslip.deductions / totalEarnings) * 100)}% of gross</span>
                </div>
                <div className="meter">
                  <span style={{ width: `${Math.round((payslip.deductions / totalEarnings) * 100)}%`, background: "var(--danger-400)" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div className="card-title-lg">Payment status</div></div>
            <div className="card-pad">
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: payslip.status === "ready" ? "var(--success-50)" : "var(--warning-50)",
                  color: payslip.status === "ready" ? "var(--success-700)" : "var(--warning-700)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name={payslip.status === "ready" ? "check-circle" : "clock"} size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: payslip.status === "ready" ? "var(--success-700)" : "var(--warning-700)" }}>
                    {payslip.status === "ready" ? "Ready for transfer" : payslip.status === "blocked" ? "On hold" : "Under review"}
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                    {payslip.status === "ready" ? "WPS transfer by 28 May 2026" : "Your manager will notify you"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Profile page ─────────────────────────────────────────────────────── */
function EmpProfile({ emp }) {
  const fields = [
    { group: "Personal",  items: [
      { icon: "user",        label: "Full name",    value: emp.name },
      { icon: "mail",        label: "Email",        value: emp.email },
      { icon: "phone",       label: "Phone",        value: emp.phone },
      { icon: "globe",       label: "Nationality",  value: emp.nationality },
    ]},
    { group: "Employment", items: [
      { icon: "briefcase",   label: "Job title",    value: emp.title },
      { icon: "layers",      label: "Department",   value: emp.dept },
      { icon: "bar-chart-2", label: "Grade",        value: emp.grade },
      { icon: "user",        label: "Manager",      value: emp.manager },
      { icon: "calendar",    label: "Joined",       value: emp.joined },
      { icon: "file-text",   label: "Contract",     value: emp.contract },
    ]},
    { group: "Location",   items: [
      { icon: "map-pin",     label: "Work location", value: emp.location },
    ]},
    { group: "Documents",  items: [
      { icon: "credit-card", label: "Emirates ID expires", value: emp.eidExpires || "—" },
      { icon: "shield",      label: "Visa expires", value: emp.visaExpires && emp.visaExpires !== "—" ? emp.visaExpires : "UAE National" },
    ]},
  ];

  const statusDot = { active: { color: "#1F8A52", label: "Active" }, "on-leave": { color: "#D78A14", label: "On leave" }, inactive: { color: "#C0263A", label: "Inactive" } }[emp.status] || { color: "#807379", label: emp.status };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Account · Profile</div>
          <h1 className="page-title">My Profile</h1>
          <div className="page-sub">{emp.empId} · joined {emp.joined}</div>
        </div>
      </div>

      {/* Profile hero */}
      <div className="card" style={{ marginBottom: 20, overflow: "hidden" }}>
        <div style={{ height: 90, background: "linear-gradient(135deg, var(--brand-burgundy), var(--brand-magenta))" }} />
        <div style={{ padding: "0 24px 24px", position: "relative" }}>
          <div style={{ position: "absolute", top: -38, left: 24, border: "4px solid #fff", borderRadius: "50%" }}>
            <Avatar name={emp.name} color={emp.av} size={72} />
          </div>
          <div style={{ paddingTop: 46, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{emp.name}</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>{emp.title}</div>
              <div className="row-tight" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <span className="ep-profile-tag ep-profile-tag--brand">{emp.empId}</span>
                <span className="ep-profile-tag">{emp.dept}</span>
                <span className="ep-profile-tag">Grade {emp.grade}</span>
                <span className="row-tight" style={{ gap: 4, fontSize: 12, fontWeight: 600, color: statusDot.color, alignItems: "center" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusDot.color, display: "inline-block" }} />
                  {statusDot.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Field groups */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {fields.map(({ group, items }) => (
          <div key={group} className="card">
            <div className="card-head"><div className="card-title-lg">{group}</div></div>
            <div className="card-pad" style={{ paddingTop: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {items.map(({ icon, label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--ink-100)" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--ink-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name={icon} size={14} color="var(--fg-3)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, color: "var(--fg-4)", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Request leave modal ──────────────────────────────────────────────── */
function RequestLeaveModal({ employee, leaveTypes, token, onClose, onSaved }) {
  const [form, setForm] = useStateEP({ type: "annual", from: "", to: "", reason: "" });
  const [loading, setLoading] = useStateEP(false);
  const [err, setErr] = useStateEP("");
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErr(""); };

  const days = (() => {
    if (!form.from || !form.to) return 0;
    const diff = Math.round((new Date(form.to) - new Date(form.from)) / 86400000) + 1;
    return Math.max(0, diff);
  })();

  const selLt = leaveTypes.find(t => (t.typeId || t.id) === form.type);
  const tc = selLt?.color || "var(--brand-burgundy)";

  const handleSubmit = async () => {
    if (!form.from || !form.to) { setErr("Please select start and end dates."); return; }
    if (days < 1) { setErr("End date must be on or after start date."); return; }
    setLoading(true);
    try {
      const fmtDate = (s) => { const d = new Date(s); const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return d.getDate() + " " + m[d.getMonth()] + " " + d.getFullYear(); };
      const body = {
        leaveId: "LR-" + Math.floor(9000 + Math.random() * 9000),
        empId: employee.empId, emp: employee.name, dept: employee.dept,
        type: form.type, typeLbl: selLt?.name || form.type,
        from: fmtDate(form.from), to: fmtDate(form.to), days,
        reason: form.reason.trim() || "—", status: "pending",
        submitted: fmtDate(new Date().toISOString().slice(0, 10)),
        approver: employee.manager,
      };
      const res = await fetch(`${API}/leave-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      const saved = await res.json();
      onSaved({ ...saved, id: saved.leaveId });
    } catch { setErr("Could not submit. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-head-icon" style={{ background: tc + "18", color: tc }}>
            <Icon name={selLt?.icon || "calendar-plus"} size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-title">Request leave</div>
            <div className="modal-subtitle">Submit for manager approval</div>
          </div>
          <button className="icon-btn modal-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body stack" style={{ gap: 14 }}>
          <div className="form-group">
            <label className="label">Leave type</label>
            <select className="fi" value={form.type} onChange={e => set("type", e.target.value)}>
              {leaveTypes.map(t => <option key={t.typeId || t.id} value={t.typeId || t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="label">From <span className="req">*</span></label>
              <input className="fi" type="date" value={form.from} onChange={e => set("from", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">To <span className="req">*</span></label>
              <input className="fi" type="date" value={form.to} onChange={e => set("to", e.target.value)} />
            </div>
          </div>
          {days > 0 && (
            <div className="row" style={{ gap: 8, padding: "8px 12px", background: tc + "12", border: `1px solid ${tc}33`, borderRadius: 8 }}>
              <Icon name="calendar-check" size={14} color={tc} />
              <span style={{ fontSize: 12.5, color: tc, fontWeight: 600 }}>{days} day{days !== 1 ? "s" : ""} selected</span>
            </div>
          )}
          <div className="form-group">
            <label className="label">Reason <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400, color: "var(--fg-3)" }}>(optional)</span></label>
            <textarea className="fi" rows={3} value={form.reason} onChange={e => set("reason", e.target.value)} placeholder="Brief reason for leave…" />
          </div>
          {err && <div className="form-err"><Icon name="alert-circle" size={15} color="var(--danger-700)" />{err}</div>}
        </div>
        <div className="modal-foot">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="calendar-plus" onClick={handleSubmit} disabled={loading || !form.from || !form.to}>
            {loading ? "Submitting…" : "Submit request"}
          </Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EmployeePortal });

export default EmployeePortal;
