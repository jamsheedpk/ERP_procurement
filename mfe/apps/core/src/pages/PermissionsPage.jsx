import React from "react";
import { Icon, Avatar, Chip, Button } from "../legacy.jsx";
import { API_BASE as API } from "@meridian/api";
const { useState: useStateP, useEffect: useEffectP, useMemo: useMemoP, useRef: useRefP } = React;

const ROLE_DEFS = [
  {
    id: "admin",
    name: "Admin",
    color: "#6F1947",
    icon: "shield",
    desc: "Full access to all modules and settings",
    perms: { employees: "full", leave: "full", payroll: "full", recruitment: "full", reports: "full", settings: "full" },
  },
  {
    id: "hr_manager",
    name: "HR Manager",
    color: "#2563B0",
    icon: "user-cog",
    desc: "Manage employees, leaves, recruitment and reports",
    perms: { employees: "full", leave: "full", payroll: "none", recruitment: "full", reports: "view", settings: "none" },
  },
  {
    id: "finance",
    name: "Finance",
    color: "#1F8A52",
    icon: "bar-chart-2",
    desc: "View payroll, approve expenses and financial reports",
    perms: { employees: "view", leave: "view", payroll: "full", recruitment: "none", reports: "full", settings: "none" },
  },
  {
    id: "recruiter",
    name: "Recruiter",
    color: "#534AB7",
    icon: "user-plus",
    desc: "Manage job openings and the candidate pipeline",
    perms: { employees: "view", leave: "none", payroll: "none", recruitment: "full", reports: "view", settings: "none" },
  },
  {
    id: "employee",
    name: "Employee",
    color: "#A89DA3",
    icon: "user",
    desc: "Personal portal — own profile and leave requests",
    perms: { employees: "self", leave: "self", payroll: "self", recruitment: "none", reports: "none", settings: "none" },
  },
  {
    id: "viewer",
    name: "Viewer",
    color: "#D78A14",
    icon: "eye",
    desc: "Read-only access to non-sensitive modules",
    perms: { employees: "view", leave: "view", payroll: "none", recruitment: "view", reports: "view", settings: "none" },
  },
];

const MODULES = [
  { id: "employees",   label: "Employees",   icon: "users" },
  { id: "leave",       label: "Leave",       icon: "calendar-off" },
  { id: "payroll",     label: "Payroll",     icon: "wallet" },
  { id: "recruitment", label: "Recruitment", icon: "user-plus" },
  { id: "reports",     label: "Reports",     icon: "file-bar-chart" },
  { id: "settings",    label: "Settings",    icon: "settings" },
];

const PERM_META = {
  full: { label: "Full",  icon: "check-circle-2", bg: "#D1FAE5", fg: "#065F46", title: "Full access — can create, edit and delete" },
  view: { label: "View",  icon: "eye",            bg: "#DBEAFE", fg: "#1D4ED8", title: "Read-only access" },
  self: { label: "Self",  icon: "user",           bg: "#FEF3C7", fg: "#92400E", title: "Own records only" },
  none: { label: "None",  icon: "x-circle",       bg: "#F3F4F6", fg: "#9CA3AF", title: "No access" },
};

function permLevel(p) { return { full: 3, view: 2, self: 1, none: 0 }[p] || 0; }
function fullCount(role) { return MODULES.filter(m => role.perms[m.id] === "full").length; }

/* Inline role selector — auto-saves on change */
function RoleSelect({ user, onSave, saving }) {
  const ref = useRefP(null);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <select
        ref={ref}
        defaultValue={user.role}
        disabled={saving}
        onChange={e => onSave(user.id, e.target.value)}
        style={{
          height: 30, fontSize: 12.5, padding: "0 28px 0 10px", borderRadius: 7,
          border: "1px solid var(--border-subtle)", background: "var(--bg-surface)",
          color: "var(--fg-1)", fontFamily: "var(--font-sans)", cursor: "pointer",
          appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
        }}
      >
        {ROLE_DEFS.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
      </select>
      {saving && <span style={{ fontSize: 11, color: "var(--fg-3)" }}>Saving…</span>}
    </div>
  );
}

/* Permission badge cell for the matrix */
function PermCell({ perm, showLabel }) {
  const m = PERM_META[perm] || PERM_META.none;
  return (
    <span title={m.title} style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: showLabel ? "3px 10px" : "5px",
      borderRadius: 999, background: m.bg, color: m.fg,
      fontSize: 11, fontWeight: 700, cursor: "default",
    }}>
      <Icon name={m.icon} size={12} />
      {showLabel && m.label}
    </span>
  );
}

/* Single role detail panel */
function RolePanel({ role, onClose }) {
  const full = fullCount(role);
  return (
    <div className="card perm-role-panel" style={{ marginBottom: 20, borderTop: `3px solid ${role.color}` }}>
      <div className="card-head">
        <div style={{ width: 40, height: 40, borderRadius: 10, background: role.color + "18", color: role.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={role.icon} size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--fg-1)" }}>{role.name}</div>
          <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>{role.desc}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: role.color, fontWeight: 600, background: role.color + "12", padding: "4px 10px", borderRadius: 999 }}>
            {full}/{MODULES.length} full access
          </span>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
      </div>
      <div style={{ padding: "0 20px 20px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {MODULES.map(mod => {
          const perm = role.perms[mod.id] || "none";
          const m = PERM_META[perm];
          const isNone = perm === "none";
          return (
            <div key={mod.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
              borderRadius: 10, border: `1px solid ${isNone ? "var(--border-subtle)" : m.bg}`,
              background: isNone ? "var(--bg-surface)" : m.bg + "80",
              opacity: isNone ? 0.55 : 1,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: isNone ? "var(--ink-100)" : m.fg + "18", color: isNone ? "var(--fg-4)" : m.fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={mod.icon} size={15} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: isNone ? "var(--fg-3)" : "var(--fg-1)" }}>{mod.label}</div>
                <div style={{ fontSize: 11, color: m.fg, fontWeight: 700, marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name={m.icon} size={10} /> {m.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PermissionsPage() {
  const [users,      setUsers]      = useStateP([]);
  const [loading,    setLoading]    = useStateP(true);
  const [activeRole, setActiveRole] = useStateP(null);
  const [savingId,   setSavingId]   = useStateP(null);
  const [search,     setSearch]     = useStateP("");
  const [roleFilter, setRoleFilter] = useStateP("all");
  const [page,       setPage]       = useStateP(1);
  const PAGE_SIZE = 10;

  useEffectP(() => {
    fetch(`${API}/auth/users`)
      .then(r => r.json())
      .then(data => { setUsers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const stats = useMemoP(() => ({
    total:     users.length,
    active:    users.filter(u => u.active !== false).length,
    admins:    users.filter(u => u.userRole === "admin").length,
    employees: users.filter(u => u.userRole === "employee").length,
  }), [users]);

  const roleCounts = useMemoP(() => {
    const m = {};
    users.forEach(u => { m[u.role] = (m[u.role] || 0) + 1; });
    return m;
  }, [users]);

  const filtered = useMemoP(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const matchQ = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
      const matchR = roleFilter === "all" || u.userRole === roleFilter;
      return matchQ && matchR;
    });
  }, [users, search, roleFilter]);

  useEffectP(() => { setPage(1); }, [search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSaveRole = async (userId, newRole) => {
    setSavingId(userId);
    try {
      const res = await fetch(`${API}/auth/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, role: updated.role } : u));
    } catch (e) { console.error(e); } finally { setSavingId(null); }
  };

  const handleToggleActive = async (user) => {
    try {
      const res = await fetch(`${API}/auth/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !user.active }),
      });
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, active: updated.active } : u));
    } catch (e) { console.error(e); }
  };

  const displayedRole = activeRole ? ROLE_DEFS.find(r => r.id === activeRole) : null;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Settings · Access control</div>
          <h1 className="page-title">Permissions &amp; Roles</h1>
          <div className="page-sub">Manage who can see and do what across Meridian ERP</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Button variant="secondary" icon="download">Export</Button>
          <Button variant="primary" icon="user-plus">Invite user</Button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total users",  value: stats.total,     icon: "users",      color: "#6F1947" },
          { label: "Active",       value: stats.active,    icon: "check-circle-2", color: "#1F8A52" },
          { label: "Admins",       value: stats.admins,    icon: "shield",     color: "#2563B0" },
          { label: "Employees",    value: stats.employees, icon: "user",       color: "#A89DA3" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + "18", color: s.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={s.icon} size={18} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 760, color: "var(--fg-1)", letterSpacing: "-0.03em" }}>{s.value}</div>
              <div style={{ fontSize: 11.5, color: "var(--fg-3)", fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Role cards */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--fg-3)", marginBottom: 10 }}>
          Roles — click to inspect permissions
        </div>
        <div className="perm-role-strip">
          {ROLE_DEFS.map(r => {
            const cnt   = roleCounts[r.name] || 0;
            const full  = fullCount(r);
            const isActive = activeRole === r.id;
            return (
              <div
                key={r.id}
                className={"card perm-role-card" + (isActive ? " perm-role-card--active" : "")}
                style={{ borderTop: `3px solid ${r.color}`, cursor: "pointer", padding: "16px 16px 14px" }}
                onClick={() => setActiveRole(isActive ? null : r.id)}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <div className="perm-role-icon" style={{ background: r.color + "18", color: r.color }}>
                    <Icon name={r.icon} size={17} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--fg-1)" }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.desc}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: 3 }}>
                    {MODULES.map(m => {
                      const perm = r.perms[m.id] || "none";
                      const col  = PERM_META[perm];
                      return (
                        <div key={m.id} title={`${m.label}: ${col.label}`} style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: perm === "none" ? "var(--ink-200)" : col.fg,
                          opacity: perm === "none" ? 0.4 : 1,
                        }} />
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10.5, color: "var(--fg-4)" }}>{full}/{MODULES.length} full</span>
                    <div className="perm-role-count" style={{ color: r.color, background: r.color + "18", width: 26, height: 26, fontSize: 13, borderRadius: 7 }}>
                      {cnt}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role detail panel */}
      {displayedRole && (
        <div style={{ marginTop: 16 }}>
          <RolePanel role={displayedRole} onClose={() => setActiveRole(null)} />
        </div>
      )}

      {/* Full permission comparison matrix */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <div>
            <div className="card-title-lg">Permission matrix</div>
            <div className="card-sub">Compare access levels across all roles and modules</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {Object.entries(PERM_META).map(([key, m]) => (
              <span key={key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: m.fg, fontWeight: 600 }}>
                <Icon name={m.icon} size={11} /> {m.label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl perm-full-matrix">
            <thead>
              <tr>
                <th style={{ minWidth: 140, textAlign: "left" }}>Module</th>
                {ROLE_DEFS.map(r => (
                  <th key={r.id} style={{ textAlign: "center", minWidth: 90 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: r.color + "18", color: r.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={r.icon} size={13} />
                      </div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--fg-2)" }}>{r.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map(mod => (
                <tr key={mod.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--ink-100)", color: "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={mod.icon} size={13} />
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--fg-1)" }}>{mod.label}</span>
                    </div>
                  </td>
                  {ROLE_DEFS.map(r => {
                    const perm = r.perms[mod.id] || "none";
                    return (
                      <td key={r.id} style={{ textAlign: "center" }}>
                        <PermCell perm={perm} showLabel={false} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users table */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title-lg">System users</div>
            <div className="card-sub">{stats.total} accounts · {stats.active} active</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            {/* Role filter tabs */}
            <div style={{ display: "flex", gap: 4, background: "var(--ink-50)", borderRadius: 8, padding: 3 }}>
              {[["all", "All"], ["admin", "Admin"], ["employee", "Employee"]].map(([val, lbl]) => (
                <button key={val} onClick={() => setRoleFilter(val)} style={{
                  padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: roleFilter === val ? "var(--bg-surface)" : "transparent",
                  color: roleFilter === val ? "var(--fg-1)" : "var(--fg-3)",
                  boxShadow: roleFilter === val ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  fontFamily: "var(--font-sans)",
                }}>
                  {lbl}
                </button>
              ))}
            </div>
            <div style={{ position: "relative" }}>
              <Icon name="search" size={14} color="var(--fg-4)" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                className="fi"
                style={{ paddingLeft: 30, width: 190, height: 32, fontSize: 13 }}
                placeholder="Search users…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "48px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "var(--fg-3)" }}>
            <div style={{ width: 32, height: 32, border: "3px solid var(--plum-100)", borderTopColor: "var(--brand-burgundy)", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
            <span style={{ fontSize: 13 }}>Loading users…</span>
          </div>
        ) : (
          <>
            <table className="tbl">
              <thead>
                <tr>
                  <th>User</th>
                  <th>System role</th>
                  <th>ERP role</th>
                  <th>Status</th>
                  <th>Member since</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map(u => {
                  const rd = ROLE_DEFS.find(r => r.name === u.role);
                  const isActive = u.active !== false;
                  const isSaving = savingId === u.id;
                  return (
                    <tr key={u.id} style={{ opacity: isActive ? 1 : 0.55 }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                            background: u.avatar?.bg || u.av?.bg || "#F4DDE8",
                            color: u.avatar?.fg || u.av?.fg || "#6F1947",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12.5, fontWeight: 700,
                          }}>
                            {(u.name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--fg-1)" }}>{u.name}</div>
                            <div style={{ fontSize: 11.5, color: "var(--fg-3)" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Chip kind={u.userRole === "admin" ? "brand" : "default"} dot={false}>
                          {u.userRole === "admin" ? "Admin" : "Employee"}
                        </Chip>
                      </td>
                      <td>
                        <RoleSelect user={u} saving={isSaving} onSave={handleSaveRole} />
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: isActive ? "var(--success-500)" : "var(--ink-300)" }} />
                          <span style={{ fontSize: 12.5, color: isActive ? "var(--success-700)" : "var(--fg-4)", fontWeight: 500 }}>
                            {isActive ? "Active" : "Deactivated"}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12.5, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                          <button
                            title={isActive ? "Deactivate user" : "Activate user"}
                            className="icon-btn"
                            style={{ color: isActive ? "var(--fg-3)" : "var(--success-700)" }}
                            onClick={() => handleToggleActive(u)}
                          >
                            <Icon name={isActive ? "user-x" : "user-check"} size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "48px 20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "var(--fg-3)" }}>
                        <Icon name="users" size={28} color="var(--ink-300)" />
                        <span style={{ fontSize: 13 }}>No users match your search</span>
                        {search && <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setSearch("")}>Clear search</button>}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {filtered.length > PAGE_SIZE && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: 12.5, color: "var(--fg-3)" }}>
                  {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} users
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  {[
                    { icon: "chevrons-left",  action: () => setPage(1),           dis: safePage === 1 },
                    { icon: "chevron-left",   action: () => setPage(p => p - 1),  dis: safePage === 1 },
                    { icon: "chevron-right",  action: () => setPage(p => p + 1),  dis: safePage === totalPages },
                    { icon: "chevrons-right", action: () => setPage(totalPages),   dis: safePage === totalPages },
                  ].map((b, i) => (
                    <button key={i} onClick={b.action} disabled={b.dis} style={{
                      width: 30, height: 30, borderRadius: 7, border: "1px solid var(--border-subtle)",
                      background: "var(--bg-surface)", cursor: b.dis ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", opacity: b.dis ? 0.35 : 1,
                    }}>
                      <Icon name={b.icon} size={13} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { PermissionsPage });

export default PermissionsPage;
