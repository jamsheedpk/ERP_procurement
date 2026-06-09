/* global React, Icon, Avatar, Chip, Button, IconButton */
const { useState: useStateBN, useMemo: useMemoOBN, useEffect: useEffectBN, useCallback: useCallbackBN } = React;

const ICON_OPTIONS = [
  "heart-pulse","shield-check","wallet","plane","dumbbell","home",
  "gift","star","award","briefcase","umbrella","zap","stethoscope","baby","sun",
];
const COLOR_PRESETS = ["#B61B54","#2563B0","#1F8A52","#534AB7","#D78A14","#C0263A","#6F1947","#854F0B","#0F6E56"];

function EnrollmentMeter({ enrolled, total, color }) {
  const pct = total ? Math.round(enrolled / total * 100) : 0;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--fg-3)", marginBottom:4 }}>
        <span>{enrolled} / {total} enrolled</span>
        <span style={{ fontWeight:700, color }}>{pct}%</span>
      </div>
      <div style={{ height:5, borderRadius:4, background:"var(--ink-100)", overflow:"hidden" }}>
        <div style={{ height:"100%", width:pct+"%", background:color, borderRadius:4 }} />
      </div>
    </div>
  );
}

function BenefitFormBody({ form, setForm }) {
  const handle = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div className="form-row">
        <label className="form-label">Package Name *</label>
        <input className="form-input" value={form.name} onChange={handle("name")} placeholder="e.g. Dental Insurance" />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div className="form-row">
          <label className="form-label">Provider</label>
          <input className="form-input" value={form.provider} onChange={handle("provider")} placeholder="e.g. Daman Health" />
        </div>
        <div className="form-row">
          <label className="form-label">Coverage</label>
          <input className="form-input" value={form.coverage} onChange={handle("coverage")} placeholder="e.g. Employee + Family" />
        </div>
      </div>
      <div className="form-row">
        <label className="form-label">Monthly Cost / Employee (AED)</label>
        <input className="form-input" type="number" min="0" value={form.costPerEmp} onChange={handle("costPerEmp")} />
      </div>
      <div className="form-row">
        <label className="form-label">Description</label>
        <textarea className="form-input" rows={2} value={form.desc} onChange={handle("desc")} placeholder="Short description..." style={{ resize:"vertical" }} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div className="form-row">
          <label className="form-label">Icon</label>
          <select className="form-input" value={form.icon} onChange={handle("icon")}>
            {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label className="form-label">Color</label>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:6 }}>
            {COLOR_PRESETS.map(c => (
              <div key={c} onClick={() => setForm(f => ({ ...f, color:c }))}
                style={{ width:22, height:22, borderRadius:5, background:c, cursor:"pointer",
                  outline: form.color === c ? "2px solid var(--fg-1)" : "none", outlineOffset:2 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddBenefitModal({ onSave, onClose }) {
  const [form, setForm] = useStateBN({
    name:"", icon:"gift", color:"#6F1947", provider:"", coverage:"", costPerEmp:0, desc:"",
  });
  const [saving, setSaving] = useStateBN(false);

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${window.API}/benefits`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          ...form,
          benefitId: "BEN-" + Date.now().toString(36).toUpperCase(),
          costPerEmp: parseFloat(form.costPerEmp) || 0,
          active: true,
        }),
      });
      onSave(await res.json());
    } catch { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontSize:16, fontWeight:700 }}>Add Benefit Package</div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div className="modal-body"><BenefitFormBody form={form} setForm={setForm} /></div>
        <div className="modal-foot">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={saving || !form.name.trim()}>
            {saving ? "Adding…" : "Add Package"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditBenefitModal({ benefit, onSave, onClose }) {
  const [form, setForm] = useStateBN({
    name: benefit.name || "",
    icon: benefit.icon || "gift",
    color: benefit.color || "#6F1947",
    provider: benefit.provider || "",
    coverage: benefit.coverage || "",
    costPerEmp: benefit.costPerEmp || 0,
    desc: benefit.desc || "",
    active: benefit.active !== false,
  });
  const [saving, setSaving] = useStateBN(false);

  const submit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${window.API}/benefits/${benefit.benefitId}`, {
        method: "PATCH",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ ...form, costPerEmp: parseFloat(form.costPerEmp) || 0 }),
      });
      onSave(await res.json());
    } catch { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontSize:16, fontWeight:700 }}>Edit Benefit Package</div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div className="modal-body">
          <BenefitFormBody form={form} setForm={setForm} />
          <div className="form-row" style={{ marginTop:14 }}>
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
              <input type="checkbox" checked={form.active}
                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
              <span className="form-label" style={{ marginBottom:0 }}>Active</span>
            </label>
          </div>
        </div>
        <div className="modal-foot">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BenefitsPage({ data }) {
  const { employees = [] } = data || {};

  const [benefits, setBenefits]   = useStateBN([]);
  const [loading, setLoading]     = useStateBN(true);
  const [selected, setSelected]   = useStateBN(null);
  const [tab, setTab]             = useStateBN("overview");
  const [showAdd, setShowAdd]     = useStateBN(false);
  const [editBen, setEditBen]     = useStateBN(null);
  const [toggling, setToggling]   = useStateBN({});

  useEffectBN(() => {
    fetch(`${window.API}/benefits`)
      .then(r => r.json())
      .then(docs => { setBenefits(docs); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalEmps = employees.length || 1;

  const totalCost = useMemoOBN(() =>
    benefits.reduce((s, b) => s + b.costPerEmp * (b.enrolledCount || 0), 0)
  , [benefits]);

  const selBen = benefits.find(b => b.benefitId === selected);

  const applyBenefit = useCallbackBN((updated) => {
    setBenefits(prev => prev.map(b => b.benefitId === updated.benefitId ? updated : b));
    setEditBen(null);
  }, []);

  const handleAddSave = useCallbackBN((doc) => {
    setBenefits(prev => [...prev, doc]);
    setShowAdd(false);
  }, []);

  const handleToggleEnroll = useCallbackBN(async (benefitId, empId) => {
    const key = `${benefitId}:${empId}`;
    if (toggling[key]) return;
    const ben = benefits.find(b => b.benefitId === benefitId);
    if (!ben) return;
    const isEnrolled = (ben.enrolledEmpIds || []).includes(empId);
    const endpoint   = isEnrolled ? "unenroll" : "enroll";

    const applyLocal = (enrolled) => setBenefits(prev => prev.map(b => {
      if (b.benefitId !== benefitId) return b;
      const ids = enrolled
        ? (b.enrolledEmpIds || []).filter(id => id !== empId)
        : [...(b.enrolledEmpIds || []), empId];
      return { ...b, enrolledEmpIds: ids, enrolledCount: ids.length };
    }));

    applyLocal(isEnrolled);
    setToggling(t => ({ ...t, [key]: true }));
    try {
      const res = await fetch(`${window.API}/benefits/${benefitId}/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ empId }),
      });
      const doc = await res.json();
      setBenefits(prev => prev.map(b => b.benefitId === doc.benefitId ? doc : b));
    } catch {
      applyLocal(!isEnrolled); // revert
    } finally {
      setToggling(t => { const n = { ...t }; delete n[key]; return n; });
    }
  }, [benefits, toggling]);

  if (loading) return (
    <div className="page" style={{ display:"flex", alignItems:"center", justifyContent:"center", height:360 }}>
      <span style={{ color:"var(--fg-3)", fontSize:14 }}>Loading benefits…</span>
    </div>
  );

  return (
    <div className="page">
      {showAdd && <AddBenefitModal onSave={handleAddSave} onClose={() => setShowAdd(false)} />}
      {editBen  && <EditBenefitModal benefit={editBen} onSave={applyBenefit} onClose={() => setEditBen(null)} />}

      <div className="page-head">
        <div>
          <div className="eyebrow">Money</div>
          <h1 className="page-title">Benefits & Compensation</h1>
          <div className="page-sub">Manage employee benefits, allowances and entitlements</div>
        </div>
        <div className="row">
          <div className="seg-ctrl">
            {["overview","employees"].map(v => (
              <button key={v} className={"seg-btn" + (tab === v ? " active" : "")} onClick={() => setTab(v)}>
                <Icon name={v === "overview" ? "gift" : "users"} size={14} />
                {v === "overview" ? "Packages" : "Employee View"}
              </button>
            ))}
          </div>
          <Button variant="primary" icon="plus" onClick={() => setShowAdd(true)}>Add Benefit</Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom:28 }}>
        {[
          { label:"Total Monthly Cost",  value:"AED " + (totalCost / 1000).toFixed(0) + "K",                                  icon:"wallet",         color:"#2563B0" },
          { label:"Benefit Packages",    value:benefits.length,                                                                icon:"gift",           color:"#1F8A52" },
          { label:"Avg Cost / Employee", value:"AED " + Math.round(totalCost / totalEmps).toLocaleString(),                    icon:"calculator",     color:"#6F1947" },
          { label:"Active Packages",     value:benefits.filter(b => b.active !== false).length + " / " + benefits.length,      icon:"check-circle-2", color:"#D78A14" },
        ].map(k => (
          <div key={k.label} className="card" style={{ display:"flex", alignItems:"center", gap:14, padding:"18px 20px" }}>
            <div style={{ width:44, height:44, borderRadius:10, background:k.color+"15", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name={k.icon} size={20} color={k.color} />
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.02em", color:"var(--fg-1)" }}>{k.value}</div>
              <div style={{ fontSize:11.5, color:"var(--fg-3)", marginTop:2 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {tab === "overview" ? (
        <div style={{ display:"grid", gridTemplateColumns: selBen ? "1.2fr 1fr" : "1fr", gap:24, alignItems:"start" }}>
          {/* Package list */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {benefits.map(b => (
              <div key={b.benefitId}
                className={"card ben-card" + (selected === b.benefitId ? " ben-card--active" : "")}
                style={{ borderLeft:`4px solid ${b.color}`, cursor:"pointer", opacity: b.active === false ? 0.6 : 1 }}
                onClick={() => setSelected(selected === b.benefitId ? null : b.benefitId)}>
                <div style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 20px 16px 16px" }}>
                  <div style={{ width:42, height:42, borderRadius:10, background:b.color+"18", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon name={b.icon} size={20} color={b.color} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:3 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:"var(--fg-1)" }}>{b.name}</div>
                      {b.provider && <span style={{ fontSize:10.5, fontWeight:600, padding:"2px 8px", borderRadius:20, background:b.color+"18", color:b.color }}>{b.provider}</span>}
                      {b.active === false && <Chip label="Inactive" style={{ fontSize:10 }} />}
                    </div>
                    <div style={{ fontSize:12, color:"var(--fg-3)", marginBottom:10, lineHeight:1.4 }}>{b.desc}</div>
                    <EnrollmentMeter enrolled={b.enrolledCount || 0} total={totalEmps} color={b.color} />
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0, minWidth:110, paddingLeft:16 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:"var(--fg-1)", whiteSpace:"nowrap" }}>
                      {b.costPerEmp > 0 ? "AED " + b.costPerEmp.toLocaleString() : "Statutory"}
                    </div>
                    <div style={{ fontSize:11, color:"var(--fg-3)", marginTop:2 }}>per emp / mo</div>
                    <div style={{ fontSize:11, color:"var(--fg-3)", marginTop:1 }}>
                      {b.enrolledCount || 0} enrolled
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail pane */}
          {selBen && (
            <div className="card" style={{ position:"sticky", top:90, padding:"20px 22px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18, paddingBottom:14, borderBottom:"1px solid var(--border-subtle)" }}>
                <div style={{ width:42, height:42, borderRadius:10, background:selBen.color+"18", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon name={selBen.icon} size={20} color={selBen.color} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700 }}>{selBen.name}</div>
                  <div style={{ fontSize:12, color:"var(--fg-3)" }}>{selBen.provider}</div>
                </div>
                <IconButton icon="edit-2" onClick={() => setEditBen(selBen)} />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[
                  { label:"Coverage",     value: selBen.coverage || "—" },
                  { label:"Cost/employee",value: selBen.costPerEmp > 0 ? "AED " + selBen.costPerEmp.toLocaleString() + "/mo" : "Statutory" },
                  { label:"Monthly total",value: selBen.costPerEmp > 0 ? "AED " + (selBen.costPerEmp * (selBen.enrolledCount || 0)).toLocaleString() : "—" },
                  { label:"Enrolled",     value: (selBen.enrolledCount || 0) + " employees", color: selBen.color },
                ].map(row => (
                  <div key={row.label} style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                    <span style={{ color:"var(--fg-3)" }}>{row.label}</span>
                    <span style={{ fontWeight:600, color: row.color || "var(--fg-1)" }}>{row.value}</span>
                  </div>
                ))}
              </div>
              {selBen.tiers && selBen.tiers.length > 1 && (
                <>
                  <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--fg-3)", margin:"18px 0 10px" }}>Tiers</div>
                  {selBen.tiers.map(t => (
                    <div key={t.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:"var(--ink-50)", borderRadius:8, marginBottom:6 }}>
                      <div>
                        <div style={{ fontSize:12.5, fontWeight:600 }}>{t.label}</div>
                        <div style={{ fontSize:11, color:"var(--fg-3)" }}>{t.count} enrolled</div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color:selBen.color }}>
                        {t.cost > 0 ? "AED " + t.cost + "/mo" : "Statutory"}
                      </div>
                    </div>
                  ))}
                </>
              )}
              <Button variant="secondary" style={{ width:"100%", marginTop:16 }} icon="edit-2" onClick={() => setEditBen(selBen)}>
                Manage Benefit
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* ── Employee view ───────────────────────────────────────────────── */
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth: 600 + benefits.length * 80 }}>
            <thead>
              <tr style={{ borderBottom:"2px solid var(--border-subtle)", background:"var(--ink-50)" }}>
                <th style={{ padding:"12px 18px", textAlign:"left", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--fg-3)", minWidth:200 }}>Employee</th>
                {benefits.map(b => (
                  <th key={b.benefitId} style={{ padding:"10px 10px", textAlign:"center", width:80, minWidth:80 }}>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:b.color+"18", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Icon name={b.icon} size={14} color={b.color} />
                      </div>
                      <span style={{ fontSize:10, lineHeight:1.3, color:"var(--fg-2)", fontWeight:600, maxWidth:70, textAlign:"center", display:"block", wordBreak:"break-word" }}>{b.name}</span>
                    </div>
                  </th>
                ))}
                <th style={{ padding:"12px 18px", textAlign:"right", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--fg-3)", minWidth:100 }}>Total/mo</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => {
                const empTotal = benefits.reduce((s, b) =>
                  (b.enrolledEmpIds || []).includes(emp.empId) ? s + (b.costPerEmp || 0) : s, 0);
                return (
                  <tr key={emp.empId} style={{ borderBottom:"1px solid var(--border-subtle)", background: i % 2 === 1 ? "var(--ink-50)" : "transparent" }}>
                    <td style={{ padding:"10px 18px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <Avatar name={emp.name} color={emp.av} size={28} />
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:"var(--fg-1)" }}>{emp.name}</div>
                          <div style={{ fontSize:11, color:"var(--fg-3)", marginTop:1 }}>{emp.dept}</div>
                        </div>
                      </div>
                    </td>
                    {benefits.map(b => {
                      const enrolled = (b.enrolledEmpIds || []).includes(emp.empId);
                      const key = `${b.benefitId}:${emp.empId}`;
                      const busy = !!toggling[key];
                      return (
                        <td key={b.benefitId} style={{ padding:"10px 10px", textAlign:"center" }}>
                          <button
                            onClick={() => handleToggleEnroll(b.benefitId, emp.empId)}
                            disabled={busy}
                            title={enrolled ? `Remove from ${b.name}` : `Enroll in ${b.name}`}
                            style={{ background: enrolled ? b.color+"15" : "transparent",
                              border: enrolled ? `1.5px solid ${b.color}40` : "1.5px solid var(--border-subtle)",
                              cursor: busy ? "wait" : "pointer",
                              width:32, height:32, borderRadius:8, display:"inline-flex", alignItems:"center",
                              justifyContent:"center", opacity: busy ? 0.4 : 1, transition:"all 0.15s" }}>
                            <Icon
                              name={enrolled ? "check" : "minus"}
                              size={14}
                              color={enrolled ? b.color : "var(--fg-4)"}
                            />
                          </button>
                        </td>
                      );
                    })}
                    <td style={{ padding:"10px 18px", textAlign:"right", fontSize:13, fontWeight:700, color: empTotal > 0 ? "var(--fg-1)" : "var(--fg-4)" }}>
                      {empTotal > 0 ? "AED " + empTotal.toLocaleString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { BenefitsPage });
