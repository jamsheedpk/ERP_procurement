/* global React, Icon, Avatar, Card, Chip, Button, IconButton */
const {
  useState:  useStatePF,
  useMemo:   useMemoOPF,
  useEffect: useEffectPF,
  useCallback: useCallbackPF,
} = React;

const RATING_LABELS = { 5:"Outstanding", 4:"Exceeds", 3:"Meets", 2:"Below", 1:"Unsatisfactory" };
const RATING_COLORS = { 5:"#1F8A52",    4:"#2563B0", 3:"#D78A14", 2:"#D97706", 1:"#C0263A" };

const STATUS_META = {
  completed:   { label:"Completed",   color:"#1F8A52", bg:"#ECFDF5" },
  in_progress: { label:"In Progress", color:"#D78A14", bg:"#FEF3C7" },
  not_started: { label:"Not Started", color:"#A89DA3", bg:"var(--ink-100)" },
};

const GOAL_STATUS_META = {
  on_track:  { label:"On Track",  color:"#1F8A52", bg:"#ECFDF5" },
  at_risk:   { label:"At Risk",   color:"#C0263A", bg:"#FEF2F2" },
  completed: { label:"Done",      color:"#2563B0", bg:"#EFF6FF" },
};

const GOAL_STATUS_CYCLE = { on_track:"at_risk", at_risk:"completed", completed:"on_track" };

// ── StarRating ─────────────────────────────────────────────────────────────────
function StarRating({ rating, size = 13, onRate }) {
  const [hovered, setHovered] = useStatePF(0);
  const active = hovered || rating || 0;
  const color  = RATING_COLORS[hovered || rating] || "var(--fg-3)";
  return (
    <div style={{ display:"flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          style={{ cursor: onRate ? "pointer" : "default", lineHeight:1 }}
          onMouseEnter={() => onRate && setHovered(i)}
          onMouseLeave={() => onRate && setHovered(0)}
          onClick={() => onRate && onRate(i)}>
          <Icon name="star" size={size}
            color={i <= active ? (RATING_COLORS[hovered || rating] || "#D78A14") : "var(--border-subtle)"}
            style={{ fill: i <= active ? (RATING_COLORS[hovered || rating] || "#D78A14") : "transparent" }} />
        </span>
      ))}
    </div>
  );
}

// ── GoalBar ────────────────────────────────────────────────────────────────────
function GoalBar({ progress }) {
  const color = progress >= 100 ? "#1F8A52" : progress >= 60 ? "#2563B0" : "#D78A14";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:5, borderRadius:4, background:"var(--ink-100)", overflow:"hidden" }}>
        <div style={{ height:"100%", width:Math.min(progress,100)+"%", background:color, borderRadius:4, transition:"width 0.4s" }} />
      </div>
      <span style={{ fontSize:11, fontWeight:700, color, minWidth:30, textAlign:"right" }}>{progress}%</span>
    </div>
  );
}

// ── AppraisalDetailModal ───────────────────────────────────────────────────────
function AppraisalDetailModal({ appraisal, onClose, onRating, onStatus, onComment, onSelfComment, onGoalsUpdate, onDelete }) {
  const [editComment, setEditComment] = useStatePF(false);
  const [commentDraft, setCommentDraft] = useStatePF(appraisal.managerComment || "");
  const [editSelf, setEditSelf] = useStatePF(false);
  const [selfDraft, setSelfDraft] = useStatePF(appraisal.selfComment || "");
  const [newGoal, setNewGoal] = useStatePF({ label:"", due:"" });
  const sm = STATUS_META[appraisal.reviewStatus] || STATUS_META.not_started;
  const goals = appraisal.goals || [];
  const goalsComplete = goals.filter(g => g.progress >= 100).length;

  function saveComment() {
    onComment(appraisal.appraisalId, commentDraft);
    setEditComment(false);
  }
  function saveSelf() {
    onSelfComment(appraisal.appraisalId, selfDraft);
    setEditSelf(false);
  }
  function setGoalProgress(idx, val) {
    const p = Math.max(0, Math.min(100, parseInt(val) || 0));
    const next = goals.map((g, i) => i === idx ? { ...g, progress: p } : g);
    onGoalsUpdate(appraisal.appraisalId, next);
  }
  function deleteGoal(idx) {
    onGoalsUpdate(appraisal.appraisalId, goals.filter((_, i) => i !== idx));
  }
  function addGoal() {
    if (!newGoal.label.trim()) return;
    onGoalsUpdate(appraisal.appraisalId, [...goals, { label: newGoal.label.trim(), due: newGoal.due, progress: 0 }]);
    setNewGoal({ label:"", due:"" });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:540, width:"100%" }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <Avatar name={appraisal.empName} color={appraisal.avatar} size={36} />
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>{appraisal.empName}</div>
              <div style={{ fontSize:12, color:"var(--fg-3)" }}>{appraisal.role} · {appraisal.dept}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:4 }}>
            <IconButton icon="trash-2" title="Delete appraisal" onClick={() => onDelete(appraisal.appraisalId)} />
            <IconButton icon="x" onClick={onClose} />
          </div>
        </div>

        <div className="modal-body">
          {/* Rating */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18, padding:"12px 14px", background:"var(--ink-50)", borderRadius:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", color:"var(--fg-3)", marginBottom:6 }}>Rating</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <StarRating rating={appraisal.rating} size={18}
                  onRate={r => onRating(appraisal.appraisalId, r)} />
                {appraisal.rating && (
                  <span style={{ fontSize:13, fontWeight:700, color:RATING_COLORS[appraisal.rating] }}>
                    {appraisal.rating} — {RATING_LABELS[appraisal.rating]}
                  </span>
                )}
                {!appraisal.rating && <span style={{ fontSize:12, color:"var(--fg-3)" }}>Click stars to rate</span>}
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", color:"var(--fg-3)", marginBottom:6 }}>Status</div>
              <select value={appraisal.reviewStatus}
                onChange={e => onStatus(appraisal.appraisalId, e.target.value)}
                style={{ fontSize:12, padding:"4px 8px", borderRadius:6, border:"1px solid var(--border-subtle)", background:sm.bg, color:sm.color, fontWeight:600, cursor:"pointer" }}>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Self assessment — editable */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", color:"var(--fg-3)" }}>Self-Assessment</div>
              {!editSelf && (
                <button style={{ fontSize:11.5, color:"var(--brand-burgundy)", fontWeight:600, background:"none", border:"none", cursor:"pointer", padding:0 }}
                  onClick={() => { setEditSelf(true); setSelfDraft(appraisal.selfComment || ""); }}>
                  {appraisal.selfComment ? "Edit" : "Add"}
                </button>
              )}
            </div>
            {editSelf ? (
              <div>
                <textarea value={selfDraft} onChange={e => setSelfDraft(e.target.value)} rows={3}
                  style={{ width:"100%", fontSize:13, padding:"8px 10px", borderRadius:8, border:"1px solid var(--border-subtle)", resize:"vertical", fontFamily:"inherit", color:"var(--fg-1)", background:"var(--surface)" }}
                  autoFocus />
                <div style={{ display:"flex", gap:8, marginTop:8 }}>
                  <button className="btn btn-primary" style={{ fontSize:12, padding:"5px 14px" }} onClick={saveSelf}>Save</button>
                  <button className="btn" style={{ fontSize:12, padding:"5px 14px" }} onClick={() => setEditSelf(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize:13, color: appraisal.selfComment ? "var(--fg-2)" : "var(--fg-3)", lineHeight:1.55,
                padding:"10px 12px", background:"var(--ink-50)", borderRadius:8, minHeight:36,
                fontStyle: "italic" }}>
                {appraisal.selfComment ? '"' + appraisal.selfComment + '"' : "No self-assessment yet."}
              </div>
            )}
          </div>

          {/* Manager comment */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", color:"var(--fg-3)" }}>Manager Comment</div>
              {!editComment && (
                <button style={{ fontSize:11.5, color:"var(--brand-burgundy)", fontWeight:600, background:"none", border:"none", cursor:"pointer", padding:0 }}
                  onClick={() => { setEditComment(true); setCommentDraft(appraisal.managerComment || ""); }}>
                  {appraisal.managerComment ? "Edit" : "Add comment"}
                </button>
              )}
            </div>
            {editComment ? (
              <div>
                <textarea value={commentDraft} onChange={e => setCommentDraft(e.target.value)}
                  rows={3}
                  style={{ width:"100%", fontSize:13, padding:"8px 10px", borderRadius:8, border:"1px solid var(--border-subtle)", resize:"vertical", fontFamily:"inherit", color:"var(--fg-1)", background:"var(--surface)" }}
                  autoFocus />
                <div style={{ display:"flex", gap:8, marginTop:8 }}>
                  <button className="btn btn-primary" style={{ fontSize:12, padding:"5px 14px" }} onClick={saveComment}>Save</button>
                  <button className="btn" style={{ fontSize:12, padding:"5px 14px" }} onClick={() => setEditComment(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize:13, color: appraisal.managerComment ? "var(--fg-1)" : "var(--fg-3)", lineHeight:1.55,
                padding:"10px 12px", background:"var(--ink-50)", borderRadius:8, minHeight:36,
                fontStyle: appraisal.managerComment ? "normal" : "italic" }}>
                {appraisal.managerComment || "No comment yet."}
              </div>
            )}
          </div>

          {/* Individual goals — editable */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", color:"var(--fg-3)", marginBottom:10 }}>
              Individual Goals <span style={{ color:"var(--fg-3)", fontWeight:400 }}>({goalsComplete}/{goals.length} complete)</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {goals.map((g, i) => (
                <div key={i} style={{ padding:"10px 12px", background:"var(--ink-50)", borderRadius:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6, gap:8 }}>
                    <span style={{ fontSize:12.5, fontWeight:600, flex:1, minWidth:0 }}>{g.label}</span>
                    <span style={{ fontSize:11, color:"var(--fg-3)", flexShrink:0 }}>{g.due ? "Due " + g.due : ""}</span>
                    <button onClick={() => deleteGoal(i)} title="Remove goal"
                      style={{ background:"none", border:"none", cursor:"pointer", padding:2, display:"flex", flexShrink:0 }}>
                      <Icon name="trash-2" size={13} color="#C0263A" />
                    </button>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ flex:1 }}><GoalBar progress={g.progress} /></div>
                    <input type="number" min={0} max={100} value={g.progress}
                      onChange={e => setGoalProgress(i, e.target.value)}
                      style={{ width:56, fontSize:12, padding:"3px 6px", borderRadius:6, border:"1px solid var(--border-subtle)", background:"var(--bg-surface)", color:"var(--fg-1)" }} />
                  </div>
                </div>
              ))}
              {goals.length === 0 && (
                <div style={{ fontSize:12, color:"var(--fg-4)", fontStyle:"italic", padding:"4px 0" }}>No individual goals yet.</div>
              )}
            </div>

            {/* Add goal row */}
            <div style={{ display:"flex", gap:6, marginTop:10 }}>
              <input className="form-input" placeholder="New goal…" value={newGoal.label}
                onChange={e => setNewGoal(p => ({ ...p, label:e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addGoal()}
                style={{ flex:1, fontSize:12.5 }} />
              <input className="form-input" placeholder="Due" value={newGoal.due}
                onChange={e => setNewGoal(p => ({ ...p, due:e.target.value }))}
                style={{ width:110, fontSize:12.5 }} />
              <button className="btn btn-primary" style={{ fontSize:12, padding:"0 14px" }}
                onClick={addGoal} disabled={!newGoal.label.trim()}>Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AddOrgGoalModal ────────────────────────────────────────────────────────────
function AddOrgGoalModal({ cycleId, onClose, onAdd }) {
  const [form, setForm] = useStatePF({ label:"", due:"", owner:"", progress:0 });
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  async function submit() {
    if (!form.label.trim()) return;
    const goalId = "OG-" + Date.now().toString(36).toUpperCase();
    await onAdd({ goalId, cycleId, ...form, progress: parseInt(form.progress)||0 });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontWeight:700, fontSize:15 }}>Add Company Goal</div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label className="form-label">Goal Label *</label>
            <input className="form-input" placeholder="e.g. Achieve AED 60M revenue" value={form.label} onChange={set("label")} />
          </div>
          <div className="form-row">
            <label className="form-label">Owner</label>
            <input className="form-input" placeholder="e.g. Layla Haddad" value={form.owner} onChange={set("owner")} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div className="form-row">
              <label className="form-label">Due Date</label>
              <input className="form-input" placeholder="e.g. 30 Jun 2026" value={form.due} onChange={set("due")} />
            </div>
            <div className="form-row">
              <label className="form-label">Initial Progress %</label>
              <input className="form-input" type="number" min={0} max={100} value={form.progress} onChange={set("progress")} />
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={!form.label.trim()}>Add Goal</button>
        </div>
      </div>
    </div>
  );
}

// ── NewAppraisalModal ──────────────────────────────────────────────────────────
function NewAppraisalModal({ cycle, employees, existingEmpIds, onClose, onAdd }) {
  const [empId, setEmpId] = useStatePF("");
  const available = employees.filter(e => !existingEmpIds.includes(e.empId));
  const selEmp = employees.find(e => e.empId === empId);

  async function submit() {
    if (!empId || !selEmp) return;
    const appraisalId = "APR-" + Date.now().toString(36).toUpperCase();
    await onAdd({
      appraisalId,
      cycleId: cycle.cycleId,
      empId: selEmp.empId,
      empName: selEmp.name,
      dept: selEmp.dept || "",
      role: selEmp.title || selEmp.role || "",
      avatar: selEmp.av || {},
      rating: null,
      reviewStatus: "not_started",
      managerComment: "",
      selfComment: "",
      goals: [],
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontWeight:700, fontSize:15 }}>New Appraisal</div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label className="form-label">Cycle</label>
            <input className="form-input" value={cycle ? cycle.name : ""} disabled />
          </div>
          <div className="form-row">
            <label className="form-label">Employee *</label>
            <select className="form-input" value={empId} onChange={e => setEmpId(e.target.value)}>
              <option value="">— Select employee —</option>
              {available.map(e => (
                <option key={e.empId} value={e.empId}>{e.name} · {e.dept}</option>
              ))}
            </select>
            {available.length === 0 && (
              <div style={{ fontSize:11.5, color:"var(--fg-4)", marginTop:5, fontStyle:"italic" }}>
                All employees already have an appraisal in this cycle.
              </div>
            )}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={!empId}>Create Appraisal</button>
        </div>
      </div>
    </div>
  );
}

// ── NewCycleModal ──────────────────────────────────────────────────────────────
function NewCycleModal({ onClose, onAdd }) {
  const [form, setForm] = useStatePF({ name:"", period:"", deadline:"", status:"active" });
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  async function submit() {
    if (!form.name.trim()) return;
    const cycleId = "CYC-" + Date.now().toString(36).toUpperCase();
    await onAdd({ cycleId, ...form });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontWeight:700, fontSize:15 }}>New Review Cycle</div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label className="form-label">Cycle Name *</label>
            <input className="form-input" placeholder="e.g. H2 2026 Performance Review" value={form.name} onChange={set("name")} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div className="form-row">
              <label className="form-label">Period</label>
              <input className="form-input" placeholder="e.g. Jul – Dec 2026" value={form.period} onChange={set("period")} />
            </div>
            <div className="form-row">
              <label className="form-label">Deadline</label>
              <input className="form-input" placeholder="e.g. 31 Dec 2026" value={form.deadline} onChange={set("deadline")} />
            </div>
          </div>
          <div className="form-row">
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={set("status")}>
              <option value="active">Active</option>
              <option value="planned">Planned</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={!form.name.trim()}>Create Cycle</button>
        </div>
      </div>
    </div>
  );
}

// ── PerformancePage ────────────────────────────────────────────────────────────
function PerformancePage() {
  const [cycles,     setCycles]     = useStatePF([]);
  const [cycle,      setCycle]      = useStatePF(null);
  const [appraisals, setAppraisals] = useStatePF([]);
  const [allAppraisals, setAllAppraisals] = useStatePF([]);
  const [orgGoals,   setOrgGoals]   = useStatePF([]);
  const [employees,  setEmployees]  = useStatePF([]);
  const [loading,    setLoading]    = useStatePF(true);
  const [tab,        setTab]        = useStatePF("overview");
  const [search,     setSearch]     = useStatePF("");
  const [deptFilter, setDeptFilter] = useStatePF("all");
  const [selected,   setSelected]   = useStatePF(null);
  const [showAddGoal, setShowAddGoal] = useStatePF(false);
  const [showNewAppraisal, setShowNewAppraisal] = useStatePF(false);
  const [showNewCycle, setShowNewCycle] = useStatePF(false);
  const [pfPage,      setPfPage]      = useStatePF(1);
  const [pfPageSize,  setPfPageSize]  = useStatePF(10);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  useEffectPF(() => {
    async function load() {
      setLoading(true);
      try {
        const [cycRes, aprRes, empRes] = await Promise.all([
          fetch(`${window.API}/review-cycles`).then(r => r.json()),
          fetch(`${window.API}/appraisals`).then(r => r.json()),
          fetch(`${window.API}/employees`).then(r => r.json()),
        ]);
        const cycList = Array.isArray(cycRes) ? cycRes : [];
        const activeCycle = cycList.find(c => c.status === "active") || cycList[0] || null;
        setCycles(cycList);
        setCycle(activeCycle);
        setEmployees(Array.isArray(empRes) ? empRes : []);
        const allApr = Array.isArray(aprRes) ? aprRes : [];
        setAllAppraisals(allApr);
        const cycleId = activeCycle?.cycleId;
        setAppraisals(cycleId ? allApr.filter(a => a.cycleId === cycleId) : allApr);
        const goalsRes = cycleId
          ? await fetch(`${window.API}/org-goals?cycleId=${cycleId}`).then(r => r.json())
          : [];
        setOrgGoals(Array.isArray(goalsRes) ? goalsRes : []);
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  // ── Switch active cycle ───────────────────────────────────────────────────────
  const switchCycle = useCallbackPF(async (cycleId) => {
    const c = cycles.find(x => x.cycleId === cycleId);
    if (!c) return;
    setCycle(c);
    setSelected(null);
    setAppraisals(allAppraisals.filter(a => a.cycleId === cycleId));
    try {
      const goalsRes = await fetch(`${window.API}/org-goals?cycleId=${cycleId}`).then(r => r.json());
      setOrgGoals(Array.isArray(goalsRes) ? goalsRes : []);
    } catch(e) { console.error(e); }
  }, [cycles, allAppraisals]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const depts = useMemoOPF(() => {
    const seen = new Set();
    appraisals.forEach(a => seen.add(a.dept));
    return [...seen].filter(Boolean).sort();
  }, [appraisals]);

  const filtered = useMemoOPF(() => {
    return appraisals.filter(a => {
      if (deptFilter !== "all" && a.dept !== deptFilter) return false;
      if (search && !a.empName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [appraisals, deptFilter, search]);

  useEffectPF(() => { setPfPage(1); }, [deptFilter, search, pfPageSize]);

  const pfTotalPages  = Math.max(1, Math.ceil(filtered.length / pfPageSize));
  const pfSafePage    = Math.min(pfPage, pfTotalPages);
  const pfStart       = (pfSafePage - 1) * pfPageSize;
  const pfPageRows    = filtered.slice(pfStart, pfStart + pfPageSize);
  const pfNavBtn      = (dis) => ({ width:30, height:30, borderRadius:7, border:"1px solid var(--border-subtle)", background:"var(--bg-surface)", cursor:dis?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:dis?0.4:1 });
  const pfPageButtons = useMemoOPF(() => {
    if (pfTotalPages <= 7) return Array.from({ length: pfTotalPages }, (_, i) => i + 1);
    const left  = Math.max(2, pfSafePage - 2);
    const right = Math.min(pfTotalPages - 1, pfSafePage + 2);
    const r = [1];
    if (left > 2) r.push("...");
    for (let i = left; i <= right; i++) r.push(i);
    if (right < pfTotalPages - 1) r.push("...");
    if (pfTotalPages > 1) r.push(pfTotalPages);
    return r;
  }, [pfTotalPages, pfSafePage]);

  const ratingDist = useMemoOPF(() => {
    const dist = { 5:0, 4:0, 3:0, 2:0, 1:0 };
    appraisals.filter(a => a.rating).forEach(a => { dist[a.rating] = (dist[a.rating]||0) + 1; });
    return dist;
  }, [appraisals]);

  const avgRating = useMemoOPF(() => {
    const rated = appraisals.filter(a => a.rating);
    if (!rated.length) return "—";
    return (rated.reduce((s, a) => s + a.rating, 0) / rated.length).toFixed(1);
  }, [appraisals]);

  const completedCount = useMemoOPF(() => appraisals.filter(a => a.reviewStatus === "completed").length, [appraisals]);
  const topCount       = useMemoOPF(() => appraisals.filter(a => a.rating >= 4).length, [appraisals]);
  const completePct    = appraisals.length ? Math.round(completedCount / appraisals.length * 100) : 0;

  const deptPerf = useMemoOPF(() => {
    const map = {};
    appraisals.filter(a => a.rating).forEach(a => {
      if (!map[a.dept]) map[a.dept] = { total:0, count:0 };
      map[a.dept].total += a.rating;
      map[a.dept].count++;
    });
    return Object.entries(map)
      .map(([dept, v]) => ({ dept, avg:(v.total/v.count).toFixed(1) }))
      .sort((a, b) => b.avg - a.avg);
  }, [appraisals]);

  const selAppraisal = appraisals.find(a => a.appraisalId === selected);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleRating = useCallbackPF(async (appraisalId, rating) => {
    const upd = a => a.appraisalId === appraisalId
      ? { ...a, rating, reviewStatus: a.reviewStatus === "not_started" ? "in_progress" : a.reviewStatus }
      : a;
    setAppraisals(prev => prev.map(upd));
    setAllAppraisals(prev => prev.map(upd));
    try {
      const a = appraisals.find(x => x.appraisalId === appraisalId);
      const body = { rating };
      if (a?.reviewStatus === "not_started") body.reviewStatus = "in_progress";
      await fetch(`${window.API}/appraisals/${appraisalId}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body),
      });
    } catch(e) { console.error(e); }
  }, [appraisals]);

  const handleStatus = useCallbackPF(async (appraisalId, reviewStatus) => {
    setAppraisals(prev => prev.map(a => a.appraisalId === appraisalId ? { ...a, reviewStatus } : a));
    setAllAppraisals(prev => prev.map(a => a.appraisalId === appraisalId ? { ...a, reviewStatus } : a));
    try {
      await fetch(`${window.API}/appraisals/${appraisalId}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ reviewStatus }),
      });
    } catch(e) { console.error(e); }
  }, []);

  const handleComment = useCallbackPF(async (appraisalId, managerComment) => {
    setAppraisals(prev => prev.map(a => a.appraisalId === appraisalId ? { ...a, managerComment } : a));
    setAllAppraisals(prev => prev.map(a => a.appraisalId === appraisalId ? { ...a, managerComment } : a));
    try {
      await fetch(`${window.API}/appraisals/${appraisalId}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ managerComment }),
      });
    } catch(e) { console.error(e); }
  }, []);

  const handleSelfComment = useCallbackPF(async (appraisalId, selfComment) => {
    setAppraisals(prev => prev.map(a => a.appraisalId === appraisalId ? { ...a, selfComment } : a));
    setAllAppraisals(prev => prev.map(a => a.appraisalId === appraisalId ? { ...a, selfComment } : a));
    try {
      await fetch(`${window.API}/appraisals/${appraisalId}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ selfComment }),
      });
    } catch(e) { console.error(e); }
  }, []);

  const handleGoalsUpdate = useCallbackPF(async (appraisalId, goals) => {
    setAppraisals(prev => prev.map(a => a.appraisalId === appraisalId ? { ...a, goals } : a));
    setAllAppraisals(prev => prev.map(a => a.appraisalId === appraisalId ? { ...a, goals } : a));
    try {
      await fetch(`${window.API}/appraisals/${appraisalId}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ goals }),
      });
    } catch(e) { console.error(e); }
  }, []);

  const handleAddAppraisal = useCallbackPF(async (data) => {
    try {
      const res = await fetch(`${window.API}/appraisals`, {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data),
      });
      const doc = await res.json();
      setAppraisals(prev => [...prev, doc]);
      setAllAppraisals(prev => [...prev, doc]);
    } catch(e) { console.error(e); }
  }, []);

  const handleDeleteAppraisal = useCallbackPF(async (appraisalId) => {
    if (!window.confirm("Delete this appraisal? This cannot be undone.")) return;
    setAppraisals(prev => prev.filter(a => a.appraisalId !== appraisalId));
    setAllAppraisals(prev => prev.filter(a => a.appraisalId !== appraisalId));
    setSelected(null);
    try {
      await fetch(`${window.API}/appraisals/${appraisalId}`, { method:"DELETE" });
    } catch(e) { console.error(e); }
  }, []);

  const handleAddCycle = useCallbackPF(async (data) => {
    try {
      const res = await fetch(`${window.API}/review-cycles`, {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data),
      });
      const doc = await res.json();
      setCycles(prev => [...prev, doc]);
      // Switch to the new cycle
      setCycle(doc);
      setSelected(null);
      setAppraisals(allAppraisals.filter(a => a.cycleId === doc.cycleId));
      try {
        const goalsRes = await fetch(`${window.API}/org-goals?cycleId=${doc.cycleId}`).then(r => r.json());
        setOrgGoals(Array.isArray(goalsRes) ? goalsRes : []);
      } catch(_) {}
    } catch(e) { console.error(e); }
  }, [allAppraisals]);

  const handleGoalProgress = useCallbackPF(async (goalId, progress) => {
    const p = Math.max(0, Math.min(100, parseInt(progress)||0));
    const status = p >= 100 ? "completed" : "on_track";
    setOrgGoals(prev => prev.map(g => g.goalId === goalId ? { ...g, progress:p, status } : g));
    try {
      await fetch(`${window.API}/org-goals/${goalId}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ progress:p, status }),
      });
    } catch(e) { console.error(e); }
  }, []);

  const handleGoalStatus = useCallbackPF(async (goalId, currentStatus) => {
    const status = GOAL_STATUS_CYCLE[currentStatus] || "on_track";
    setOrgGoals(prev => prev.map(g => g.goalId === goalId ? { ...g, status } : g));
    try {
      await fetch(`${window.API}/org-goals/${goalId}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status }),
      });
    } catch(e) { console.error(e); }
  }, []);

  const handleAddGoal = useCallbackPF(async (goalData) => {
    try {
      const res = await fetch(`${window.API}/org-goals`, {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(goalData),
      });
      const doc = await res.json();
      setOrgGoals(prev => [...prev, doc]);
    } catch(e) { console.error(e); }
  }, []);

  const handleDeleteGoal = useCallbackPF(async (goalId) => {
    setOrgGoals(prev => prev.filter(g => g.goalId !== goalId));
    try {
      await fetch(`${window.API}/org-goals/${goalId}`, { method:"DELETE" });
    } catch(e) { console.error(e); }
  }, []);

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page">
      <div className="page-head">
        <div><div className="eyebrow">Growth</div><h1 className="page-title">Performance Management</h1></div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:24 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="card pulse" style={{ height:56 }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Growth</div>
          <h1 className="page-title">Performance Management</h1>
          <div className="page-sub">{cycle ? `${cycle.name} · ${cycle.period}` : "No active cycle"}</div>
        </div>
        <div className="row" style={{ gap:8, flexWrap:"wrap" }}>
          {/* Cycle selector */}
          {cycles.length > 0 && (
            <select value={cycle ? cycle.cycleId : ""} onChange={e => switchCycle(e.target.value)}
              style={{ fontSize:12.5, fontWeight:600, padding:"7px 10px", borderRadius:8,
                border:"1px solid var(--border-subtle)", background:"var(--bg-surface)", color:"var(--fg-1)", cursor:"pointer" }}>
              {cycles.map(c => (
                <option key={c.cycleId} value={c.cycleId}>
                  {c.name}{c.status === "active" ? " (active)" : ""}
                </option>
              ))}
            </select>
          )}
          <Button variant="ghost" icon="calendar-plus" onClick={() => setShowNewCycle(true)}>New Cycle</Button>
          <div className="seg-ctrl">
            {[["overview","chart-bar","Reviews"],["goals","target","Org Goals"]].map(([v,ic,lbl]) => (
              <button key={v} className={"seg-btn"+(tab===v?" active":"")} onClick={() => setTab(v)}>
                <Icon name={ic} size={14} />{lbl}
              </button>
            ))}
          </div>
          {tab === "overview" && cycle && (
            <Button variant="primary" icon="plus" onClick={() => setShowNewAppraisal(true)}>New Appraisal</Button>
          )}
        </div>
      </div>

      {/* Cycle progress banner */}
      {cycle && (
        <div className="card" style={{ marginBottom:24, display:"flex", alignItems:"center", gap:20, padding:"18px 22px" }}>
          <div style={{ width:48, height:48, borderRadius:12, background:"var(--plum-50)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Icon name="clipboard-list" size={22} color="var(--brand-burgundy)" />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ fontSize:14, fontWeight:700 }}>{cycle.name}</div>
              <div style={{ fontSize:12, color:"var(--fg-3)" }}>Deadline: <b style={{ color:"var(--fg-1)" }}>{cycle.deadline}</b></div>
            </div>
            <div style={{ height:8, borderRadius:6, background:"var(--ink-100)", overflow:"hidden" }}>
              <div style={{ height:"100%", width:completePct+"%", background:"var(--brand-burgundy)", borderRadius:6, transition:"width 0.5s" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
              <span style={{ fontSize:12, color:"var(--fg-3)" }}>{completePct}% reviews submitted ({completedCount}/{appraisals.length})</span>
              <span style={{ fontSize:12, fontWeight:700,
                color: cycle.status==="active" ? "#1F8A52" : cycle.status==="closed" ? "#C0263A" : "#D78A14" }}>
                {cycle.status === "active" ? "Active" : cycle.status === "closed" ? "Closed" : "Draft"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom:24 }}>
        {[
          { label:"Avg Rating",       value: avgRating + (avgRating !== "—" ? " / 5" : ""), icon:"star",            color:"#D78A14" },
          { label:"Reviews Complete", value: completedCount,                                  icon:"check-circle-2",  color:"#1F8A52" },
          { label:"In Progress",      value: appraisals.filter(a=>a.reviewStatus==="in_progress").length, icon:"loader-2", color:"#2563B0" },
          { label:"Top Performers",   value: topCount,                                         icon:"trophy",          color:"#534AB7" },
        ].map(k => (
          <div key={k.label} className="card" style={{ display:"flex", alignItems:"center", gap:14, padding:"18px 20px" }}>
            <div style={{ width:42, height:42, borderRadius:10, background:k.color+"15", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name={k.icon} size={20} color={k.color} />
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:20, fontWeight:700, color:"var(--fg-1)" }}>{k.value}</div>
              <div style={{ fontSize:11.5, color:"var(--fg-3)", marginTop:2 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Reviews tab ────────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 260px", gap:20, alignItems:"start" }}>
          <div>
            {/* Search + filters */}
            <div style={{ display:"flex", gap:10, marginBottom:14, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ position:"relative", flex:1, maxWidth:260 }}>
                <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }}>
                  <Icon name="search" size={14} color="var(--fg-3)" />
                </span>
                <input className="search-input" placeholder="Search employee…" value={search}
                  onChange={e => setSearch(e.target.value)} style={{ paddingLeft:32, width:"100%" }} />
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {["all",...depts].map(d => (
                  <button key={d} className={"pill-btn"+(deptFilter===d?" active":"")} onClick={() => setDeptFilter(d)}>
                    {d==="all" ? "All" : d}
                  </button>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid var(--border-subtle)", background:"var(--ink-50)" }}>
                    {["Employee","Rating","Status","Goals",""].map(h => (
                      <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, textTransform:"uppercase", color:"var(--fg-3)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pfPageRows.map(apr => {
                    const sm = STATUS_META[apr.reviewStatus] || STATUS_META.not_started;
                    const goalsTotal = apr.goals.length;
                    const goalsDone  = apr.goals.filter(g => g.progress >= 100).length;
                    return (
                      <tr key={apr.appraisalId}
                        style={{ borderBottom:"1px solid var(--border-subtle)", cursor:"pointer",
                          background: selected===apr.appraisalId ? "var(--plum-50)" : "transparent" }}
                        onClick={() => setSelected(selected===apr.appraisalId ? null : apr.appraisalId)}>
                        <td style={{ padding:"11px 14px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <Avatar name={apr.empName} color={apr.avatar} size={28} />
                            <div>
                              <div style={{ fontSize:12.5, fontWeight:600 }}>{apr.empName}</div>
                              <div style={{ fontSize:11, color:"var(--fg-3)" }}>{apr.role} · {apr.dept}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"11px 14px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <StarRating rating={apr.rating || 0} />
                            {apr.rating ? (
                              <span style={{ fontSize:11.5, fontWeight:700, color:RATING_COLORS[apr.rating] }}>{RATING_LABELS[apr.rating]}</span>
                            ) : (
                              <span style={{ fontSize:11, color:"var(--fg-3)" }}>—</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding:"11px 14px" }}>
                          <span style={{ padding:"3px 9px", borderRadius:6, fontSize:11.5, fontWeight:600, background:sm.bg, color:sm.color }}>{sm.label}</span>
                        </td>
                        <td style={{ padding:"11px 14px" }}>
                          {goalsTotal > 0 ? (
                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                              <div style={{ width:56, height:5, borderRadius:3, background:"var(--ink-100)", overflow:"hidden" }}>
                                <div style={{ height:"100%", width:(goalsDone/goalsTotal*100)+"%", background:"#2563B0" }} />
                              </div>
                              <span style={{ fontSize:11.5, color:"var(--fg-3)" }}>{goalsDone}/{goalsTotal}</span>
                            </div>
                          ) : <span style={{ fontSize:11, color:"var(--fg-3)" }}>—</span>}
                        </td>
                        <td style={{ padding:"11px 14px" }}>
                          <IconButton icon="eye" title="View appraisal" />
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} style={{ padding:"28px", textAlign:"center", color:"var(--fg-3)", fontSize:13 }}>No employees match the filter.</td></tr>
                  )}
                </tbody>
              </table>
              {filtered.length > 0 && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderTop:"1px solid var(--border-subtle)", flexWrap:"wrap", gap:8 }}>
                  <div style={{ fontSize:12.5, color:"var(--fg-3)" }}>
                    {pfStart+1}–{Math.min(pfStart+pfPageSize, filtered.length)} of {filtered.length} employees
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:12, color:"var(--fg-3)" }}>Rows</span>
                    <select value={pfPageSize} onChange={e => { setPfPageSize(Number(e.target.value)); setPfPage(1); }}
                      style={{ height:28, fontSize:12, padding:"0 6px", borderRadius:6, border:"1px solid var(--border-subtle)", background:"var(--bg-surface)" }}>
                      {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <div style={{ display:"flex", gap:4 }}>
                      <button onClick={() => setPfPage(1)} disabled={pfSafePage===1} style={pfNavBtn(pfSafePage===1)}><span style={{fontSize:12}}>«</span></button>
                      <button onClick={() => setPfPage(pfSafePage-1)} disabled={pfSafePage===1} style={pfNavBtn(pfSafePage===1)}><span style={{fontSize:12}}>‹</span></button>
                      {pfPageButtons.map((b,i) => b==="..." ? (
                        <span key={"e"+i} style={{width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"var(--fg-3)"}}>…</span>
                      ) : (
                        <button key={b} onClick={() => setPfPage(b)} style={{width:30,height:30,borderRadius:7,border:"1px solid var(--border-subtle)",cursor:"pointer",fontSize:12,fontWeight:b===pfSafePage?700:400,background:b===pfSafePage?"#2563B0":"var(--bg-surface)",color:b===pfSafePage?"#fff":"var(--fg-1)"}}>
                          {b}
                        </button>
                      ))}
                      <button onClick={() => setPfPage(pfSafePage+1)} disabled={pfSafePage===pfTotalPages} style={pfNavBtn(pfSafePage===pfTotalPages)}><span style={{fontSize:12}}>›</span></button>
                      <button onClick={() => setPfPage(pfTotalPages)} disabled={pfSafePage===pfTotalPages} style={pfNavBtn(pfSafePage===pfTotalPages)}><span style={{fontSize:12}}>»</span></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div className="card" style={{ padding:"18px 20px" }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--fg-3)", marginBottom:14 }}>Rating Distribution</div>
              {[5,4,3,2,1].map(r => {
                const cnt = ratingDist[r]||0;
                const pct = appraisals.length ? Math.round(cnt/appraisals.length*100) : 0;
                return (
                  <div key={r} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <div style={{ display:"flex", gap:1, flexShrink:0 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{ width:8, height:8, borderRadius:2, background: i<=r ? RATING_COLORS[r] : "var(--ink-100)" }} />
                      ))}
                    </div>
                    <div style={{ flex:1, height:6, borderRadius:3, background:"var(--ink-100)", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:pct+"%", background:RATING_COLORS[r], borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:11, color:"var(--fg-3)", minWidth:22, textAlign:"right" }}>{cnt}</span>
                  </div>
                );
              })}
            </div>

            <div className="card" style={{ padding:"18px 20px" }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--fg-3)", marginBottom:14 }}>Dept Performance</div>
              {deptPerf.slice(0,6).map(({ dept, avg }) => {
                const n = parseFloat(avg);
                const c = n >= 4 ? "#1F8A52" : n >= 3 ? "#2563B0" : "#D78A14";
                return (
                  <div key={dept} style={{ marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                      <span style={{ fontWeight:600, color:"var(--fg-1)" }}>{dept}</span>
                      <span style={{ fontWeight:700, color:c }}>{avg}</span>
                    </div>
                    <div style={{ height:5, borderRadius:3, background:"var(--ink-100)", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:(n/5*100)+"%", background:c, borderRadius:3 }} />
                    </div>
                  </div>
                );
              })}
              {deptPerf.length === 0 && <div style={{ fontSize:12, color:"var(--fg-3)" }}>No rated appraisals yet.</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Org Goals tab ──────────────────────────────────────────────────────── */}
      {tab === "goals" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {orgGoals.map(g => {
            const gm = GOAL_STATUS_META[g.status] || GOAL_STATUS_META.on_track;
            const barColor = g.progress >= 100 ? "#1F8A52" : g.progress >= 60 ? "#2563B0" : "#D78A14";
            return (
              <div key={g.goalId} className="card" style={{ borderLeft:`4px solid ${gm.color}`, padding:"18px 18px 18px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10, gap:8 }}>
                  <div style={{ fontSize:13.5, fontWeight:700, color:"var(--fg-1)", flex:1 }}>{g.label}</div>
                  <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                    <button title="Cycle status"
                      style={{ padding:"3px 9px", borderRadius:6, fontSize:11.5, fontWeight:600, background:gm.bg, color:gm.color, border:"none", cursor:"pointer" }}
                      onClick={() => handleGoalStatus(g.goalId, g.status)}>{gm.label}</button>
                    <IconButton icon="trash-2" title="Delete goal" onClick={() => handleDeleteGoal(g.goalId)} />
                  </div>
                </div>

                <GoalBar progress={g.progress} />

                {/* Progress editor */}
                <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10 }}>
                  <input type="range" min={0} max={100} value={g.progress}
                    onChange={e => setOrgGoals(prev => prev.map(x => x.goalId===g.goalId ? {...x,progress:parseInt(e.target.value)} : x))}
                    onMouseUp={e => handleGoalProgress(g.goalId, e.target.value)}
                    onTouchEnd={e => handleGoalProgress(g.goalId, e.target.value)}
                    style={{ flex:1, accentColor:barColor, cursor:"pointer" }} />
                  <input type="number" min={0} max={100} value={g.progress}
                    onChange={e => handleGoalProgress(g.goalId, e.target.value)}
                    style={{ width:52, fontSize:12, padding:"3px 6px", border:"1px solid var(--border-subtle)", borderRadius:6, textAlign:"center", fontFamily:"inherit" }} />
                </div>

                <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, fontSize:11.5, color:"var(--fg-3)" }}>
                  <span><Icon name="user" size={12} color="var(--fg-3)" /> {g.owner || "—"}</span>
                  <span>Due: {g.due || "—"}</span>
                </div>
              </div>
            );
          })}

          {/* Add goal card */}
          <div className="card"
            style={{ border:"2px dashed var(--border-subtle)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, minHeight:140, cursor:"pointer", color:"var(--fg-3)" }}
            onClick={() => setShowAddGoal(true)}>
            <Icon name="plus-circle" size={22} color="var(--fg-3)" />
            <span style={{ fontSize:13, fontWeight:600 }}>Add Company Goal</span>
          </div>
        </div>
      )}

      {/* Appraisal detail modal */}
      {selAppraisal && (
        <AppraisalDetailModal
          appraisal={selAppraisal}
          onClose={() => setSelected(null)}
          onRating={handleRating}
          onStatus={handleStatus}
          onComment={handleComment}
          onSelfComment={handleSelfComment}
          onGoalsUpdate={handleGoalsUpdate}
          onDelete={handleDeleteAppraisal}
        />
      )}

      {/* Add org goal modal */}
      {showAddGoal && (
        <AddOrgGoalModal
          cycleId={cycle?.cycleId || ""}
          onClose={() => setShowAddGoal(false)}
          onAdd={handleAddGoal}
        />
      )}

      {/* New appraisal modal */}
      {showNewAppraisal && cycle && (
        <NewAppraisalModal
          cycle={cycle}
          employees={employees}
          existingEmpIds={appraisals.map(a => a.empId)}
          onClose={() => setShowNewAppraisal(false)}
          onAdd={handleAddAppraisal}
        />
      )}

      {/* New cycle modal */}
      {showNewCycle && (
        <NewCycleModal
          onClose={() => setShowNewCycle(false)}
          onAdd={handleAddCycle}
        />
      )}
    </div>
  );
}

Object.assign(window, { PerformancePage });
