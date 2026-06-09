/* global React, Icon, Avatar, Card, Chip, Button, IconButton */
const {
  useState:    useStateTR,
  useMemo:     useMemoTR,
  useEffect:   useEffectTR,
  useCallback: useCallbackTR,
} = React;

const TR_CATS = {
  technical:  { label: "Technical",      color: "#2563B0", icon: "code-2" },
  leadership: { label: "Leadership",     color: "#6F1947", icon: "crown" },
  compliance: { label: "Compliance",     color: "#C0263A", icon: "shield-check" },
  soft:       { label: "Soft Skills",    color: "#1F8A52", icon: "heart-handshake" },
  safety:     { label: "Health & Safety",color: "#D78A14", icon: "hard-hat" },
  product:    { label: "Product",        color: "#534AB7", icon: "package" },
};

const TR_STATUS = {
  active:    { label: "Active",     color: "#1F8A52", bg: "#ECFDF5" },
  upcoming:  { label: "Upcoming",   color: "#2563B0", bg: "#EFF6FF" },
  completed: { label: "Completed",  color: "#A89DA3", bg: "var(--ink-100)" },
  mandatory: { label: "Mandatory",  color: "#C0263A", bg: "#FFF1F2" },
};

// ── ProgressRing ───────────────────────────────────────────────────────────────
function ProgressRing({ completed, enrolled, color, size = 44 }) {
  const pct = enrolled ? Math.round(completed / enrolled * 100) : 0;
  const r    = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100 * circ);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--ink-100)" strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 10.5, fontWeight: 700, color }}>
        {pct}%
      </div>
    </div>
  );
}

// ── CourseFormModal ────────────────────────────────────────────────────────────
function CourseFormModal({ initial, onClose, onSave }) {
  const blank = { title: "", cat: "technical", status: "active", duration: "", provider: "", dueDate: "", desc: "" };
  const [form, setForm] = useStateTR(initial || blank);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const isEdit = !!initial;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontWeight: 700, fontSize: 15 }}>{isEdit ? "Edit Course" : "Add Course"}</div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label className="form-label">Course Title *</label>
            <input className="form-input" placeholder="e.g. AWS Solutions Architect" value={form.title} onChange={set("title")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-row">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.cat} onChange={set("cat")}>
                {Object.entries(TR_CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={set("status")}>
                {Object.entries(TR_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-row">
              <label className="form-label">Duration</label>
              <input className="form-input" placeholder="e.g. 8h" value={form.duration} onChange={set("duration")} />
            </div>
            <div className="form-row">
              <label className="form-label">Provider</label>
              <input className="form-input" placeholder="e.g. LinkedIn Learning" value={form.provider} onChange={set("provider")} />
            </div>
          </div>
          <div className="form-row">
            <label className="form-label">Due Date</label>
            <input className="form-input" placeholder="e.g. 30 Jun 2026 (leave blank if none)" value={form.dueDate} onChange={set("dueDate")} />
          </div>
          <div className="form-row">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} placeholder="Brief overview of the course content…"
              value={form.desc} onChange={set("desc")}
              style={{ resize: "vertical", fontFamily: "inherit", fontSize: 13 }} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.title.trim()}>
            {isEdit ? "Save Changes" : "Add Course"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EnrollModal ────────────────────────────────────────────────────────────────
function EnrollModal({ course, employees, onClose, onSave }) {
  const [checked, setChecked] = useStateTR(() => new Set(course.enrolledEmpIds || []));
  const toggle = id => setChecked(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const all = employees.length;
  const selected = checked.size;

  function save() {
    const prev = new Set(course.enrolledEmpIds || []);
    const add    = [...checked].filter(id => !prev.has(id));
    const remove = [...prev].filter(id => !checked.has(id));
    onSave(add, remove);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Enroll Employees</div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{course.title}</div>
          </div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div className="modal-body" style={{ maxHeight: 380, overflowY: "auto" }}>
          <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 12 }}>
            {selected} of {all} selected
          </div>
          {employees.map(emp => {
            const isChecked = checked.has(emp.empId);
            return (
              <div key={emp.empId}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                  borderBottom: "1px solid var(--border-subtle)", cursor: "pointer" }}
                onClick={() => toggle(emp.empId)}>
                <input type="checkbox" checked={isChecked} onChange={() => toggle(emp.empId)}
                  style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--brand-burgundy)" }} />
                <Avatar name={emp.name} color={emp.av} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{emp.name}</div>
                  <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{emp.title} · {emp.dept}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save Enrollment</button>
        </div>
      </div>
    </div>
  );
}

// ── TrainingPage ───────────────────────────────────────────────────────────────
function TrainingPage() {
  const [courses,   setCourses]   = useStateTR([]);
  const [employees, setEmployees] = useStateTR([]);
  const [loading,   setLoading]   = useStateTR(true);
  const [catFilter,    setCatFilter]    = useStateTR("all");
  const [statusFilter, setStatusFilter] = useStateTR("all");
  const [search,       setSearch]       = useStateTR("");
  const [selected,     setSelected]     = useStateTR(null);
  const [showAdd,      setShowAdd]      = useStateTR(false);
  const [showEdit,     setShowEdit]     = useStateTR(false);
  const [showEnroll,   setShowEnroll]   = useStateTR(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffectTR(() => {
    async function load() {
      setLoading(true);
      try {
        const [cr, er] = await Promise.all([
          fetch(`${window.API}/courses`).then(r => r.json()),
          fetch(`${window.API}/employees`).then(r => r.json()),
        ]);
        setCourses(Array.isArray(cr) ? cr : []);
        setEmployees(Array.isArray(er) ? er : []);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = useMemoTR(() => courses.filter(c => {
    if (catFilter !== "all" && c.cat !== catFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [courses, catFilter, statusFilter, search]);

  const totals = useMemoTR(() => ({
    active:      courses.filter(c => c.status === "active" || c.status === "mandatory").length,
    enrolled:    courses.reduce((s, c) => s + (c.enrolledEmpIds || []).length, 0),
    completions: courses.reduce((s, c) => s + (c.completedEmpIds || []).length, 0),
    hours:       courses.reduce((s, c) => {
      const h = parseInt(c.duration) || 0;
      return s + h * (c.enrolledEmpIds || []).length;
    }, 0),
  }), [courses]);

  const selCourse = courses.find(c => c.courseId === selected);

  // Map empId → employee for the detail pane
  const empMap = useMemoTR(() => {
    const m = {};
    employees.forEach(e => { m[e.empId] = e; });
    return m;
  }, [employees]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAdd = useCallbackTR(async (form) => {
    const courseId = "CRS-" + Date.now().toString(36).toUpperCase();
    try {
      const res = await fetch(`${window.API}/courses`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, ...form }),
      });
      const doc = await res.json();
      setCourses(prev => [...prev, doc]);
    } catch (e) { console.error(e); }
    setShowAdd(false);
  }, []);

  const handleEdit = useCallbackTR(async (form) => {
    if (!selCourse) return;
    setCourses(prev => prev.map(c => c.courseId === selCourse.courseId ? { ...c, ...form } : c));
    try {
      const res = await fetch(`${window.API}/courses/${selCourse.courseId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const doc = await res.json();
      setCourses(prev => prev.map(c => c.courseId === selCourse.courseId ? doc : c));
    } catch (e) { console.error(e); }
    setShowEdit(false);
  }, [selCourse]);

  const handleDelete = useCallbackTR(async (courseId) => {
    setCourses(prev => prev.filter(c => c.courseId !== courseId));
    setSelected(null);
    try {
      await fetch(`${window.API}/courses/${courseId}`, { method: "DELETE" });
    } catch (e) { console.error(e); }
  }, []);

  const handleEnrollSave = useCallbackTR(async (add, remove) => {
    if (!selCourse) return;
    // Optimistic
    setCourses(prev => prev.map(c => {
      if (c.courseId !== selCourse.courseId) return c;
      const enrolled  = [...new Set([...(c.enrolledEmpIds||[]).filter(id => !remove.includes(id)), ...add])];
      const completed = (c.completedEmpIds||[]).filter(id => !remove.includes(id));
      return { ...c, enrolledEmpIds: enrolled, completedEmpIds: completed, enrolledCount: enrolled.length, completedCount: completed.length };
    }));
    try {
      const res = await fetch(`${window.API}/courses/${selCourse.courseId}/enrollment`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add, remove }),
      });
      const doc = await res.json();
      setCourses(prev => prev.map(c => c.courseId === selCourse.courseId ? doc : c));
    } catch (e) { console.error(e); }
  }, [selCourse]);

  const handleToggleComplete = useCallbackTR(async (courseId, empId, done) => {
    setCourses(prev => prev.map(c => {
      if (c.courseId !== courseId) return c;
      const completed = done
        ? [...new Set([...(c.completedEmpIds||[]), empId])]
        : (c.completedEmpIds||[]).filter(id => id !== empId);
      return { ...c, completedEmpIds: completed, completedCount: completed.length };
    }));
    try {
      await fetch(`${window.API}/courses/${courseId}/complete`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empId, done }),
      });
    } catch (e) { console.error(e); }
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page">
      <div className="page-head">
        <div><div className="eyebrow">Growth</div><h1 className="page-title">Training & Development</h1></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginTop: 24 }}>
        {[1,2,3,4,5,6].map(i => <div key={i} className="card pulse" style={{ height: 110 }} />)}
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Growth</div>
          <h1 className="page-title">Training & Development</h1>
          <div className="page-sub">{courses.length} courses · {totals.enrolled} total enrollments</div>
        </div>
        <div className="row">
          <Button variant="primary" icon="plus" onClick={() => setShowAdd(true)}>Add Course</Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Active Courses",  value: totals.active,      icon: "book-open",      color: "#2563B0" },
          { label: "Total Enrolled",  value: totals.enrolled,    icon: "users",          color: "#1F8A52" },
          { label: "Completions",     value: totals.completions, icon: "check-circle-2", color: "#6F1947" },
          { label: "Learning Hours",  value: totals.hours + "h", icon: "clock",          color: "#D78A14" },
        ].map(k => (
          <div key={k.label} className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderTop: `3px solid ${k.color}` }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: k.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={k.icon} size={20} color={k.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--fg-1)" }}>{k.value}</div>
              <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={14} color="var(--fg-3)" />
          </span>
          <input className="search-input" placeholder="Search courses…" value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32, width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", ...Object.keys(TR_CATS)].map(c => (
            <button key={c} className={"pill-btn" + (catFilter === c ? " active" : "")} onClick={() => setCatFilter(c)}>
              {c === "all" ? "All Categories" : TR_CATS[c].label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", ...Object.keys(TR_STATUS)].map(s => (
            <button key={s} className={"pill-btn" + (statusFilter === s ? " active" : "")} onClick={() => setStatusFilter(s)}>
              {s === "all" ? "All" : TR_STATUS[s].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1.2fr 1fr" : "1fr", gap: 20, alignItems: "start" }}>
        {/* Course grid */}
        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map(c => {
            const cat      = TR_CATS[c.cat] || TR_CATS.technical;
            const st       = TR_STATUS[c.status] || TR_STATUS.active;
            const enrolled  = (c.enrolledEmpIds || []).length;
            const completed = (c.completedEmpIds || []).length;
            return (
              <div key={c.courseId}
                className={"card tr-course-card" + (selected === c.courseId ? " tr-course-card--active" : "")}
                style={{ borderTop: `3px solid ${cat.color}`, cursor: "pointer", padding: "16px 18px" }}
                onClick={() => setSelected(selected === c.courseId ? null : c.courseId)}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <ProgressRing completed={completed} enrolled={enrolled} color={cat.color} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--fg-1)", lineHeight: 1.3 }}>{c.title}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: cat.color + "18", color: cat.color }}>
                        <Icon name={cat.icon} size={10} color={cat.color} /> {cat.label}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--fg-3)" }}>
                  <span><Icon name="clock" size={12} color="var(--fg-3)" /> {c.duration || "—"}</span>
                  <span><Icon name="users" size={12} color="var(--fg-3)" /> {enrolled} enrolled</span>
                  <span><Icon name="building-2" size={12} color="var(--fg-3)" /> {c.provider || "—"}</span>
                </div>
                {c.dueDate && (
                  <div style={{ marginTop: 8, fontSize: 11.5, color: "#C0263A", fontWeight: 600 }}>
                    <Icon name="alert-circle" size={12} color="#C0263A" /> Due: {c.dueDate}
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "var(--fg-3)" }}>
              <Icon name="graduation-cap" size={36} color="var(--fg-3)" />
              <div style={{ marginTop: 12, fontWeight: 600 }}>No courses match your filter</div>
            </div>
          )}
        </div>

        {/* Detail pane */}
        {selCourse && (() => {
          const cat       = TR_CATS[selCourse.cat] || TR_CATS.technical;
          const st        = TR_STATUS[selCourse.status] || TR_STATUS.active;
          const enrolled  = selCourse.enrolledEmpIds  || [];
          const completed = selCourse.completedEmpIds || [];
          const pct       = enrolled.length ? Math.round(completed.length / enrolled.length * 100) : 0;

          return (
            <div className="card" style={{ position: "sticky", top: 90, padding: "18px 20px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--border-subtle)" }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: cat.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={cat.icon} size={20} color={cat.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{selCourse.title}</div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{cat.label} · {selCourse.provider}</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <IconButton icon="edit-2" title="Edit course" onClick={() => setShowEdit(true)} />
                  <IconButton icon="trash-2" title="Delete course" onClick={() => handleDelete(selCourse.courseId)} />
                  <IconButton icon="x" title="Close" onClick={() => setSelected(null)} />
                </div>
              </div>

              {/* Description */}
              {selCourse.desc && (
                <div style={{ fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.55, marginBottom: 14, padding: "10px 12px", background: "var(--ink-50)", borderRadius: 8 }}>
                  {selCourse.desc}
                </div>
              )}

              {/* Meta rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {[
                  { label: "Status",    value: st.label,                         color: st.color },
                  { label: "Duration",  value: selCourse.duration || "—" },
                  { label: "Provider",  value: selCourse.provider || "—" },
                  { label: "Enrolled",  value: enrolled.length + " employees" },
                  { label: "Completed", value: completed.length + " (" + pct + "%)" },
                  { label: "Due date",  value: selCourse.dueDate || "No deadline" },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span style={{ color: "var(--fg-3)" }}>{row.label}</span>
                    <span style={{ fontWeight: 600, color: row.color || "var(--fg-1)" }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Completion bar */}
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 6 }}>Completion</div>
              <div style={{ height: 8, borderRadius: 5, background: "var(--ink-100)", overflow: "hidden", marginBottom: 4 }}>
                <div style={{ height: "100%", width: pct + "%", background: cat.color, borderRadius: 5, transition: "width 0.4s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--fg-3)", marginBottom: 16 }}>
                <span>{completed.length} complete</span>
                <span>{enrolled.length - completed.length} in progress</span>
              </div>

              {/* Enrolled employees list */}
              {enrolled.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 10 }}>
                    Enrolled Employees
                  </div>
                  <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                    {enrolled.map(empId => {
                      const emp  = empMap[empId];
                      const done = completed.includes(empId);
                      return (
                        <div key={empId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                          <Avatar name={emp?.name || empId} color={emp?.av} size={24} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {emp?.name || empId}
                            </div>
                            <div style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{emp?.dept || ""}</div>
                          </div>
                          <button
                            title={done ? "Mark incomplete" : "Mark complete"}
                            onClick={() => handleToggleComplete(selCourse.courseId, empId, !done)}
                            style={{ padding: "3px 8px", fontSize: 11, fontWeight: 600, borderRadius: 5, border: "none", cursor: "pointer",
                              background: done ? "#1F8A5218" : "var(--ink-100)",
                              color: done ? "#1F8A52" : "var(--fg-3)" }}>
                            {done ? "✓ Done" : "Mark done"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <Button variant="primary" style={{ flex: 1 }} icon="user-plus" onClick={() => setShowEnroll(true)}>
                  Manage Enrollment
                </Button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Modals */}
      {showAdd && <CourseFormModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}

      {showEdit && selCourse && (
        <CourseFormModal
          initial={{ title: selCourse.title, cat: selCourse.cat, status: selCourse.status,
            duration: selCourse.duration, provider: selCourse.provider, dueDate: selCourse.dueDate, desc: selCourse.desc }}
          onClose={() => setShowEdit(false)}
          onSave={handleEdit}
        />
      )}

      {showEnroll && selCourse && (
        <EnrollModal
          course={selCourse}
          employees={employees}
          onClose={() => setShowEnroll(false)}
          onSave={handleEnrollSave}
        />
      )}
    </div>
  );
}

Object.assign(window, { TrainingPage });
