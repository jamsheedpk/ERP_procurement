/* global React, Icon, Avatar, Chip, Button, API */
const { useState: useStateP, useEffect: useEffectP, useMemo: useMemoP } = React;

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

const PERM_LABELS = { full: "Full", view: "View", self: "Self", none: "—" };
const PERM_COLORS = {
  full: { bg: "#D1FAE5", fg: "#065F46" },
  view: { bg: "#DBEAFE", fg: "#1D4ED8" },
  self: { bg: "#FEF3C7", fg: "#92400E" },
  none: { bg: "transparent", fg: "var(--fg-4)" },
};

function PermissionsPage() {
  const [users,    setUsers]    = useStateP([]);
  const [loading,  setLoading]  = useStateP(true);
  const [activeRole, setActiveRole] = useStateP(null);
  const [editUser,   setEditUser]   = useStateP(null);
  const [saving,     setSaving]     = useStateP(false);
  const [search,     setSearch]     = useStateP("");
  const [page,       setPage]       = useStateP(1);
  const [pageSize,   setPageSize]   = useStateP(10);

  useEffectP(() => {
    fetch(`${API}/auth/users`)
      .then(r => r.json())
      .then(data => { setUsers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const roleCounts = useMemoP(() => {
    const m = {};
    users.forEach(u => { m[u.role] = (m[u.role] || 0) + 1; });
    return m;
  }, [users]);

  const filtered = useMemoP(() => {
    const q = search.toLowerCase();
    return users.filter(u =>
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  useEffectP(() => { setPage(1); }, [search, pageSize]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage    = Math.min(page, totalPages);
  const start       = (safePage - 1) * pageSize;
  const pageRows    = filtered.slice(start, start + pageSize);
  const navBtn      = (dis) => ({ width:30, height:30, borderRadius:7, border:"1px solid var(--border-subtle)", background:"var(--bg-surface)", cursor:dis?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:dis?0.4:1 });
  const pageButtons = useMemoP(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const left  = Math.max(2, safePage - 2);
    const right = Math.min(totalPages - 1, safePage + 2);
    const r = [1];
    if (left > 2) r.push("...");
    for (let i = left; i <= right; i++) r.push(i);
    if (right < totalPages - 1) r.push("...");
    if (totalPages > 1) r.push(totalPages);
    return r;
  }, [totalPages, safePage]);

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

  const handleSaveRole = async (userId, newRole) => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/auth/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, role: updated.role } : u));
      setEditUser(null);
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const displayedRole = activeRole
    ? ROLE_DEFS.find(r => r.id === activeRole)
    : null;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Settings · Access control</div>
          <h1 className="page-title">Permissions &amp; Roles</h1>
          <div className="page-sub">{users.length} system users · {ROLE_DEFS.length} role definitions · manage who can see and do what</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Button variant="secondary" icon="download">Export users</Button>
          <Button variant="primary" icon="user-plus">Invite user</Button>
        </div>
      </div>

      {/* Role cards strip */}
      <div className="perm-role-strip" style={{ marginBottom: 22 }}>
        {ROLE_DEFS.map(r => {
          const cnt = roleCounts[r.name] || 0;
          const isActive = activeRole === r.id;
          return (
            <div
              key={r.id}
              className={"card perm-role-card" + (isActive ? " perm-role-card--active" : "")}
              style={{ borderTop: `3px solid ${r.color}`, cursor: "pointer", padding: "14px 16px" }}
              onClick={() => setActiveRole(isActive ? null : r.id)}
            >
              <div className="perm-role-icon" style={{ background: r.color + "18", color: r.color }}>
                <Icon name={r.icon} size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--fg-1)" }}>{r.name}</div>
                <div className="muted" style={{ fontSize: 11.5, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.desc}</div>
              </div>
              <div className="perm-role-count" style={{ color: r.color, background: r.color + "18" }}>
                {cnt}
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission matrix — shown when a role card is clicked */}
      {displayedRole && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-head">
            <div className="perm-role-icon" style={{ background: displayedRole.color + "18", color: displayedRole.color }}>
              <Icon name={displayedRole.icon} size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="card-title-lg">{displayedRole.name} — permission matrix</div>
              <div className="card-sub">{displayedRole.desc}</div>
            </div>
            <button className="icon-btn" onClick={() => setActiveRole(null)}><Icon name="x" size={16} /></button>
          </div>
          <div className="card-pad" style={{ paddingTop: 0 }}>
            <div className="perm-matrix">
              {MODULES.map(mod => {
                const perm = displayedRole.perms[mod.id] || "none";
                const col = PERM_COLORS[perm];
                return (
                  <div key={mod.id} className="perm-matrix-row">
                    <div className="perm-matrix-mod">
                      <Icon name={mod.icon} size={14} color="var(--fg-3)" />
                      <span>{mod.label}</span>
                    </div>
                    <span className="perm-matrix-badge" style={{ background: col.bg, color: col.fg }}>
                      {PERM_LABELS[perm]}
                    </span>
                    <div className="perm-matrix-bar">
                      <div style={{
                        height: "100%",
                        width: perm === "full" ? "100%" : perm === "view" ? "60%" : perm === "self" ? "30%" : "0%",
                        background: col.fg === "var(--fg-4)" ? "var(--ink-200)" : displayedRole.color,
                        borderRadius: 3,
                        opacity: 0.35,
                        transition: "width 0.3s",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Full permission matrix comparison */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <div>
            <div className="card-title-lg">Full permission matrix</div>
            <div className="card-sub">Compare access levels across all roles and modules</div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl perm-full-matrix">
            <thead>
              <tr>
                <th style={{ minWidth: 130 }}>Module</th>
                {ROLE_DEFS.map(r => (
                  <th key={r.id} style={{ textAlign: "center", minWidth: 100 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: r.color + "18", color: r.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={r.icon} size={13} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{r.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map(mod => (
                <tr key={mod.id}>
                  <td>
                    <div className="row-tight" style={{ gap: 8 }}>
                      <Icon name={mod.icon} size={14} color="var(--fg-3)" />
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{mod.label}</span>
                    </div>
                  </td>
                  {ROLE_DEFS.map(r => {
                    const perm = r.perms[mod.id] || "none";
                    const col = PERM_COLORS[perm];
                    return (
                      <td key={r.id} style={{ textAlign: "center" }}>
                        <span className="perm-matrix-badge" style={{ background: col.bg, color: col.fg }}>
                          {PERM_LABELS[perm]}
                        </span>
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
            <div className="card-sub">{users.length} accounts · {users.filter(u => u.active).length} active · {users.filter(u => !u.active).length} deactivated</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <div className="search-wrap" style={{ position: "relative" }}>
              <Icon name="search" size={14} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input
                className="fi"
                style={{ paddingLeft: 32, width: 200, height: 32, fontSize: 13 }}
                placeholder="Search users…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button variant="secondary" size="sm" icon="filter">Filter</Button>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--fg-3)" }}>
            <Icon name="loader" size={24} color="var(--ink-300)" />
            <div style={{ marginTop: 8, fontSize: 13 }}>Loading users…</div>
          </div>
        ) : (
          <>
          <table className="tbl">
            <thead>
              <tr>
                <th>User</th>
                <th>System role</th>
                <th>HRM role</th>
                <th>Status</th>
                <th>Member since</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(u => {
                const rd = ROLE_DEFS.find(r => r.name === u.role);
                const isEditing = editUser === u.id;
                return (
                  <tr key={u.id} style={{ opacity: u.active ? 1 : 0.5 }}>
                    <td>
                      <div className="row" style={{ gap: 10, alignItems: "center" }}>
                        <Avatar name={u.name} color={u.avatar} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{u.name}</div>
                          <div className="muted" style={{ fontSize: 11.5 }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Chip kind={u.userRole === "admin" ? "brand" : "default"} dot={false}>
                        {u.userRole === "admin" ? "Admin" : "Employee"}
                      </Chip>
                    </td>
                    <td>
                      {isEditing ? (
                        <div className="row-tight" style={{ gap: 6 }}>
                          <select
                            className="fi"
                            defaultValue={u.role}
                            id={"role-sel-" + u.id}
                            style={{ height: 28, fontSize: 12, padding: "0 8px" }}
                          >
                            {ROLE_DEFS.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                          </select>
                          <button className="btn btn-primary" style={{ fontSize: 11, padding: "3px 10px", height: 28 }}
                            disabled={saving}
                            onClick={() => {
                              const sel = document.getElementById("role-sel-" + u.id);
                              handleSaveRole(u.id, sel.value);
                            }}>
                            {saving ? "…" : "Save"}
                          </button>
                          <button className="btn btn-ghost" style={{ fontSize: 11, padding: "3px 8px", height: 28 }} onClick={() => setEditUser(null)}>Cancel</button>
                        </div>
                      ) : (
                        <span className="perm-role-tag" style={rd ? { background: rd.color + "18", color: rd.color } : {}}>
                          {rd && <Icon name={rd.icon} size={11} />}
                          {u.role || "—"}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={"perm-status-dot " + (u.active ? "active" : "inactive")} />
                      <span style={{ fontSize: 12.5, color: u.active ? "var(--success-700)" : "var(--fg-4)" }}>
                        {u.active ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="cell-mono">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td>
                      <div className="row-tight" style={{ gap: 6 }}>
                        <button className="btn btn-ghost" style={{ fontSize: 11, padding: "3px 9px" }} onClick={() => setEditUser(isEditing ? null : u.id)}>
                          <Icon name="edit-2" size={12} /> Role
                        </button>
                        <button
                          className={"btn " + (u.active ? "btn-ghost" : "btn-secondary")}
                          style={{ fontSize: 11, padding: "3px 9px" }}
                          onClick={() => handleToggleActive(u)}
                        >
                          <Icon name={u.active ? "user-x" : "user-check"} size={12} />
                          {u.active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px 20px", color: "var(--fg-3)" }}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filtered.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderTop:"1px solid var(--border-subtle)", flexWrap:"wrap", gap:8 }}>
              <div style={{ fontSize:12.5, color:"var(--fg-3)" }}>
                {start+1}–{Math.min(start+pageSize, filtered.length)} of {filtered.length} users
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:12, color:"var(--fg-3)" }}>Rows</span>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  style={{ height:28, fontSize:12, padding:"0 6px", borderRadius:6, border:"1px solid var(--border-subtle)", background:"var(--bg-surface)" }}>
                  {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <div style={{ display:"flex", gap:4 }}>
                  <button onClick={() => setPage(1)} disabled={safePage===1} style={navBtn(safePage===1)}><span style={{fontSize:12}}>«</span></button>
                  <button onClick={() => setPage(safePage-1)} disabled={safePage===1} style={navBtn(safePage===1)}><span style={{fontSize:12}}>‹</span></button>
                  {pageButtons.map((b,i) => b==="..." ? (
                    <span key={"e"+i} style={{width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"var(--fg-3)"}}>…</span>
                  ) : (
                    <button key={b} onClick={() => setPage(b)} style={{width:30,height:30,borderRadius:7,border:"1px solid var(--border-subtle)",cursor:"pointer",fontSize:12,fontWeight:b===safePage?700:400,background:b===safePage?"#2563B0":"var(--bg-surface)",color:b===safePage?"#fff":"var(--fg-1)"}}>
                      {b}
                    </button>
                  ))}
                  <button onClick={() => setPage(safePage+1)} disabled={safePage===totalPages} style={navBtn(safePage===totalPages)}><span style={{fontSize:12}}>›</span></button>
                  <button onClick={() => setPage(totalPages)} disabled={safePage===totalPages} style={navBtn(safePage===totalPages)}><span style={{fontSize:12}}>»</span></button>
                </div>
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
