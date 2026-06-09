/* global React, Icon, Avatar, AvatarRow, Chip, Button, Segmented, Tabs, Meter, API */
const { useState: useStateP, useMemo: useMemoP, useEffect: useEffectP } = React;

const EMP_PAGE_SIZES = [10, 25, 50, 100];

function PeoplePage({ data, onOpenEmployee, onAdd }) {
  const { employees, departments } = data;
  const [view,         setView]         = useStateP("table");
  const [dept,         setDept]         = useStateP("all");
  const [q,            setQ]            = useStateP("");
  const [showAddModal, setShowAddModal] = useStateP(false);
  const [page,         setPage]         = useStateP(1);
  const [pageSize,     setPageSize]     = useStateP(10);

  const filtered = useMemoP(() => {
    return employees.filter(e =>
      (dept === "all" || e.deptId === dept) &&
      (q === "" || (e.name + " " + e.title + " " + (e.empId || e.id) + " " + e.dept).toLowerCase().includes(q.toLowerCase()))
    );
  }, [employees, dept, q]);

  // Reset to page 1 whenever filter/search/view changes
  useEffectP(() => { setPage(1); }, [dept, q, view, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * pageSize;
  const pageRows   = filtered.slice(start, start + pageSize);

  const goTo = p => setPage(Math.max(1, Math.min(p, totalPages)));

  const pageButtons = useMemoP(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const delta = 2;
    const left  = Math.max(2, safePage - delta);
    const right = Math.min(totalPages - 1, safePage + delta);
    const range = [1];
    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push("...");
    range.push(totalPages);
    return range;
  }, [totalPages, safePage]);

  const navBtnStyle = (disabled) => ({
    width: 30, height: 30, borderRadius: 7,
    border: "1px solid var(--border-subtle)",
    background: "var(--bg-surface)",
    cursor: disabled ? "default" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    opacity: disabled ? 0.4 : 1,
  });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">People · Employees</div>
          <h1 className="page-title">Employee directory</h1>
          <div className="page-sub">{employees.length} active employees across {departments.length} departments. Full records, documents and org details.</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Button variant="secondary" icon="upload">Import CSV</Button>
          <Button variant="secondary" icon="user-cog">Bulk action</Button>
          <Button variant="primary" icon="user-plus" onClick={() => setShowAddModal(true)}>Add employee</Button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="tbl-toolbar">
          <div className="search" style={{ flex: 1, maxWidth: 320 }}>
            <Icon name="search" size={14} color="var(--fg-3)" />
            <input placeholder="Search by name, ID or role…" value={q} onChange={e => setQ(e.target.value)} />
          </div>

          <div className="segmented">
            <button className={dept === "all" ? "active" : ""} onClick={() => setDept("all")}>
              All <span className="text-mono muted" style={{ marginLeft: 4 }}>{employees.length}</span>
            </button>
            {departments.slice(0,5).map(d => (
              <button key={d.id || d.deptId} className={dept === (d.id || d.deptId) ? "active" : ""} onClick={() => setDept(d.id || d.deptId)}>
                {d.name} <span className="text-mono muted" style={{ marginLeft: 4 }}>{employees.filter(e=>e.deptId===(d.id||d.deptId)).length}</span>
              </button>
            ))}
          </div>

          <div className="grow" />
          <Button variant="ghost" size="sm" icon="filter">More filters</Button>
          <div style={{ width: 1, height: 22, background: "var(--border-subtle)" }} />
          <Segmented value={view} onChange={setView} options={[
            { value: "table", label: "Table" },
            { value: "grid",  label: "Grid" },
            { value: "org",   label: "Org chart" },
          ]} />
        </div>

        {view === "org" ? (
          <OrgChart employees={employees} onOpenEmployee={onOpenEmployee} />
        ) : view === "table" ? (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 36 }}><input type="checkbox" /></th>
                <th>Employee</th>
                <th>Title</th>
                <th>Department</th>
                <th>Manager</th>
                <th>Location</th>
                <th>Visa expires</th>
                <th>Leave used</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pageRows.map(e => {
                const leavePct = (e.leave.used / e.leave.annual) * 100;
                const visaSoon = e.visaExpires !== "—" && new Date(e.visaExpires.replace(/(\d+) (\w+) (\d+)/, '$2 $1, $3')) <= new Date(2026, 7, 1);
                return (
                  <tr key={e.empId || e.id} onClick={() => onOpenEmployee(e)}>
                    <td onClick={ev => ev.stopPropagation()}><input type="checkbox" /></td>
                    <td><AvatarRow name={e.name} sub={e.empId || e.id} color={e.av} /></td>
                    <td className="cell-strong">{e.title}</td>
                    <td><Chip kind="default" dot={false}>{e.dept}</Chip></td>
                    <td className="cell-muted">{e.manager}</td>
                    <td className="cell-muted">{e.location}</td>
                    <td className={"cell-mono " + (visaSoon ? "" : "cell-muted")} style={visaSoon ? { color: "var(--warning-700)", fontWeight: 600 } : null}>{e.visaExpires}</td>
                    <td style={{ minWidth: 130 }}>
                      <div className="row" style={{ gap: 8 }}>
                        <div style={{ flex: 1, height: 5, background: "var(--ink-100)", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ width: leavePct + "%", height: "100%", background: leavePct > 80 ? "var(--warning-500)" : "var(--brand-burgundy)" }} />
                        </div>
                        <span className="cell-mono cell-muted">{e.leave.used}/{e.leave.annual}</span>
                      </div>
                    </td>
                    <td>
                      {e.status === "active" ? <Chip kind="success">Active</Chip> :
                       e.status === "on-leave" ? <Chip kind="warning">On leave</Chip> :
                       <Chip>Inactive</Chip>}
                    </td>
                    <td onClick={ev => ev.stopPropagation()}>
                      <button className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="more-horizontal" size={15} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 18, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
            {pageRows.map(e => (
              <div key={e.empId || e.id} className="card" style={{ padding: 16, cursor: "pointer", boxShadow: "var(--shadow-xs)" }} onClick={() => onOpenEmployee(e)}>
                <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
                  <Avatar name={e.name} color={e.av} size="lg" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{e.title}</div>
                    <div className="row-tight" style={{ marginTop: 6, gap: 6 }}>
                      <Chip kind="default" dot={false}>{e.dept}</Chip>
                      <span className="cell-mono muted" style={{ fontSize: 11 }}>{e.empId || e.id}</span>
                    </div>
                  </div>
                </div>
                <div className="divider" />
                <div className="row" style={{ justifyContent: "space-between", fontSize: 11.5 }}>
                  <span className="muted"><Icon name="map-pin" size={12} /> {e.location}</span>
                  <span className="muted"><Icon name="calendar" size={12} /> {e.joined.split(" ").slice(-1)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {view !== "org" && (
          <div className="tbl-foot" style={{ flexWrap: "wrap", gap: 10 }}>
            {/* Left: count + rows per page */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "var(--fg-3)" }}>
                {start + 1}–{Math.min(start + pageSize, filtered.length)} of {filtered.length} employees
                {filtered.length < employees.length && <span style={{ color: "var(--fg-4)" }}> (filtered from {employees.length})</span>}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "var(--fg-4)" }}>Rows:</span>
                <select
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                  style={{ fontSize: 12, padding: "3px 6px", borderRadius: 6, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", color: "var(--fg-1)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                  {EMP_PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            {/* Right: page navigation */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button onClick={() => goTo(1)} disabled={safePage === 1} style={navBtnStyle(safePage === 1)}>
                <Icon name="chevrons-left" size={13} color="var(--fg-2)" />
              </button>
              <button onClick={() => goTo(safePage - 1)} disabled={safePage === 1} style={navBtnStyle(safePage === 1)}>
                <Icon name="chevron-left" size={13} color="var(--fg-2)" />
              </button>

              {pageButtons.map((btn, i) =>
                btn === "..." ? (
                  <span key={"e" + i} style={{ width: 30, textAlign: "center", fontSize: 12, color: "var(--fg-4)" }}>…</span>
                ) : (
                  <button key={btn} onClick={() => goTo(btn)} style={{
                    width: 30, height: 30, borderRadius: 7,
                    border: `1px solid ${btn === safePage ? "var(--brand-burgundy)" : "var(--border-subtle)"}`,
                    background: btn === safePage ? "var(--brand-burgundy)" : "var(--bg-surface)",
                    color: btn === safePage ? "#fff" : "var(--fg-2)",
                    fontSize: 12.5, fontWeight: btn === safePage ? 700 : 400,
                    cursor: "pointer", fontFamily: "var(--font-sans)",
                  }}>{btn}</button>
                )
              )}

              <button onClick={() => goTo(safePage + 1)} disabled={safePage === totalPages} style={navBtnStyle(safePage === totalPages)}>
                <Icon name="chevron-right" size={13} color="var(--fg-2)" />
              </button>
              <button onClick={() => goTo(totalPages)} disabled={safePage === totalPages} style={navBtnStyle(safePage === totalPages)}>
                <Icon name="chevrons-right" size={13} color="var(--fg-2)" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddEmployeeModal
          departments={departments}
          onClose={() => setShowAddModal(false)}
          onSave={(item) => { onAdd && onAdd("employee", item); setShowAddModal(false); }}
        />
      )}
    </div>
  );
}

function AddEmployeeModal({ departments, onClose, onSave }) {
  const AV_COLORS = [
    { bg: "#F4DDE8", fg: "#6F1947" }, { bg: "#E8F5EE", fg: "#136138" },
    { bg: "#E8EFF8", fg: "#163E73" }, { bg: "#FCF2E1", fg: "#8B560A" },
    { bg: "#FBE2EC", fg: "#6F1947" }, { bg: "#FBEAEC", fg: "#841422" },
  ];
  const [form, setForm] = useStateP({
    name: "", title: "", deptId: departments[0]?.deptId || departments[0]?.id || "",
    grade: "L3", manager: "", email: "", phone: "",
    location: "", nationality: "", contract: "Permanent", salary: "",
  });
  const [saving, setSaving] = useStateP(false);
  const [err, setErr] = useStateP("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const initials = form.name.trim().split(/\s+/).slice(0,2).map(w => w[0]).join("").toUpperCase() || "?";

  const handleSubmit = async () => {
    if (!form.name.trim()) { setErr("Full name is required."); return; }
    if (!form.email.trim()) { setErr("Email address is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setErr("Enter a valid email address."); return; }
    setSaving(true); setErr("");
    const dept = departments.find(d => (d.deptId || d.id) === form.deptId);
    const av = AV_COLORS[Math.floor(Math.random() * AV_COLORS.length)];
    const body = {
      empId: "EMP-" + (4000 + Math.floor(Math.random() * 999)),
      name: form.name.trim(), title: form.title.trim(),
      dept: dept?.name || "", deptId: form.deptId,
      grade: form.grade, manager: form.manager.trim(),
      email: form.email.toLowerCase().trim(), phone: form.phone.trim(),
      location: form.location.trim(), nationality: form.nationality.trim(),
      contract: form.contract, salary: parseFloat(form.salary) || 0,
      joined: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      visaExpires: "—", eidExpires: "—",
      leave: { annual: 22, used: 0 }, status: "active", av,
    };
    try {
      const res = await fetch(`${API}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      onSave({ ...saved, id: saved.empId });
    } catch (e) { setErr(e.message || "Failed to save. Please try again."); }
    finally { setSaving(false); }
  };

  const deptName = departments.find(d => (d.deptId || d.id) === form.deptId)?.name || "";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="modal-head">
          <div className="modal-head-icon">
            <Icon name="user-plus" size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-title">Add new employee</div>
            <div className="modal-subtitle">Employee will be marked active immediately on save.</div>
          </div>
          <button className="icon-btn modal-close" onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="modal-body">

          {/* Live preview card */}
          <div className="emp-preview">
            <div className="emp-preview-av">
              {initials || <Icon name="user" size={20} color="var(--brand-burgundy)" />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="emp-preview-name">{form.name || <span style={{ color: "var(--fg-3)", fontWeight: 400 }}>Full name will appear here</span>}</div>
              <div className="emp-preview-meta">
                {[form.title, deptName, form.grade].filter(Boolean).join(" · ") || "Fill in the details below"}
              </div>
            </div>
            {form.name && (
              <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                <Chip kind="success" dot>Active</Chip>
              </div>
            )}
          </div>

          {/* ── Group 1: Identity ── */}
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="form-group span-2">
              <label className="label">Full name <span className="req">*</span></label>
              <input
                className={"fi" + (err && !form.name ? " fi-error" : "")}
                value={form.name}
                onChange={e => { set("name", e.target.value); err && setErr(""); }}
                placeholder="e.g. Sarah Al-Rashidi"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="label">Job title</label>
              <input className="fi" value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Senior Analyst" />
            </div>
            <div className="form-group">
              <label className="label">Nationality</label>
              <input className="fi" value={form.nationality} onChange={e => set("nationality", e.target.value)} placeholder="e.g. Indian" />
            </div>
          </div>

          <div className="form-divider" />

          {/* ── Group 2: Employment ── */}
          <div className="form-grid" style={{ marginBottom: 16, marginTop: 16 }}>
            <div className="form-group">
              <label className="label">Department</label>
              <select className="fi" value={form.deptId} onChange={e => set("deptId", e.target.value)}>
                {departments.map(d => <option key={d.deptId || d.id} value={d.deptId || d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Grade</label>
              <select className="fi" value={form.grade} onChange={e => set("grade", e.target.value)}>
                {["L1","L2","L3","L4","L5","M3","M4","M5"].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group span-2">
              <label className="label">Reporting manager</label>
              <input className="fi" value={form.manager} onChange={e => set("manager", e.target.value)} placeholder="Direct manager's full name" />
            </div>
            <div className="form-group">
              <label className="label">Contract type</label>
              <select className="fi" value={form.contract} onChange={e => set("contract", e.target.value)}>
                {["Permanent","Probation","Contract","Part-time"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Monthly salary (AED)</label>
              <input className="fi" type="number" min="0" value={form.salary} onChange={e => set("salary", e.target.value)} placeholder="e.g. 15000" />
            </div>
          </div>

          <div className="form-divider" />

          {/* ── Group 3: Contact ── */}
          <div className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label className="label">Work email <span className="req">*</span></label>
              <input
                className={"fi" + (err && !form.email ? " fi-error" : "")}
                type="email"
                value={form.email}
                onChange={e => { set("email", e.target.value); err && setErr(""); }}
                placeholder="name@meridian.ae"
              />
            </div>
            <div className="form-group">
              <label className="label">Phone</label>
              <input className="fi" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+971 50 000 0000" />
            </div>
            <div className="form-group span-2">
              <label className="label">Office location</label>
              <input className="fi" value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. DIFC Office, Dubai" />
            </div>
          </div>

          {err && (
            <div className="form-err" style={{ marginTop: 16 }}>
              <Icon name="alert-circle" size={15} color="var(--danger-700)" />
              {err}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="modal-foot">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="user-plus" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : "Add employee"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ===== Employee detail drawer ===== */
function EmployeeDrawer({ employee, onClose, departments = [], onUpdate, onDelete }) {
  const [tab, setTab] = useStateP("overview");
  const [showEdit, setShowEdit] = useStateP(false);
  const [showDelete, setShowDelete] = useStateP(false);
  const [docs, setDocs] = useStateP(null);
  const [leaves, setLeaves] = useStateP(null);
  const [payrollRuns, setPayrollRuns] = useStateP(null);
  const [notes, setNotes] = useStateP(null);

  const empId = employee ? (employee.empId || employee.id) : null;

  /* fetch tab data on demand */
  React.useEffect(() => {
    if (!empId) return;
    setDocs(null); setLeaves(null); setPayrollRuns(null); setNotes(null);
  }, [empId]);

  React.useEffect(() => {
    if (!empId || tab !== "documents" || docs !== null) return;
    fetch(`${API}/documents?empId=${empId}`)
      .then(r => r.json()).then(setDocs).catch(() => setDocs([]));
  }, [tab, empId]);

  React.useEffect(() => {
    if (!empId || tab !== "leave" || leaves !== null) return;
    fetch(`${API}/leave-requests?empId=${empId}`)
      .then(r => r.json()).then(setLeaves).catch(() => setLeaves([]));
  }, [tab, empId]);

  React.useEffect(() => {
    if (!empId || tab !== "payroll" || payrollRuns !== null) return;
    fetch(`${API}/payroll`)
      .then(r => r.json())
      .then(runs => {
        const filtered = runs.map(run => ({
          ...run,
          line: run.lines?.find(l => l.empId === empId) || null,
        })).filter(r => r.line);
        setPayrollRuns(filtered);
      }).catch(() => setPayrollRuns([]));
  }, [tab, empId]);

  React.useEffect(() => {
    if (!empId || tab !== "notes" || notes !== null) return;
    fetch(`${API}/notes?empId=${empId}`)
      .then(r => r.json()).then(setNotes).catch(() => setNotes([]));
  }, [tab, empId]);

  if (!employee) return null;

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-head" style={{ padding: 0, border: 0 }}>
          <div style={{ flex: 1 }}>
            <div className="profile-hero" style={{ borderRadius: 0, padding: "28px 28px 22px" }}>
              <Avatar name={employee.name} color={{ bg: "var(--brand-pink)", fg: "var(--plum-900)" }} size="xl" />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="nm">{employee.name}</div>
                <div className="ttl">{employee.title}</div>
                <div className="meta-row">
                  <span><Icon name="hash" size={12} /> <span className="text-mono">{empId}</span></span>
                  <span><Icon name="map-pin" size={12} /> {employee.location}</span>
                  <span><Icon name="calendar" size={12} /> Joined {employee.joined}</span>
                </div>
              </div>
              <button className="icon-btn" onClick={onClose} style={{ color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.1)", position: "relative", zIndex: 1 }}>
                <Icon name="x" size={18} color="#fff" />
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 24px 0", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <Tabs active={tab} onChange={setTab} tabs={[
            { id: "overview",  label: "Overview" },
            { id: "documents", label: "Documents", count: docs ? docs.length : undefined },
            { id: "leave",     label: "Leave" },
            { id: "payroll",   label: "Payroll" },
            { id: "notes",     label: "Notes",     count: notes ? notes.length : undefined },
          ]} />
        </div>

        <div className="drawer-body">
          {tab === "overview" && (
            <div className="stack" style={{ gap: 20 }}>
              <div className="card card-pad">
                <div className="label" style={{ marginBottom: 14 }}>Employment</div>
                <div className="attr-grid">
                  <div className="attr"><div className="k">Department</div><div className="v">{employee.dept}</div></div>
                  <div className="attr"><div className="k">Grade</div><div className="v mono">{employee.grade}</div></div>
                  <div className="attr"><div className="k">Manager</div><div className="v">{employee.manager}</div></div>
                  <div className="attr"><div className="k">Contract</div><div className="v">{employee.contract}</div></div>
                  <div className="attr"><div className="k">Joined</div><div className="v mono">{employee.joined}</div></div>
                  <div className="attr"><div className="k">Tenure</div><div className="v">~{Math.max(0, Math.floor((new Date(2026,4,21) - new Date(employee.joined.replace(/(\d+) (\w+) (\d+)/, '$2 $1, $3'))) / 31536000000))} yrs</div></div>
                </div>
              </div>

              <div className="card card-pad">
                <div className="label" style={{ marginBottom: 14 }}>Contact</div>
                <div className="attr-grid">
                  <div className="attr"><div className="k">Email</div><div className="v mono" style={{ fontSize: 12.5 }}>{employee.email}</div></div>
                  <div className="attr"><div className="k">Phone</div><div className="v mono">{employee.phone}</div></div>
                  <div className="attr"><div className="k">Nationality</div><div className="v">{employee.nationality}</div></div>
                  <div className="attr"><div className="k">Location</div><div className="v">{employee.location}</div></div>
                </div>
              </div>

              <div className="card card-pad">
                <div className="label" style={{ marginBottom: 14 }}>Leave balance — 2026</div>
                <div className="stack" style={{ gap: 10 }}>
                  <LeaveBar label="Annual leave" used={employee.leave.used} total={employee.leave.annual} />
                  <LeaveBar label="Sick leave" used={2} total={15} kind="success" />
                </div>
              </div>
            </div>
          )}

          {tab === "documents" && (
            <DrawerDocuments docs={docs} />
          )}

          {tab === "leave" && (
            <DrawerLeave leaves={leaves} employee={employee} />
          )}

          {tab === "payroll" && (
            <DrawerPayroll runs={payrollRuns} />
          )}

          {tab === "notes" && (
            <DrawerNotes notes={notes} employee={employee} onNoteAdded={n => setNotes(prev => [n, ...(prev || [])])} />
          )}
        </div>

        <div className="drawer-foot">
          <Button variant="ghost" size="sm" icon="trash-2" onClick={() => setShowDelete(true)} style={{ color: "var(--danger-700)" }}>Delete</Button>
          <div className="row" style={{ gap: 8 }}>
            <Button variant="secondary" size="sm" icon="edit" onClick={() => setShowEdit(true)}>Edit</Button>
            <Button variant="primary" size="sm">View full profile</Button>
          </div>
        </div>
      </aside>

      {showEdit && (
        <EditEmployeeModal
          employee={employee}
          departments={departments}
          onClose={() => setShowEdit(false)}
          onSaved={updated => {
            setShowEdit(false);
            onUpdate && onUpdate(updated);
          }}
        />
      )}

      {showDelete && (
        <DeleteEmployeeModal
          employee={employee}
          onClose={() => setShowDelete(false)}
          onDeleted={() => onDelete && onDelete(employee.empId || employee.id)}
        />
      )}
    </>
  );
}

/* ── Documents tab ── */
function DrawerDocuments({ docs }) {
  const CAT_ICON  = { contract: "file-text", policy: "book-open", template: "layout", certificate: "award", nda: "shield", letter: "mail" };
  const CAT_COLOR = { contract: "#6F1947", policy: "#2563B0", template: "#1F8A52", certificate: "#D78A14", nda: "#C0263A", letter: "#534AB7" };
  const STATUS_KIND = { active: "success", draft: "default", pending_signature: "warning", expired: "danger" };
  const STATUS_LBL  = { active: "Active", draft: "Draft", pending_signature: "Pending sign", expired: "Expired" };

  if (!docs) return <DrawerLoading />;
  if (!docs.length) return <DrawerEmpty icon="file-x" msg="No documents on file." />;

  const btnBase = {
    width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border-subtle)",
    background: "var(--bg-surface)", display: "flex", alignItems: "center",
    justifyContent: "center", cursor: "pointer",
  };
  const btnDisabled = { ...btnBase, opacity: 0.35, cursor: "default", pointerEvents: "none" };

  return (
    <div className="stack" style={{ gap: 10 }}>
      {docs.map(doc => {
        const color   = CAT_COLOR[doc.category] || "var(--fg-2)";
        const hasFile = !!doc.filePath;
        return (
          <div key={doc.docId} className="card card-pad" style={{ padding: "14px 16px" }}>
            <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: color + "18",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={CAT_ICON[doc.category] || "file"} size={16} color={color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 3 }}>{doc.title}</div>
                <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <Chip kind="default" dot={false}>{doc.category}</Chip>
                  <Chip kind={STATUS_KIND[doc.status] || "default"} dot={false}>{STATUS_LBL[doc.status] || doc.status}</Chip>
                  {(doc.fileName || doc.fileType) && (
                    <span className="cell-mono muted" style={{ fontSize: 11.5 }}>
                      {doc.fileName || doc.fileType}{doc.fileSizeMB ? ` · ${doc.fileSizeMB} MB` : ""}
                    </span>
                  )}
                </div>
                <div className="row" style={{ gap: 16, fontSize: 12, color: "var(--fg-3)" }}>
                  {doc.issuedDate && <span><Icon name="calendar" size={11} /> Issued {doc.issuedDate}</span>}
                  {doc.expiryDate && <span><Icon name="clock" size={11} /> Expires {doc.expiryDate}</span>}
                </div>
                {doc.notes && <div style={{ marginTop: 6, fontSize: 12, color: "var(--fg-3)", fontStyle: "italic" }}>{doc.notes}</div>}
              </div>
              <div className="row" style={{ gap: 6, flexShrink: 0, alignItems: "center" }}>
                {doc.signedByEmp && <span title="Signed by employee"><Icon name="check-circle" size={14} color="var(--success-600)" /></span>}
                {doc.signedByHR  && <span title="Signed by HR"><Icon name="check-circle" size={14} color="var(--brand-burgundy)" /></span>}
                {/* View */}
                {hasFile ? (
                  <a href={doc.filePath} target="_blank" rel="noopener noreferrer" title="View file"
                    style={{ ...btnBase, textDecoration: "none" }}>
                    <Icon name="eye" size={13} color="var(--fg-2)" />
                  </a>
                ) : (
                  <span style={btnDisabled} title="No file attached">
                    <Icon name="eye" size={13} color="var(--fg-2)" />
                  </span>
                )}
                {/* Download */}
                {hasFile ? (
                  <a href={doc.filePath} download={doc.fileName || doc.title} title="Download file"
                    style={{ ...btnBase, textDecoration: "none" }}>
                    <Icon name="download" size={13} color="var(--fg-2)" />
                  </a>
                ) : (
                  <span style={btnDisabled} title="No file attached">
                    <Icon name="download" size={13} color="var(--fg-2)" />
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Leave tab ── */
function DrawerLeave({ leaves, employee }) {
  const STATUS_KIND = { pending: "warning", approved: "success", rejected: "danger" };
  const TYPE_ICON   = { annual: "sun", sick: "thermometer", hajj: "star", unpaid: "minus-circle", emergency: "alert-triangle" };

  if (!leaves) return <DrawerLoading />;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card card-pad">
        <div className="label" style={{ marginBottom: 14 }}>Leave balance — 2026</div>
        <div className="stack" style={{ gap: 10 }}>
          <LeaveBar label="Annual leave" used={employee.leave.used} total={employee.leave.annual} />
          <LeaveBar label="Sick leave" used={2} total={15} kind="success" />
        </div>
      </div>

      <div>
        <div className="label" style={{ marginBottom: 10 }}>Leave history</div>
        {!leaves.length ? (
          <DrawerEmpty icon="calendar-off" msg="No leave requests found." />
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {leaves.map(lr => (
              <div key={lr.leaveId} className="card card-pad" style={{ padding: "12px 16px" }}>
                <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--ink-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={TYPE_ICON[lr.type] || "calendar"} size={14} color="var(--fg-2)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{lr.typeLbl}</span>
                      <Chip kind={STATUS_KIND[lr.status] || "default"} dot={false}>{lr.status}</Chip>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
                      {lr.from} → {lr.to} · <strong>{lr.days} day{lr.days !== 1 ? "s" : ""}</strong>
                    </div>
                    {lr.reason && <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 4, fontStyle: "italic" }}>{lr.reason}</div>}
                    <div style={{ fontSize: 11.5, color: "var(--fg-4)", marginTop: 4 }}>
                      Submitted {lr.submitted} · Approver: {lr.approver}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Payroll tab ── */
function DrawerPayroll({ runs }) {
  const FMT = n => "AED " + (n || 0).toLocaleString();
  const RUN_KIND  = { draft: "default", review: "warning", approved: "success", paid: "success" };
  const LINE_KIND = { paid: "success", ready: "default", review: "warning", blocked: "danger" };
  const LINE_ICON = { paid: "check-circle", ready: "clock", review: "alert-circle", blocked: "x-circle" };

  if (!runs) return <DrawerLoading />;
  if (!runs.length) return <DrawerEmpty icon="wallet" msg="No payroll records found for this employee." />;

  return (
    <div className="stack" style={{ gap: 10 }}>
      {runs.map(run => {
        const lineStatus = run.line.status || "ready";
        return (
          <div key={run.runId} className="card card-pad" style={{ padding: "14px 16px" }}>
            {/* Header: period + run status */}
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{run.period}</div>
                <div className="cell-mono muted" style={{ fontSize: 11.5 }}>{run.runId}</div>
              </div>
              <Chip kind={RUN_KIND[run.status] || "default"} dot={false}>{run.status}</Chip>
            </div>

            {/* Salary line status badge */}
            <div className="row" style={{ alignItems: "center", gap: 6, marginBottom: 12, padding: "7px 10px", borderRadius: 8, background: lineStatus === "paid" ? "var(--success-50)" : lineStatus === "blocked" ? "var(--danger-50)" : lineStatus === "review" ? "var(--warning-50)" : "var(--ink-100)" }}>
              <Icon name={LINE_ICON[lineStatus] || "clock"} size={13} color={lineStatus === "paid" ? "var(--success-700)" : lineStatus === "blocked" ? "var(--danger-700)" : lineStatus === "review" ? "var(--warning-700)" : "var(--fg-3)"} />
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: "capitalize", color: lineStatus === "paid" ? "var(--success-700)" : lineStatus === "blocked" ? "var(--danger-700)" : lineStatus === "review" ? "var(--warning-700)" : "var(--fg-2)" }}>
                Salary {lineStatus}
              </span>
            </div>

            {/* Breakdown grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
              <div><div className="k" style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 2 }}>Basic salary</div><div className="cell-mono" style={{ fontSize: 13 }}>{FMT(run.line.base)}</div></div>
              <div><div className="k" style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 2 }}>Allowances</div><div className="cell-mono" style={{ fontSize: 13 }}>{FMT(run.line.allowances)}</div></div>
              {run.line.overtime > 0 && <div><div className="k" style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 2 }}>Overtime</div><div className="cell-mono" style={{ fontSize: 13, color: "var(--success-700)" }}>+{FMT(run.line.overtime)}</div></div>}
              {run.line.bonus > 0    && <div><div className="k" style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 2 }}>Bonus</div><div className="cell-mono" style={{ fontSize: 13, color: "var(--success-700)" }}>+{FMT(run.line.bonus)}</div></div>}
              <div><div className="k" style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 2 }}>Deductions</div><div className="cell-mono" style={{ fontSize: 13, color: "var(--danger-700)" }}>−{FMT(run.line.deductions)}</div></div>
              <div><div className="k" style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 2 }}>Net pay</div><div className="cell-mono" style={{ fontSize: 14, fontWeight: 700 }}>{FMT(run.line.net)}</div></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Notes tab ── */
function DrawerNotes({ notes, employee, onNoteAdded }) {
  const [body, setBody] = useStateP("");
  const [kind, setKind] = useStateP("general");
  const [saving, setSaving] = useStateP(false);

  const KIND_STYLE = {
    general:      { bg: "var(--ink-100)",      fg: "var(--fg-2)",          icon: "message-square" },
    warning:      { bg: "var(--warning-50)",   fg: "var(--warning-700)",   icon: "alert-triangle" },
    commendation: { bg: "var(--success-50)",   fg: "var(--success-700)",   icon: "star" },
    performance:  { bg: "var(--brand-pink)",   fg: "var(--brand-burgundy)", icon: "bar-chart-2" },
  };

  const handleAdd = async () => {
    if (!body.trim()) return;
    setSaving(true);
    try {
      const noteId = "NOTE-" + Date.now().toString(36).toUpperCase();
      const res = await fetch(`${API}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, empId: employee.empId || employee.id, empName: employee.name, author: "HR", body: body.trim(), kind }),
      });
      if (res.ok) {
        const saved = await res.json();
        onNoteAdded(saved);
        setBody("");
        setKind("general");
      }
    } finally { setSaving(false); }
  };

  if (!notes) return <DrawerLoading />;

  return (
    <div className="stack" style={{ gap: 14 }}>
      {/* Add note */}
      <div className="card card-pad" style={{ padding: 14 }}>
        <div className="label" style={{ marginBottom: 8 }}>Add note</div>
        <textarea
          className="fi"
          rows={3}
          placeholder="Write a note about this employee…"
          value={body}
          onChange={e => setBody(e.target.value)}
          style={{ resize: "vertical", fontSize: 13 }}
        />
        <div className="row" style={{ marginTop: 10, gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
          <select className="fi" value={kind} onChange={e => setKind(e.target.value)} style={{ width: "auto", fontSize: 12 }}>
            <option value="general">General</option>
            <option value="commendation">Commendation</option>
            <option value="performance">Performance</option>
            <option value="warning">Warning</option>
          </select>
          <Button variant="primary" size="sm" icon="plus" onClick={handleAdd} disabled={saving || !body.trim()}>
            {saving ? "Saving…" : "Add note"}
          </Button>
        </div>
      </div>

      {/* Note list */}
      {!notes.length ? (
        <DrawerEmpty icon="message-square" msg="No notes yet. Add the first one above." />
      ) : (
        notes.map(note => {
          const s = KIND_STYLE[note.kind] || KIND_STYLE.general;
          return (
            <div key={note.noteId} className="card card-pad" style={{ padding: "12px 14px", borderLeft: `3px solid ${s.fg}` }}>
              <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                <Icon name={s.icon} size={14} color={s.fg} />
                <span style={{ fontWeight: 600, fontSize: 12, color: s.fg, textTransform: "capitalize" }}>{note.kind}</span>
                <span className="muted" style={{ fontSize: 11.5, marginLeft: "auto" }}>{note.author}</span>
                <span className="cell-mono muted" style={{ fontSize: 11 }}>{new Date(note.createdAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--fg-1)", lineHeight: 1.55 }}>{note.body}</div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ── Shared drawer helpers ── */
function DrawerLoading() {
  return (
    <div style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-3)" }}>
      <Icon name="loader" size={22} color="var(--ink-300)" />
    </div>
  );
}

function DrawerEmpty({ icon, msg }) {
  return (
    <div style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, color: "var(--fg-3)" }}>
      <Icon name={icon || "inbox"} size={32} color="var(--ink-300)" />
      <div style={{ fontSize: 13 }}>{msg}</div>
    </div>
  );
}

/* ===== Delete Employee Modal ===== */
function DeleteEmployeeModal({ employee, onClose, onDeleted }) {
  const [deleting, setDeleting] = useStateP(false);
  const [err, setErr]           = useStateP("");

  const handleDelete = async () => {
    setDeleting(true); setErr("");
    try {
      const res = await fetch(`${API}/employees/${employee.empId || employee.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      onDeleted();
    } catch (e) {
      setErr(e.message || "Failed to delete. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>

        <div className="modal-head">
          <div className="modal-head-icon" style={{ background: "var(--danger-50)", color: "var(--danger-700)" }}>
            <Icon name="trash-2" size={18} color="var(--danger-700)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-title">Delete employee</div>
            <div className="modal-subtitle">This action cannot be undone.</div>
          </div>
          <button className="icon-btn modal-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div className="modal-body">
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "4px 0 12px" }}>
            <Avatar name={employee.name} color={employee.av} size="lg" />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{employee.name}</div>
              <div className="muted" style={{ fontSize: 13 }}>{employee.title} · {employee.dept}</div>
              <div className="cell-mono muted" style={{ fontSize: 12, marginTop: 2 }}>{employee.empId || employee.id}</div>
            </div>
          </div>

          <div style={{ background: "var(--danger-50)", border: "1px solid var(--danger-200)", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "var(--danger-800)", lineHeight: 1.55 }}>
            <strong>Permanently deletes</strong> this employee record, including all linked data. This cannot be recovered.
          </div>

          {err && (
            <div className="form-err" style={{ marginTop: 12 }}>
              <Icon name="alert-circle" size={15} color="var(--danger-700)" /> {err}
            </div>
          )}
        </div>

        <div className="modal-foot">
          <Button variant="secondary" onClick={onClose} disabled={deleting}>Cancel</Button>
          <Button variant="primary" icon="trash-2" onClick={handleDelete} disabled={deleting}
            style={{ background: "var(--danger-700)", borderColor: "var(--danger-700)" }}>
            {deleting ? "Deleting…" : "Yes, delete employee"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ===== Edit Employee Modal ===== */
function EditEmployeeModal({ employee, departments, onClose, onSaved }) {
  const [form, setForm] = useStateP({
    name:        employee.name        || "",
    title:       employee.title       || "",
    deptId:      employee.deptId      || "",
    grade:       employee.grade       || "L3",
    manager:     employee.manager     || "",
    email:       employee.email       || "",
    phone:       employee.phone       || "",
    location:    employee.location    || "",
    nationality: employee.nationality || "",
    contract:    employee.contract    || "Permanent",
    salary:      employee.salary      || "",
    status:      employee.status      || "active",
    visaExpires: employee.visaExpires || "",
    eidExpires:  employee.eidExpires  || "",
  });
  const [saving, setSaving] = useStateP(false);
  const [err, setErr]       = useStateP("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim())  { setErr("Full name is required.");    return; }
    if (!form.email.trim()) { setErr("Email address is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setErr("Enter a valid email address."); return; }
    setSaving(true); setErr("");

    const dept = departments.find(d => (d.deptId || d.id) === form.deptId);
    const body = {
      ...form,
      name:   form.name.trim(),
      email:  form.email.toLowerCase().trim(),
      phone:  form.phone.trim(),
      dept:   dept?.name || employee.dept,
      salary: parseFloat(form.salary) || 0,
    };

    try {
      const res = await fetch(`${API}/employees/${employee.empId || employee.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      onSaved({ ...saved, id: saved.empId });
    } catch (e) {
      setErr(e.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        <div className="modal-head">
          <div className="modal-head-icon"><Icon name="user-cog" size={18} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-title">Edit employee</div>
            <div className="modal-subtitle">{employee.name} · {employee.empId || employee.id}</div>
          </div>
          <button className="icon-btn modal-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div className="modal-body">

          {/* Identity */}
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="form-group span-2">
              <label className="label">Full name <span className="req">*</span></label>
              <input className="fi" value={form.name} onChange={e => { set("name", e.target.value); setErr(""); }} placeholder="Full name" autoFocus />
            </div>
            <div className="form-group">
              <label className="label">Job title</label>
              <input className="fi" value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Senior Analyst" />
            </div>
            <div className="form-group">
              <label className="label">Nationality</label>
              <input className="fi" value={form.nationality} onChange={e => set("nationality", e.target.value)} placeholder="e.g. Indian" />
            </div>
          </div>

          <div className="form-divider" />

          {/* Employment */}
          <div className="form-grid" style={{ margin: "16px 0" }}>
            <div className="form-group">
              <label className="label">Department</label>
              <select className="fi" value={form.deptId} onChange={e => set("deptId", e.target.value)}>
                {departments.map(d => <option key={d.deptId || d.id} value={d.deptId || d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Grade</label>
              <select className="fi" value={form.grade} onChange={e => set("grade", e.target.value)}>
                {["L1","L2","L3","L4","L5","M3","M4","M5"].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group span-2">
              <label className="label">Reporting manager</label>
              <input className="fi" value={form.manager} onChange={e => set("manager", e.target.value)} placeholder="Manager's full name" />
            </div>
            <div className="form-group">
              <label className="label">Contract type</label>
              <select className="fi" value={form.contract} onChange={e => set("contract", e.target.value)}>
                {["Permanent","Probation","Contract","Part-time"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="fi" value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="active">Active</option>
                <option value="on-leave">On leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="form-group span-2">
              <label className="label">Monthly salary (AED)</label>
              <input className="fi" type="number" min="0" value={form.salary} onChange={e => set("salary", e.target.value)} placeholder="e.g. 15000" />
            </div>
          </div>

          <div className="form-divider" />

          {/* Contact */}
          <div className="form-grid" style={{ margin: "16px 0" }}>
            <div className="form-group">
              <label className="label">Work email <span className="req">*</span></label>
              <input className="fi" type="email" value={form.email} onChange={e => { set("email", e.target.value); setErr(""); }} placeholder="name@meridian.ae" />
            </div>
            <div className="form-group">
              <label className="label">Phone</label>
              <input className="fi" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+971 50 000 0000" />
            </div>
            <div className="form-group span-2">
              <label className="label">Office location</label>
              <input className="fi" value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. DIFC Office, Dubai" />
            </div>
          </div>

          <div className="form-divider" />

          {/* Documents */}
          <div className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label className="label">Visa expiry</label>
              <input className="fi" value={form.visaExpires} onChange={e => set("visaExpires", e.target.value)} placeholder="e.g. 15 Jun 2027" />
            </div>
            <div className="form-group">
              <label className="label">Emirates ID expiry</label>
              <input className="fi" value={form.eidExpires} onChange={e => set("eidExpires", e.target.value)} placeholder="e.g. 10 Jan 2028" />
            </div>
          </div>

          {err && (
            <div className="form-err" style={{ marginTop: 16 }}>
              <Icon name="alert-circle" size={15} color="var(--danger-700)" /> {err}
            </div>
          )}
        </div>

        <div className="modal-foot">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="save" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LeaveBar({ label, used, total, kind }) {
  const pct = (used / total) * 100;
  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 6, fontSize: 12.5 }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span className="text-mono muted">{used} / {total} days</span>
      </div>
      <Meter value={used} max={total} kind={kind} />
    </div>
  );
}

/* ===== Org Chart ===== */
function OrgChart({ employees, onOpenEmployee }) {
  const byManager = useMemoP(() => {
    const map = {};
    employees.forEach(e => {
      if (!map[e.manager]) map[e.manager] = [];
      map[e.manager].push(e);
    });
    return map;
  }, [employees]);

  const rootManagers = useMemoP(() => {
    const empNames = new Set(employees.map(e => e.name));
    return [...new Set(employees.map(e => e.manager))].filter(m => !empNames.has(m)).sort();
  }, [employees]);

  return (
    <div className="org-chart">
      <div className="org-children">
        {rootManagers.map(rm => (
          <OrgRootGroup key={rm} managerName={rm} byManager={byManager} onOpenEmployee={onOpenEmployee} />
        ))}
      </div>
    </div>
  );
}

function OrgRootGroup({ managerName, byManager, onOpenEmployee }) {
  const children = byManager[managerName] || [];
  return (
    <div className="org-node-wrap">
      <div className="org-virtual-card">
        <Icon name="briefcase" size={12} color="var(--fg-3)" />
        {managerName}
      </div>
      {children.length > 0 && (
        <>
          <div className="org-connector-v" />
          <div className="org-children">
            {children.map(e => (
              <OrgNode key={e.empId || e.id} emp={e} byManager={byManager} onOpenEmployee={onOpenEmployee} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OrgNode({ emp, byManager, onOpenEmployee }) {
  const children = byManager[emp.name] || [];
  return (
    <div className="org-node-wrap">
      <button className="org-emp-card" onClick={() => onOpenEmployee(emp)}>
        <Avatar name={emp.name} color={emp.av} size="sm" />
        <div className="org-emp-card-body">
          <div className="org-emp-name">{emp.name}</div>
          <div className="org-emp-title">{emp.title}</div>
          <Chip kind="default" dot={false}>{emp.dept}</Chip>
        </div>
      </button>
      {children.length > 0 && (
        <>
          <div className="org-connector-v" />
          <div className="org-children">
            {children.map(c => (
              <OrgNode key={c.empId || c.id} emp={c} byManager={byManager} onOpenEmployee={onOpenEmployee} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { PeoplePage, EmployeeDrawer });
