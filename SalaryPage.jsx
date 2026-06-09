/* global React, Icon, Avatar, AvatarRow, Chip, Button, Segmented, Tabs, Meter, API */
const {
  useState:    useStateSC,
  useEffect:   useEffectSC,
  useMemo:     useMemoSC,
  useCallback: useCallbackSC,
} = React;

const FMT = n => "AED " + Math.round(Number(n) || 0).toLocaleString();
const NUM = v  => Number(v) || 0;

// ── Overtime methods ──────────────────────────────────────────────────────────
const OT_METHODS = [
  { id: "none",       label: "No overtime",       icon: "minus-circle" },
  { id: "hourly_1_5", label: "Hourly × 1.5",      icon: "clock" },
  { id: "hourly_2_0", label: "Hourly × 2.0",      icon: "clock" },
  { id: "daily",      label: "Daily rate",         icon: "calendar" },
  { id: "flat",       label: "Flat amount",        icon: "dollar-sign" },
  { id: "percent",    label: "% of base salary",   icon: "percent" },
];

function calcOvertimeAmount(ot, base) {
  if (!ot || ot.method === "none") return 0;
  const hr = base / 176;
  const dr = base / 22;
  switch (ot.method) {
    case "hourly_1_5": return Math.round(hr * 1.5 * NUM(ot.hoursPerMonth));
    case "hourly_2_0": return Math.round(hr * 2.0 * NUM(ot.hoursPerMonth));
    case "daily":      return Math.round(dr * NUM(ot.rateMultiplier || 1.5) * NUM(ot.daysPerMonth));
    case "flat":       return NUM(ot.flatAmount);
    case "percent":    return Math.round(base * (NUM(ot.percentageOfBase) / 100));
    default:           return 0;
  }
}

function sumObj(obj) { return Object.values(obj || {}).reduce((s, v) => s + NUM(v), 0); }

function computeSalary(s) {
  const base       = NUM(s.base);
  const allowTotal = sumObj(s.allowances);
  const otAmount   = calcOvertimeAmount(s.overtime, base);
  const dedTotal   = sumObj(s.deductions);
  const gross      = base + allowTotal + otAmount;
  const net        = gross - dedTotal;
  return { base, allowTotal, otAmount, dedTotal, gross, net };
}

// ── Deep clone a structure for editing ───────────────────────────────────────
function cloneStruct(s) {
  return {
    base: s.base || 0,
    allowances:  { housing: 0, transport: 0, food: 0, communication: 0, other: 0, ...(s.allowances || {}) },
    overtime:    { method: "none", hoursPerMonth: 0, daysPerMonth: 0, rateMultiplier: 1.5, flatAmount: 0, percentageOfBase: 0, ...(s.overtime || {}) },
    deductions:  { loan: 0, advance: 0, insurance: 0, other: 0, ...(s.deductions || {}) },
    effectiveDate: s.effectiveDate || "",
  };
}

// ── Salary slip preview ───────────────────────────────────────────────────────
function SalarySlip({ form, current, employee }) {
  const calc    = computeSalary(form);
  const curCalc = current ? computeSalary(current) : null;
  const changed = curCalc && calc.net !== curCalc.net;

  const Row = ({ label, amount, muted, bold, color, indent }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--ink-100)", paddingLeft: indent ? 14 : 0 }}>
      <span style={{ fontSize: 12.5, color: muted ? "var(--fg-3)" : "var(--fg-1)", fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: bold ? 700 : 500, color: color || (muted ? "var(--fg-3)" : "var(--fg-1)") }}>
        {amount >= 0 ? FMT(amount) : "−" + FMT(Math.abs(amount))}
      </span>
    </div>
  );

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, overflow: "hidden", position: "sticky", top: 16 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, var(--brand-burgundy) 0%, #9C2460 100%)", padding: "18px 20px", color: "#fff" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", opacity: 0.8, marginBottom: 6, textTransform: "uppercase" }}>Salary slip preview</div>
        {employee && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={employee.name} color={{ bg: "rgba(255,255,255,0.2)", fg: "#fff" }} size="md" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{employee.name}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{employee.title} · {employee.dept}</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "16px 20px" }}>
        <Row label="Base salary" amount={calc.base} bold />

        {/* Allowances */}
        {calc.allowTotal > 0 && (
          <>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 10, marginBottom: 2 }}>Allowances</div>
            {NUM(form.allowances?.housing)       > 0 && <Row label="Housing"       amount={form.allowances.housing}       muted indent />}
            {NUM(form.allowances?.transport)     > 0 && <Row label="Transport"     amount={form.allowances.transport}     muted indent />}
            {NUM(form.allowances?.food)          > 0 && <Row label="Food"          amount={form.allowances.food}          muted indent />}
            {NUM(form.allowances?.communication) > 0 && <Row label="Communication" amount={form.allowances.communication} muted indent />}
            {NUM(form.allowances?.other)         > 0 && <Row label="Other allow."  amount={form.allowances.other}         muted indent />}
            <Row label="Total allowances" amount={calc.allowTotal} />
          </>
        )}

        {/* Overtime */}
        {calc.otAmount > 0 && (
          <>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--success-600)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 10, marginBottom: 2 }}>Overtime</div>
            <Row label={OT_METHODS.find(m => m.id === form.overtime?.method)?.label || "Overtime"} amount={calc.otAmount} color="var(--success-700)" />
          </>
        )}

        {/* Gross */}
        <div style={{ margin: "12px 0 4px", borderTop: "2px solid var(--ink-200)" }} />
        <Row label="Gross pay" amount={calc.gross} bold />

        {/* Deductions */}
        {calc.dedTotal > 0 && (
          <>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--danger-700)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 10, marginBottom: 2 }}>Deductions</div>
            {NUM(form.deductions?.loan)      > 0 && <Row label="Loan repayment" amount={-form.deductions.loan}      color="var(--danger-700)" indent />}
            {NUM(form.deductions?.advance)   > 0 && <Row label="Salary advance" amount={-form.deductions.advance}   color="var(--danger-700)" indent />}
            {NUM(form.deductions?.insurance) > 0 && <Row label="Insurance"      amount={-form.deductions.insurance} color="var(--danger-700)" indent />}
            {NUM(form.deductions?.other)     > 0 && <Row label="Other deduct."  amount={-form.deductions.other}     color="var(--danger-700)" indent />}
            <Row label="Total deductions" amount={-calc.dedTotal} color="var(--danger-700)" />
          </>
        )}

        {/* Net */}
        <div style={{ margin: "12px 0 0", borderTop: "2px solid var(--brand-burgundy)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 4px" }}>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>Net pay</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 800, color: "var(--brand-burgundy)" }}>{FMT(calc.net)}</span>
        </div>

        {/* Comparison with current */}
        {changed && curCalc && (
          <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: calc.net > curCalc.net ? "var(--success-50)" : "var(--danger-50)", border: `1px solid ${calc.net > curCalc.net ? "var(--success-200)" : "var(--danger-200)"}` }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: calc.net > curCalc.net ? "var(--success-700)" : "var(--danger-700)", marginBottom: 4 }}>
              <Icon name={calc.net > curCalc.net ? "trending-up" : "trending-down"} size={13} /> vs current: {FMT(curCalc.net)}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: calc.net > curCalc.net ? "var(--success-700)" : "var(--danger-700)" }}>
              {calc.net > curCalc.net ? "+" : ""}{FMT(calc.net - curCalc.net)} / month
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Field: number input with label ────────────────────────────────────────────
function AmtField({ label, value, onChange, prefix = "AED" }) {
  return (
    <div className="form-group">
      <label className="label">{label}</label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11.5, color: "var(--fg-3)", fontFamily: "var(--font-mono)", pointerEvents: "none" }}>{prefix}</span>
        <input className="fi" type="number" min="0" value={value}
          onChange={e => onChange(NUM(e.target.value))}
          style={{ paddingLeft: prefix.length > 2 ? 46 : 38, fontSize: 13 }} />
      </div>
    </div>
  );
}

// ── Calculator / Editor ───────────────────────────────────────────────────────
function SalaryCalculator({ structures, employees, initialEmpId, onSaved }) {
  const [empId,    setEmpId]    = useStateSC(initialEmpId || structures[0]?.empId || "");
  const [form,     setForm]     = useStateSC(null);
  const [current,  setCurrent]  = useStateSC(null);
  const [reason,   setReason]   = useStateSC("");
  const [saving,   setSaving]   = useStateSC(false);
  const [saved,    setSaved]    = useStateSC(false);
  const [err,      setErr]      = useStateSC("");
  const [showAllow,setShowAllow]= useStateSC(true);
  const [showDed,  setShowDed]  = useStateSC(true);

  const employee = useMemoSC(() => employees.find(e => (e.empId || e.id) === empId), [empId, employees]);

  useEffectSC(() => {
    const s = structures.find(s => s.empId === empId);
    if (s) {
      const c = cloneStruct(s);
      setCurrent(c);
      setForm(c);
    } else {
      setCurrent(null);
      setForm(cloneStruct({}));
    }
    setSaved(false); setErr("");
  }, [empId, structures]);

  const set     = (k, v)    => setForm(f => ({ ...f, [k]: v }));
  const setAl   = (k, v)    => setForm(f => ({ ...f, allowances: { ...f.allowances, [k]: v } }));
  const setOt   = (k, v)    => setForm(f => ({ ...f, overtime:   { ...f.overtime, [k]: v } }));
  const setDed  = (k, v)    => setForm(f => ({ ...f, deductions: { ...f.deductions, [k]: v } }));

  const handleSave = async () => {
    if (!reason.trim()) { setErr("Please enter a reason for this change."); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch(`${API}/salary-structures/${empId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, empId, reason }),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      setCurrent(cloneStruct(saved));
      setReason("");
      setSaved(true);
      onSaved?.();
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setErr(e.message || "Failed to save.");
    } finally { setSaving(false); }
  };

  if (!form) return null;

  const calc    = computeSalary(form);
  const otMethod= OT_METHODS.find(m => m.id === form.overtime.method);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>

      {/* ── Left: Form ── */}
      <div className="stack" style={{ gap: 16 }}>

        {/* Employee picker */}
        <div className="card card-pad">
          <div className="label" style={{ marginBottom: 10 }}>Employee</div>
          <select className="fi" value={empId} onChange={e => setEmpId(e.target.value)}>
            {structures.map(s => (
              <option key={s.empId} value={s.empId}>{s.empName} — {s.dept}</option>
            ))}
          </select>
          {employee && (
            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
              <Avatar name={employee.name} color={employee.av} size="sm" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{employee.title}</div>
                <div className="muted" style={{ fontSize: 12 }}>{employee.empId} · Grade {employee.grade} · {employee.contract}</div>
              </div>
            </div>
          )}
        </div>

        {/* Base salary */}
        <div className="card card-pad">
          <div className="label" style={{ marginBottom: 12 }}>Base salary</div>
          <AmtField label="Monthly base (AED)" value={form.base} onChange={v => set("base", v)} />
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            Hourly rate: {FMT(Math.round(form.base / 176))} · Daily rate: {FMT(Math.round(form.base / 22))}
          </div>
        </div>

        {/* Allowances */}
        <div className="card card-pad">
          <button style={{ all: "unset", cursor: "pointer", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showAllow ? 14 : 0 }}
            onClick={() => setShowAllow(v => !v)}>
            <div className="label" style={{ margin: 0 }}>
              Allowances
              <span className="cell-mono muted" style={{ fontSize: 12, marginLeft: 8, fontWeight: 400 }}>
                {FMT(sumObj(form.allowances))} / mo
              </span>
            </div>
            <Icon name={showAllow ? "chevron-up" : "chevron-down"} size={14} color="var(--fg-3)" />
          </button>
          {showAllow && (
            <div className="form-grid">
              <AmtField label="Housing"       value={form.allowances.housing}       onChange={v => setAl("housing", v)} />
              <AmtField label="Transport"     value={form.allowances.transport}     onChange={v => setAl("transport", v)} />
              <AmtField label="Food"          value={form.allowances.food}          onChange={v => setAl("food", v)} />
              <AmtField label="Communication" value={form.allowances.communication} onChange={v => setAl("communication", v)} />
              <div className="form-group span-2">
                <AmtField label="Other allowances" value={form.allowances.other} onChange={v => setAl("other", v)} />
              </div>
            </div>
          )}
        </div>

        {/* Overtime */}
        <div className="card card-pad">
          <div className="label" style={{ marginBottom: 12 }}>
            Overtime method
            {calc.otAmount > 0 && (
              <span className="cell-mono" style={{ fontSize: 12, marginLeft: 8, fontWeight: 600, color: "var(--success-700)" }}>
                +{FMT(calc.otAmount)} / mo
              </span>
            )}
          </div>

          {/* Method selector grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
            {OT_METHODS.map(m => (
              <button key={m.id}
                onClick={() => setOt("method", m.id)}
                style={{
                  padding: "10px 8px", borderRadius: 8, border: `2px solid ${form.overtime.method === m.id ? "var(--brand-burgundy)" : "var(--border-subtle)"}`,
                  background: form.overtime.method === m.id ? "var(--plum-50)" : "var(--surface)",
                  cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  color: form.overtime.method === m.id ? "var(--brand-burgundy)" : "var(--fg-2)",
                  transition: "all 120ms",
                }}>
                <Icon name={m.icon} size={15} color={form.overtime.method === m.id ? "var(--brand-burgundy)" : "var(--fg-3)"} />
                <span style={{ fontSize: 11, fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Method-specific inputs */}
          {(form.overtime.method === "hourly_1_5" || form.overtime.method === "hourly_2_0") && (
            <div className="form-grid">
              <AmtField label="Overtime hours / month" value={form.overtime.hoursPerMonth} onChange={v => setOt("hoursPerMonth", v)} prefix="hrs" />
              <div className="form-group">
                <label className="label">Computed OT pay</label>
                <div className="fi" style={{ background: "var(--ink-50)", color: "var(--fg-2)", cursor: "default", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                  {FMT(calc.otAmount)}
                </div>
              </div>
            </div>
          )}
          {form.overtime.method === "daily" && (
            <div className="form-grid">
              <AmtField label="OT days / month"    value={form.overtime.daysPerMonth}  onChange={v => setOt("daysPerMonth", v)} prefix="days" />
              <div className="form-group">
                <label className="label">Rate multiplier</label>
                <select className="fi" value={form.overtime.rateMultiplier} onChange={e => setOt("rateMultiplier", parseFloat(e.target.value))}>
                  <option value={1.0}>1.0 × (standard)</option>
                  <option value={1.5}>1.5 × (time-and-half)</option>
                  <option value={2.0}>2.0 × (double time)</option>
                </select>
              </div>
            </div>
          )}
          {form.overtime.method === "flat" && (
            <AmtField label="Fixed overtime amount / month" value={form.overtime.flatAmount} onChange={v => setOt("flatAmount", v)} />
          )}
          {form.overtime.method === "percent" && (
            <div className="form-grid">
              <AmtField label="% of base salary" value={form.overtime.percentageOfBase} onChange={v => setOt("percentageOfBase", v)} prefix="%" />
              <div className="form-group">
                <label className="label">Computed OT pay</label>
                <div className="fi" style={{ background: "var(--ink-50)", color: "var(--fg-2)", cursor: "default", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                  {FMT(calc.otAmount)}
                </div>
              </div>
            </div>
          )}
          {form.overtime.method !== "none" && (
            <div style={{ marginTop: 8, padding: "8px 12px", background: "var(--success-50)", borderRadius: 8, fontSize: 12, color: "var(--success-700)" }}>
              <Icon name="info" size={13} /> Based on {FMT(form.base / 176)} / hr · {FMT(form.base / 22)} / day (22 working days, 176 hrs/month)
            </div>
          )}
        </div>

        {/* Deductions */}
        <div className="card card-pad">
          <button style={{ all: "unset", cursor: "pointer", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showDed ? 14 : 0 }}
            onClick={() => setShowDed(v => !v)}>
            <div className="label" style={{ margin: 0 }}>
              Deductions
              {sumObj(form.deductions) > 0 && (
                <span className="cell-mono" style={{ fontSize: 12, marginLeft: 8, fontWeight: 600, color: "var(--danger-700)" }}>
                  −{FMT(sumObj(form.deductions))} / mo
                </span>
              )}
            </div>
            <Icon name={showDed ? "chevron-up" : "chevron-down"} size={14} color="var(--fg-3)" />
          </button>
          {showDed && (
            <div className="form-grid">
              <AmtField label="Loan repayment"    value={form.deductions.loan}      onChange={v => setDed("loan", v)} />
              <AmtField label="Salary advance"    value={form.deductions.advance}   onChange={v => setDed("advance", v)} />
              <AmtField label="Insurance / DEWS"  value={form.deductions.insurance} onChange={v => setDed("insurance", v)} />
              <AmtField label="Other deductions"  value={form.deductions.other}     onChange={v => setDed("other", v)} />
            </div>
          )}
        </div>

        {/* Effective date + reason */}
        <div className="card card-pad">
          <div className="label" style={{ marginBottom: 12 }}>Apply changes</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="label">Effective date</label>
              <input className="fi" type="date" value={form.effectiveDate ? form.effectiveDate.split(" ").reverse().join("-").replace(/(\w{3})/,m=>({Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12"})[m]||m) : ""}
                onChange={e => {
                  const d = new Date(e.target.value);
                  const label = d.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
                  set("effectiveDate", label);
                }} />
            </div>
            <div className="form-group">
              <label className="label">Approved by</label>
              <input className="fi" defaultValue="HR" readOnly style={{ background: "var(--ink-50)", color: "var(--fg-2)" }} />
            </div>
            <div className="form-group span-2">
              <label className="label">Reason for change <span className="req">*</span></label>
              <input className="fi" value={reason} onChange={e => { setReason(e.target.value); setErr(""); }}
                placeholder="e.g. Annual increment, role change, market adjustment…" />
            </div>
          </div>

          {err && (
            <div className="form-err" style={{ marginTop: 12 }}>
              <Icon name="alert-circle" size={14} color="var(--danger-700)" /> {err}
            </div>
          )}

          <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="secondary" onClick={() => { setForm(cloneStruct(current || {})); setReason(""); setErr(""); }}>
              Reset
            </Button>
            <Button variant="primary" icon={saved ? "check" : "save"} onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Right: Slip preview ── */}
      <SalarySlip form={form} current={current} employee={employee} />
    </div>
  );
}

// ── Overview table ────────────────────────────────────────────────────────────
function SalaryOverview({ structures, onEdit }) {
  const [q, setQ] = useStateSC("");
  const [sortBy, setSortBy] = useStateSC("name");
  const [sortDir, setSortDir] = useStateSC(1);
  const [soPage,     setSoPage]     = useStateSC(1);
  const [soPageSize, setSoPageSize] = useStateSC(10);

  const filtered = useMemoSC(() => {
    let list = structures.filter(s =>
      !q || s.empName.toLowerCase().includes(q.toLowerCase()) || s.dept.toLowerCase().includes(q.toLowerCase())
    );
    list = [...list].sort((a, b) => {
      const ca = computeSalary(a), cb = computeSalary(b);
      switch (sortBy) {
        case "name":  return sortDir * a.empName.localeCompare(b.empName);
        case "base":  return sortDir * (a.base - b.base);
        case "gross": return sortDir * (ca.gross - cb.gross);
        case "net":   return sortDir * (ca.net - cb.net);
        default:      return 0;
      }
    });
    return list;
  }, [structures, q, sortBy, sortDir]);

  useEffectSC(() => { setSoPage(1); }, [q, sortBy, sortDir, soPageSize]);

  const soTotalPages  = Math.max(1, Math.ceil(filtered.length / soPageSize));
  const soSafePage    = Math.min(soPage, soTotalPages);
  const soStart       = (soSafePage - 1) * soPageSize;
  const soPageRows    = filtered.slice(soStart, soStart + soPageSize);
  const soNavBtn      = (dis) => ({ width:30, height:30, borderRadius:7, border:"1px solid var(--border-subtle)", background:"var(--bg-surface)", cursor:dis?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:dis?0.4:1 });
  const soPageButtons = useMemoSC(() => {
    if (soTotalPages <= 7) return Array.from({ length: soTotalPages }, (_, i) => i + 1);
    const left  = Math.max(2, soSafePage - 2);
    const right = Math.min(soTotalPages - 1, soSafePage + 2);
    const r = [1];
    if (left > 2) r.push("...");
    for (let i = left; i <= right; i++) r.push(i);
    if (right < soTotalPages - 1) r.push("...");
    if (soTotalPages > 1) r.push(soTotalPages);
    return r;
  }, [soTotalPages, soSafePage]);

  const totals = useMemoSC(() =>
    structures.reduce((t, s) => {
      const c = computeSalary(s);
      return { base: t.base + c.base, allowTotal: t.allowTotal + c.allowTotal, otAmount: t.otAmount + c.otAmount, dedTotal: t.dedTotal + c.dedTotal, gross: t.gross + c.gross, net: t.net + c.net };
    }, { base: 0, allowTotal: 0, otAmount: 0, dedTotal: 0, gross: 0, net: 0 }),
    [structures]
  );

  const sort = (key) => {
    if (sortBy === key) setSortDir(d => -d);
    else { setSortBy(key); setSortDir(1); }
  };
  const SortIcon = ({ k }) => (
    <Icon name={sortBy === k ? (sortDir > 0 ? "chevron-up" : "chevron-down") : "chevrons-up-down"} size={12} color={sortBy === k ? "var(--brand-burgundy)" : "var(--fg-4)"} />
  );

  return (
    <div className="card">
      <div className="tbl-toolbar">
        <div className="search" style={{ flex: 1, maxWidth: 300 }}>
          <Icon name="search" size={13} color="var(--fg-3)" />
          <input placeholder="Search by name or department…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <span className="muted" style={{ fontSize: 12 }}>{filtered.length} employees</span>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Grade</th>
            <th style={{ cursor: "pointer" }} onClick={() => sort("base")}>Base <SortIcon k="base" /></th>
            <th>Allowances</th>
            <th>Overtime</th>
            <th>Deductions</th>
            <th style={{ cursor: "pointer" }} onClick={() => sort("gross")}>Gross <SortIcon k="gross" /></th>
            <th style={{ cursor: "pointer" }} onClick={() => sort("net")}>Net pay <SortIcon k="net" /></th>
            <th />
          </tr>
        </thead>
        <tbody>
          {soPageRows.map(s => {
            const c = computeSalary(s);
            const otMethod = OT_METHODS.find(m => m.id === s.overtime?.method);
            return (
              <tr key={s.empId}>
                <td><AvatarRow name={s.empName} sub={s.dept} /></td>
                <td><Chip kind="default" dot={false}>{s.grade || "—"}</Chip></td>
                <td className="cell-mono">{FMT(c.base)}</td>
                <td className="cell-mono">{c.allowTotal > 0 ? FMT(c.allowTotal) : <span className="muted">—</span>}</td>
                <td>
                  {c.otAmount > 0
                    ? <span className="cell-mono" style={{ color: "var(--success-700)", fontWeight: 600 }}>+{FMT(c.otAmount)}</span>
                    : <span className="muted" style={{ fontSize: 12 }}>—</span>}
                  {s.overtime?.method !== "none" && (
                    <div style={{ fontSize: 10.5, color: "var(--fg-4)", marginTop: 2 }}>{otMethod?.label}</div>
                  )}
                </td>
                <td className="cell-mono" style={{ color: c.dedTotal > 0 ? "var(--danger-700)" : undefined }}>
                  {c.dedTotal > 0 ? "−" + FMT(c.dedTotal) : <span className="muted">—</span>}
                </td>
                <td className="cell-mono" style={{ fontWeight: 600 }}>{FMT(c.gross)}</td>
                <td className="cell-mono" style={{ fontWeight: 700, color: "var(--brand-burgundy)" }}>{FMT(c.net)}</td>
                <td>
                  <Button variant="ghost" size="sm" icon="edit" onClick={() => onEdit(s.empId)}>Edit</Button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ background: "var(--ink-50)", fontWeight: 700 }}>
            <td colSpan={2} style={{ fontWeight: 700, fontSize: 12.5 }}>Monthly total ({structures.length} employees)</td>
            <td className="cell-mono">{FMT(totals.base)}</td>
            <td className="cell-mono">{FMT(totals.allowTotal)}</td>
            <td className="cell-mono" style={{ color: "var(--success-700)" }}>{totals.otAmount > 0 ? "+"+FMT(totals.otAmount) : "—"}</td>
            <td className="cell-mono" style={{ color: "var(--danger-700)" }}>{totals.dedTotal > 0 ? "−"+FMT(totals.dedTotal) : "—"}</td>
            <td className="cell-mono">{FMT(totals.gross)}</td>
            <td className="cell-mono" style={{ color: "var(--brand-burgundy)" }}>{FMT(totals.net)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
      {filtered.length > 0 && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderTop:"1px solid var(--border-subtle)", flexWrap:"wrap", gap:8 }}>
          <div style={{ fontSize:12.5, color:"var(--fg-3)" }}>
            {soStart+1}–{Math.min(soStart+soPageSize, filtered.length)} of {filtered.length} employees
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:12, color:"var(--fg-3)" }}>Rows</span>
            <select value={soPageSize} onChange={e => { setSoPageSize(Number(e.target.value)); setSoPage(1); }}
              style={{ height:28, fontSize:12, padding:"0 6px", borderRadius:6, border:"1px solid var(--border-subtle)", background:"var(--bg-surface)" }}>
              {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <div style={{ display:"flex", gap:4 }}>
              <button onClick={() => setSoPage(1)} disabled={soSafePage===1} style={soNavBtn(soSafePage===1)}><span style={{fontSize:12}}>«</span></button>
              <button onClick={() => setSoPage(soSafePage-1)} disabled={soSafePage===1} style={soNavBtn(soSafePage===1)}><span style={{fontSize:12}}>‹</span></button>
              {soPageButtons.map((b,i) => b==="..." ? (
                <span key={"e"+i} style={{width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"var(--fg-3)"}}>…</span>
              ) : (
                <button key={b} onClick={() => setSoPage(b)} style={{width:30,height:30,borderRadius:7,border:"1px solid var(--border-subtle)",cursor:"pointer",fontSize:12,fontWeight:b===soSafePage?700:400,background:b===soSafePage?"var(--brand-burgundy)":"var(--bg-surface)",color:b===soSafePage?"#fff":"var(--fg-1)"}}>
                  {b}
                </button>
              ))}
              <button onClick={() => setSoPage(soSafePage+1)} disabled={soSafePage===soTotalPages} style={soNavBtn(soSafePage===soTotalPages)}><span style={{fontSize:12}}>›</span></button>
              <button onClick={() => setSoPage(soTotalPages)} disabled={soSafePage===soTotalPages} style={soNavBtn(soSafePage===soTotalPages)}><span style={{fontSize:12}}>»</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── History ───────────────────────────────────────────────────────────────────
function SalaryHistory({ changes, loading }) {
  const [empFilter, setEmpFilter] = useStateSC("all");
  const [shPage,     setShPage]     = useStateSC(1);
  const [shPageSize, setShPageSize] = useStateSC(10);

  const empIds = useMemoSC(() => [...new Set(changes.map(c => c.empId))], [changes]);

  const filtered = useMemoSC(() =>
    changes.filter(c => empFilter === "all" || c.empId === empFilter),
    [changes, empFilter]
  );

  useEffectSC(() => { setShPage(1); }, [empFilter, shPageSize]);

  const shTotalPages  = Math.max(1, Math.ceil(filtered.length / shPageSize));
  const shSafePage    = Math.min(shPage, shTotalPages);
  const shStart       = (shSafePage - 1) * shPageSize;
  const shPageRows    = filtered.slice(shStart, shStart + shPageSize);
  const shNavBtn      = (dis) => ({ width:30, height:30, borderRadius:7, border:"1px solid var(--border-subtle)", background:"var(--bg-surface)", cursor:dis?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:dis?0.4:1 });
  const shPageButtons = useMemoSC(() => {
    if (shTotalPages <= 7) return Array.from({ length: shTotalPages }, (_, i) => i + 1);
    const left  = Math.max(2, shSafePage - 2);
    const right = Math.min(shTotalPages - 1, shSafePage + 2);
    const r = [1];
    if (left > 2) r.push("...");
    for (let i = left; i <= right; i++) r.push(i);
    if (right < shTotalPages - 1) r.push("...");
    if (shTotalPages > 1) r.push(shTotalPages);
    return r;
  }, [shTotalPages, shSafePage]);

  const TYPE_KIND = { base:"brand", allowance:"info", overtime:"success", deduction:"danger", bonus:"warning", structure:"default" };

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--fg-3)" }}>
      <Icon name="loader" size={24} color="var(--ink-300)" />
    </div>
  );

  return (
    <div className="card">
      <div className="tbl-toolbar">
        <select className="fi" style={{ width: 220, fontSize: 12, height: 32, padding: "0 8px" }}
          value={empFilter} onChange={e => setEmpFilter(e.target.value)}>
          <option value="all">All employees</option>
          {empIds.map(id => {
            const c = changes.find(x => x.empId === id);
            return <option key={id} value={id}>{c?.empName || id}</option>;
          })}
        </select>
        <span className="muted" style={{ fontSize: 12 }}>{filtered.length} changes</span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--fg-4)", fontSize: 13 }}>
          <Icon name="history" size={28} color="var(--ink-300)" /><br />No salary changes recorded yet.
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Type</th>
              <th>Previous net</th>
              <th>New net</th>
              <th>Change</th>
              <th>Reason</th>
              <th>Approved by</th>
            </tr>
          </thead>
          <tbody>
            {shPageRows.map(c => {
              const diff = c.toAmount - c.fromAmount;
              return (
                <tr key={c.changeId}>
                  <td className="cell-mono muted" style={{ fontSize: 12 }}>
                    {new Date(c.createdAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}
                  </td>
                  <td><AvatarRow name={c.empName} sub={c.dept} /></td>
                  <td><Chip kind={TYPE_KIND[c.changeType] || "default"} dot={false}>{c.component}</Chip></td>
                  <td className="cell-mono muted">{FMT(c.fromAmount)}</td>
                  <td className="cell-mono" style={{ fontWeight: 600 }}>{FMT(c.toAmount)}</td>
                  <td className="cell-mono" style={{ fontWeight: 700, color: diff >= 0 ? "var(--success-700)" : "var(--danger-700)" }}>
                    {diff >= 0 ? "+" : ""}{FMT(diff)}
                  </td>
                  <td style={{ maxWidth: 200, fontSize: 12.5, color: "var(--fg-2)" }}>{c.reason || "—"}</td>
                  <td className="cell-muted">{c.approvedBy || "HR"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {filtered.length > 0 && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderTop:"1px solid var(--border-subtle)", flexWrap:"wrap", gap:8 }}>
          <div style={{ fontSize:12.5, color:"var(--fg-3)" }}>
            {shStart+1}–{Math.min(shStart+shPageSize, filtered.length)} of {filtered.length} changes
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:12, color:"var(--fg-3)" }}>Rows</span>
            <select value={shPageSize} onChange={e => { setShPageSize(Number(e.target.value)); setShPage(1); }}
              style={{ height:28, fontSize:12, padding:"0 6px", borderRadius:6, border:"1px solid var(--border-subtle)", background:"var(--bg-surface)" }}>
              {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <div style={{ display:"flex", gap:4 }}>
              <button onClick={() => setShPage(1)} disabled={shSafePage===1} style={shNavBtn(shSafePage===1)}><span style={{fontSize:12}}>«</span></button>
              <button onClick={() => setShPage(shSafePage-1)} disabled={shSafePage===1} style={shNavBtn(shSafePage===1)}><span style={{fontSize:12}}>‹</span></button>
              {shPageButtons.map((b,i) => b==="..." ? (
                <span key={"e"+i} style={{width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"var(--fg-3)"}}>…</span>
              ) : (
                <button key={b} onClick={() => setShPage(b)} style={{width:30,height:30,borderRadius:7,border:"1px solid var(--border-subtle)",cursor:"pointer",fontSize:12,fontWeight:b===shSafePage?700:400,background:b===shSafePage?"var(--brand-burgundy)":"var(--bg-surface)",color:b===shSafePage?"#fff":"var(--fg-1)"}}>
                  {b}
                </button>
              ))}
              <button onClick={() => setShPage(shSafePage+1)} disabled={shSafePage===shTotalPages} style={shNavBtn(shSafePage===shTotalPages)}><span style={{fontSize:12}}>›</span></button>
              <button onClick={() => setShPage(shTotalPages)} disabled={shSafePage===shTotalPages} style={shNavBtn(shSafePage===shTotalPages)}><span style={{fontSize:12}}>»</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function SalaryPage({ data }) {
  const [tab,        setTab]        = useStateSC("overview");
  const [calcEmpId,  setCalcEmpId]  = useStateSC(null);
  const [structures, setStructures] = useStateSC([]);
  const [changes,    setChanges]    = useStateSC([]);
  const [loading,    setLoading]    = useStateSC(true);
  const [histLoading,setHistLoading]= useStateSC(false);

  const employees = data?.employees || [];

  useEffectSC(() => {
    fetch(`${API}/salary-structures`)
      .then(r => r.json())
      .then(d => { setStructures(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffectSC(() => {
    if (tab !== "history" || changes.length) return;
    setHistLoading(true);
    fetch(`${API}/salary-structures/changes/all`)
      .then(r => r.json())
      .then(d => { setChanges(d); setHistLoading(false); })
      .catch(() => setHistLoading(false));
  }, [tab]);

  const handleEdit = (empId) => {
    setCalcEmpId(empId);
    setTab("calculator");
  };

  // When structure is saved in calculator, update local structures state
  const refreshStructures = () => {
    fetch(`${API}/salary-structures`).then(r => r.json()).then(setStructures).catch(() => {});
  };

  const totals = useMemoSC(() =>
    structures.reduce((t, s) => {
      const c = computeSalary(s);
      return { gross: t.gross + c.gross, net: t.net + c.net, ot: t.ot + (c.otAmount > 0 ? 1 : 0) };
    }, { gross: 0, net: 0, ot: 0 }),
    [structures]
  );

  if (loading) return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
      <div style={{ width: 32, height: 32, border: "3px solid var(--plum-100)", borderTopColor: "var(--brand-burgundy)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Money · Payroll</div>
          <h1 className="page-title">Salary structures</h1>
          <div className="page-sub">
            Manage base salaries, allowances, overtime methods and deductions per employee.
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Employees on structure", value: structures.length, icon: "users", color: "var(--brand-burgundy)" },
          { label: "Total monthly gross",    value: FMT(totals.gross), icon: "trending-up", color: "var(--success-700)" },
          { label: "Total monthly net",      value: FMT(totals.net),   icon: "wallet",      color: "var(--brand-burgundy)" },
          { label: "With overtime",          value: totals.ot,          icon: "clock",       color: "var(--warning-700)" },
        ].map(k => (
          <div key={k.label} className="card card-pad" style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--ink-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={k.icon} size={20} color={k.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 600, marginBottom: 2 }}>{k.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--fg-1)" }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid var(--border-subtle)", marginBottom: 20 }}>
        <Tabs active={tab} onChange={setTab} tabs={[
          { id: "overview",    label: "Overview",   count: structures.length },
          { id: "calculator",  label: "Calculator" },
          { id: "history",     label: "Change history", count: changes.length || undefined },
        ]} />
      </div>

      {tab === "overview" && (
        <SalaryOverview
          structures={structures}
          onEdit={empId => { setCalcEmpId(empId); setTab("calculator"); }}
        />
      )}

      {tab === "calculator" && (
        <SalaryCalculator
          key={calcEmpId}
          structures={structures}
          employees={employees}
          initialEmpId={calcEmpId}
          onSaved={() => { refreshStructures(); setChanges([]); }}
        />
      )}

      {tab === "history" && (
        <SalaryHistory changes={changes} loading={histLoading} />
      )}
    </div>
  );
}

Object.assign(window, { SalaryPage });
