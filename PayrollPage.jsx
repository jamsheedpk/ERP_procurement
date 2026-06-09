/* global React, Icon, Avatar, AvatarRow, Chip, Button, KPI, API */
const {
  useState:    useStatePy,
  useMemo:     useMemoPayroll,
  useEffect:   useEffectPy,
  useCallback: useCallbackPy,
} = React;

// ── Currency config ──────────────────────────────────────────────────────────
const PAYROLL_CURRENCIES = {
  AED: { symbol: "AED", rate: 1,      label: "UAE Dirham"    },
  USD: { symbol: "$",   rate: 3.673,  label: "US Dollar"     },
  EUR: { symbol: "€",   rate: 3.97,   label: "Euro"          },
  GBP: { symbol: "£",   rate: 4.63,   label: "British Pound" },
  SAR: { symbol: "SAR", rate: 0.978,  label: "Saudi Riyal"   },
};

// ── UAE end-of-service gratuity (Federal Labour Law) ─────────────────────────
function calcGratuity(monthlySalary, yearsOfService) {
  if (yearsOfService < 1) return 0;
  const dailyWage = (monthlySalary * 12) / 365;
  const base5  = Math.min(yearsOfService, 5) * 21 * dailyWage;
  const above5 = yearsOfService > 5 ? (yearsOfService - 5) * 30 * dailyWage : 0;
  return Math.round(base5 + above5);
}

// ── New Run Modal ─────────────────────────────────────────────────────────────
function NewRunModal({ employees, onSave, onClose, defaultRunType = "regular" }) {
  const now  = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const defaultMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;

  const [month,     setMonth]     = React.useState(defaultMonth);
  const [day,       setDay]       = React.useState("28");
  const [runType,   setRunType]   = React.useState(defaultRunType);
  const [offReason, setOffReason] = React.useState("bonus");
  const [currency,  setCurrency]  = React.useState("AED");
  const [wageBasis, setWageBasis] = React.useState("monthly");
  const [workDays,  setWorkDays]  = React.useState("22");
  const [workHours, setWorkHours] = React.useState("176");
  const [saving,    setSaving]    = React.useState(false);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [yr, mo]   = month.split("-");
  const monthName  = MONTHS[parseInt(mo) - 1];
  const periodBase = monthName + " " + yr;
  const periodLabel = runType === "off_cycle"
    ? `Off-cycle (${offReason}) ${periodBase}`
    : periodBase;

  const active     = employees.filter(e => e.status === "active");
  const fxRate     = PAYROLL_CURRENCIES[currency]?.rate || 1;
  const estGrossAED = active.reduce((s, e) => s + (e.salary || 20000), 0);
  const estGrossFx  = Math.round(estGrossAED / fxRate);
  const currSym    = PAYROLL_CURRENCIES[currency]?.symbol || currency;

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      period: periodLabel, runDate: day + " " + monthName + " " + yr,
      month, runType, currency, wageBasis,
      workDays: Number(workDays), workHours: Number(workHours),
      offReason: runType === "off_cycle" ? offReason : null,
    });
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">New payroll run</div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Run type toggle */}
          <div className="form-row">
            <label className="fi-label">Run type</label>
            <div className="segmented" style={{ width: "100%" }}>
              {[{ v: "regular", l: "Regular monthly" }, { v: "off_cycle", l: "Off-cycle" }].map(({ v, l }) => (
                <button key={v} className={runType === v ? "active" : ""} style={{ flex: 1 }}
                  onClick={() => setRunType(v)}>{l}</button>
              ))}
            </div>
          </div>

          {runType === "off_cycle" && (
            <div className="form-row">
              <label className="fi-label">Reason for off-cycle run</label>
              <select className="fi" value={offReason} onChange={e => setOffReason(e.target.value)}>
                <option value="bonus">Bonus payout</option>
                <option value="correction">Payroll correction</option>
                <option value="commission">Commission</option>
                <option value="advance">Salary advance</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          <div className="form-row">
            <label className="fi-label">Pay period (month)</label>
            <input type="month" className="fi" value={month} onChange={e => setMonth(e.target.value)} />
          </div>

          {runType === "regular" && (
            <div className="form-row">
              <label className="fi-label">Salary payment day</label>
              <select className="fi" value={day} onChange={e => setDay(e.target.value)}>
                {[25, 26, 27, 28, 29, 30].map(d => (
                  <option key={d} value={d}>{d} {monthName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Currency + wage basis */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-row">
              <label className="fi-label">Pay currency</label>
              <select className="fi" value={currency} onChange={e => setCurrency(e.target.value)}>
                {Object.entries(PAYROLL_CURRENCIES).map(([code, c]) => (
                  <option key={code} value={code}>{code} — {c.label}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label className="fi-label">Wage basis</label>
              <select className="fi" value={wageBasis} onChange={e => setWageBasis(e.target.value)}>
                <option value="monthly">Monthly salary</option>
                <option value="daily">Daily rate</option>
                <option value="hourly">Hourly rate</option>
              </select>
            </div>
          </div>

          {wageBasis === "daily" && (
            <div className="form-row">
              <label className="fi-label">Working days this month</label>
              <input type="number" className="fi" min="1" max="31"
                value={workDays} onChange={e => setWorkDays(e.target.value)} />
            </div>
          )}
          {wageBasis === "hourly" && (
            <div className="form-row">
              <label className="fi-label">Billable hours this month</label>
              <input type="number" className="fi" min="1"
                value={workHours} onChange={e => setWorkHours(e.target.value)} />
            </div>
          )}

          {/* Summary */}
          <div style={{ padding: "12px 14px", borderRadius: 8, background: "var(--plum-50)", fontSize: 12.5, lineHeight: 1.8 }}>
            <div>
              <strong>{active.length}</strong> active employees · Est. gross{" "}
              <strong>
                {currency !== "AED"
                  ? `${currSym} ${estGrossFx.toLocaleString()} (AED ${estGrossAED.toLocaleString()})`
                  : `AED ${estGrossAED.toLocaleString()}`}
              </strong>
            </div>
            {wageBasis === "daily" && (
              <div style={{ color: "var(--fg-3)", fontSize: 11.5 }}>
                Daily rate = monthly salary ÷ {workDays} working days
              </div>
            )}
            {wageBasis === "hourly" && (
              <div style={{ color: "var(--fg-3)", fontSize: 11.5 }}>
                Hourly rate = monthly salary ÷ {workHours} billable hours
              </div>
            )}
            {currency !== "AED" && (
              <div style={{ color: "var(--fg-3)", fontSize: 11.5 }}>
                Exchange rate: 1 {currency} = AED {fxRate}
              </div>
            )}
            <div style={{ color: "var(--fg-3)", fontSize: 11.5 }}>
              Lines auto-generated from current salaries. Edit OT / bonus after creation.
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="play" onClick={handleSave} disabled={saving}>
            {saving ? "Creating…" : "Generate run"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Payroll Stepper ───────────────────────────────────────────────────────────
function PayrollStepper({ stages, onToggle }) {
  const doneCount = stages.filter(s => s.done).length;
  const total     = stages.length;
  const pct       = doneCount === 0 ? 0 : ((doneCount - 1) / (total - 1)) * 100;

  return (
    <div style={{ position: "relative", paddingBottom: 8 }}>
      <div style={{ position: "absolute", top: 18, left: 22, right: 22, height: 2, background: "var(--ink-200)", borderRadius: 1 }}>
        <div style={{ width: pct + "%", height: "100%", background: "var(--brand-burgundy)", borderRadius: 1, transition: "width 0.5s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
        {stages.map((s, i) => {
          const isPast    = s.done;
          const isCurrent = i === doneCount && doneCount < total;
          return (
            <div key={s.id}
              onClick={() => onToggle && onToggle(i)}
              title={isPast ? "Click to undo stage" : "Click to mark done"}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, maxWidth: 96, textAlign: "center", zIndex: 1, cursor: "pointer" }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: isPast ? "var(--brand-burgundy)" : isCurrent ? "#fff" : "var(--ink-100)",
                color:      isPast ? "#fff"                  : isCurrent ? "var(--brand-burgundy)" : "var(--fg-4)",
                border: isPast ? "2px solid var(--brand-burgundy)"
                  : isCurrent ? "2.5px solid var(--brand-burgundy)" : "2px solid var(--ink-200)",
                boxShadow: isCurrent ? "0 0 0 5px var(--plum-100)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0, transition: "all 0.2s",
              }}>
                {isPast ? <Icon name="check" size={15} stroke={2.5} color="#fff" /> : i + 1}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.3, color: isPast ? "var(--fg-1)" : isCurrent ? "var(--brand-burgundy)" : "var(--fg-3)" }}>
                {s.label}
              </div>
              <div style={{ fontSize: 10.5, lineHeight: 1.3, color: isPast ? "var(--success-700)" : "var(--fg-4)" }}>
                {isPast ? (s.at || "").split(" ").slice(0, 2).join(" ") : s.due ? "Due " + (s.due || "").split(" ").slice(0, 2).join(" ") : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Final Settlement Panel ────────────────────────────────────────────────────
function FinalSettlementPanel({ employees }) {
  const [selEmpId, setSelEmpId] = useStatePy("");
  const [joinDate, setJoinDate] = useStatePy("");
  const [lastDate, setLastDate] = useStatePy("");
  const [reason,   setReason]   = useStatePy("resignation");
  const [queue,    setQueue]    = useStatePy([]);

  const emp = employees.find(e => e.empId === selEmpId);

  const yearsOfService = React.useMemo(() => {
    if (!joinDate || !lastDate) return 0;
    const ms = new Date(lastDate) - new Date(joinDate);
    return parseFloat((ms / (1000 * 60 * 60 * 24 * 365.25)).toFixed(2));
  }, [joinDate, lastDate]);

  const gratuity  = emp ? calcGratuity(emp.salary || 20000, yearsOfService) : 0;
  const noticePay = emp ? (emp.salary || 20000) : 0;
  const leavePay  = emp ? Math.round((emp.salary || 20000) / 30 * 15) : 0;
  const totalAmt  = gratuity + noticePay + leavePay;

  const handleQueue = () => {
    if (!emp || !joinDate || !lastDate) return;
    setQueue(prev => [{
      empId: emp.empId, name: emp.name, dept: emp.dept,
      salary: emp.salary || 20000, years: yearsOfService, reason,
      gratuity, noticePay, leavePay, total: totalAmt, lastDate,
    }, ...prev]);
    setSelEmpId(""); setJoinDate(""); setLastDate("");
  };

  const REASON_LABEL = {
    resignation: "Resignation", termination: "Termination",
    retirement: "Retirement",   contract_end: "Contract End",
  };

  return (
    <div>
      <div className="page-head" style={{ marginBottom: 20 }}>
        <div>
          <div className="eyebrow">Money · Payroll · Final Settlement</div>
          <h1 className="page-title">Final Settlement Processing</h1>
          <div className="page-sub">UAE Federal Labour Law end-of-service gratuity computation</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Input */}
        <div className="card">
          <div className="card-head"><div className="card-title-lg">Settlement Details</div></div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-row">
              <label className="fi-label">Employee</label>
              <select className="fi" value={selEmpId} onChange={e => setSelEmpId(e.target.value)}>
                <option value="">Select employee…</option>
                {employees.filter(e => e.status === "active").map(e => (
                  <option key={e.empId} value={e.empId}>{e.name} · {e.dept}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label className="fi-label">Separation reason</label>
              <select className="fi" value={reason} onChange={e => setReason(e.target.value)}>
                <option value="resignation">Resignation</option>
                <option value="termination">Termination by employer</option>
                <option value="retirement">Retirement</option>
                <option value="contract_end">Contract end</option>
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-row">
                <label className="fi-label">Date of joining</label>
                <input type="date" className="fi" value={joinDate} onChange={e => setJoinDate(e.target.value)} />
              </div>
              <div className="form-row">
                <label className="fi-label">Last working day</label>
                <input type="date" className="fi" value={lastDate} onChange={e => setLastDate(e.target.value)} />
              </div>
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--plum-50)", fontSize: 12, lineHeight: 1.7, color: "var(--fg-3)" }}>
              <strong style={{ color: "var(--fg-1)" }}>Gratuity formula (UAE Labour Law):</strong><br />
              First 5 years: 21 calendar days per year × basic daily wage<br />
              Beyond 5 years: additional 30 days per year<br />
              Daily wage = (monthly basic × 12) ÷ 365
            </div>
            <Button variant="primary" icon="calculator" onClick={handleQueue}
              disabled={!emp || !joinDate || !lastDate}>
              Add to Settlement Queue
            </Button>
          </div>
        </div>

        {/* Breakdown */}
        <div className="card">
          <div className="card-head">
            <div className="card-title-lg">Entitlement Breakdown</div>
            {emp && yearsOfService >= 1 && (
              <Chip kind="info">{yearsOfService.toFixed(1)} yrs service</Chip>
            )}
          </div>
          <div className="card-pad">
            {!emp ? (
              <div style={{ textAlign: "center", color: "var(--fg-4)", padding: "48px 0", fontSize: 13 }}>
                <Icon name="calculator" size={28} color="var(--ink-200)" />
                <div style={{ marginTop: 10 }}>Select an employee to compute entitlements</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div style={{ padding: "10px 14px", background: "var(--ink-50)", borderRadius: 8, fontSize: 12.5, marginBottom: 12 }}>
                  <strong>{emp.name}</strong> · {emp.dept} · AED {(emp.salary || 20000).toLocaleString()}/mo
                </div>
                {[
                  {
                    label: "End-of-service gratuity",
                    note: yearsOfService < 1 ? "< 1 year: not eligible"
                      : yearsOfService <= 5  ? `${yearsOfService.toFixed(1)} yrs × 21 days × daily wage`
                      : `5 yrs × 21 days + ${(yearsOfService - 5).toFixed(1)} yrs × 30 days`,
                    amount: gratuity,
                    warn: yearsOfService < 1,
                  },
                  { label: "Notice period pay",  note: "1 month basic salary",   amount: noticePay },
                  { label: "Leave encashment",   note: "~15 days accrued leave", amount: leavePay  },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid var(--ink-100)" }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--fg-1)" }}>{row.label}</div>
                      <div style={{ fontSize: 11, color: row.warn ? "var(--warning-700)" : "var(--fg-3)" }}>{row.note}</div>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13 }}>
                      AED {row.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0 4px", fontWeight: 700, fontSize: 15 }}>
                  <span>Total settlement</span>
                  <span style={{ color: "var(--brand-burgundy)", fontFamily: "var(--font-mono)" }}>
                    AED {totalAmt.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settlement queue */}
      {queue.length > 0 && (
        <div className="card">
          <div className="card-head">
            <div className="card-title-lg">Settlement Queue</div>
            <Chip kind="warning">{queue.length} pending</Chip>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Employee</th><th>Reason</th>
                <th style={{ textAlign: "right" }}>Service (yrs)</th>
                <th style={{ textAlign: "right" }}>Gratuity (AED)</th>
                <th style={{ textAlign: "right" }}>Notice (AED)</th>
                <th style={{ textAlign: "right" }}>Leave (AED)</th>
                <th style={{ textAlign: "right" }}>Total (AED)</th>
                <th>Last day</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((s, i) => (
                <tr key={i}>
                  <td><AvatarRow name={s.name} sub={s.dept} color={{ bg: "var(--plum-50)", fg: "var(--brand-burgundy)" }} /></td>
                  <td><Chip kind="default">{REASON_LABEL[s.reason] || s.reason}</Chip></td>
                  <td className="cell-mono" style={{ textAlign: "right" }}>{s.years.toFixed(1)}</td>
                  <td className="cell-mono" style={{ textAlign: "right" }}>{s.gratuity.toLocaleString()}</td>
                  <td className="cell-mono" style={{ textAlign: "right" }}>{s.noticePay.toLocaleString()}</td>
                  <td className="cell-mono" style={{ textAlign: "right" }}>{s.leavePay.toLocaleString()}</td>
                  <td className="cell-mono cell-strong" style={{ textAlign: "right", color: "var(--brand-burgundy)" }}>
                    {s.total.toLocaleString()}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--fg-3)" }}>{s.lastDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tbl-foot" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="secondary" icon="download">Export settlements</Button>
            <Button variant="primary" icon="send">Process all settlements</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Off-cycle Panel ───────────────────────────────────────────────────────────
function OffCyclePanel({ runs, onCreateRun }) {
  const offRuns = runs.filter(r => r.runType === "off_cycle");

  const REASON_LABEL = { bonus: "Bonus", correction: "Correction", commission: "Commission", advance: "Advance", other: "Other" };

  return (
    <div>
      <div className="page-head" style={{ marginBottom: 20 }}>
        <div>
          <div className="eyebrow">Money · Payroll · Off-cycle</div>
          <h1 className="page-title">Off-cycle Payroll Runs</h1>
          <div className="page-sub">Bonus payouts, corrections, commissions and advances outside the regular cycle</div>
        </div>
        <Button variant="primary" icon="plus" onClick={onCreateRun}>New Off-cycle Run</Button>
      </div>

      {offRuns.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px 20px", color: "var(--fg-3)" }}>
          <Icon name="rotate-cw" size={32} color="var(--ink-200)" />
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: "var(--fg-2)" }}>No off-cycle runs yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Create one for bonus payouts, corrections, or advances</div>
          <div style={{ marginTop: 16 }}>
            <Button variant="primary" icon="plus" onClick={onCreateRun}>Create Off-cycle Run</Button>
          </div>
        </div>
      ) : (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Run ID</th><th>Reason</th><th>Period</th>
                <th style={{ textAlign: "right" }}>Headcount</th>
                <th style={{ textAlign: "right" }}>Gross (AED)</th>
                <th style={{ textAlign: "right" }}>Net (AED)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {offRuns.map(r => (
                <tr key={r.runId}>
                  <td><span className="cell-mono" style={{ fontSize: 12 }}>{r.runId}</span></td>
                  <td><Chip kind="info">{REASON_LABEL[r.offReason] || "Off-cycle"}</Chip></td>
                  <td style={{ fontSize: 12.5 }}>{r.period}</td>
                  <td className="cell-mono" style={{ textAlign: "right" }}>{r.headcount}</td>
                  <td className="cell-mono" style={{ textAlign: "right" }}>{(r.gross || 0).toLocaleString()}</td>
                  <td className="cell-mono cell-strong" style={{ textAlign: "right" }}>{(r.netPay || 0).toLocaleString()}</td>
                  <td><Chip kind={r.status === "approved" ? "success" : "warning"}>{r.status}</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main PayrollPage ──────────────────────────────────────────────────────────
function PayrollPage({ data, onUpdate }) {
  const [runs,        setRuns]        = useStatePy([]);
  const [run,         setRun]         = useStatePy(null);
  const [loadingRuns, setLoadingRuns] = useStatePy(true);
  const [saving,      setSaving]      = useStatePy(false);
  const [activeTab,   setActiveTab]   = useStatePy("runs"); // runs | settlement | offcycle

  const [search,       setSearch]       = useStatePy("");
  const [statusFilter, setStatusFilter] = useStatePy("all");
  const [deptFilter,   setDeptFilter]   = useStatePy("all");
  const [pyPage,       setPyPage]       = useStatePy(1);
  const [pyPageSize,   setPyPageSize]   = useStatePy(10);

  const [showNewRun,     setShowNewRun]     = useStatePy(false);
  const [newRunType,     setNewRunType]     = useStatePy("regular");
  const [editingLine,    setEditingLine]    = useStatePy(null);
  const [editVals,       setEditVals]       = useStatePy({});

  useEffectPy(() => {
    fetch(`${API}/payroll`)
      .then(r => r.json())
      .then(docs => {
        setRuns(docs);
        const regular = docs.find(r => r.runType !== "off_cycle") || docs[0];
        if (regular) setRun(regular);
        setLoadingRuns(false);
      })
      .catch(() => setLoadingRuns(false));
  }, []);

  // Currency-aware formatters for the current run
  const currConfig = useMemoPayroll(() => {
    const code = run?.currency || "AED";
    return PAYROLL_CURRENCIES[code] || PAYROLL_CURRENCIES.AED;
  }, [run?.currency]);

  const fmt  = (n) => {
    if (n == null) return "—";
    const converted = Math.round(n / currConfig.rate);
    return currConfig.symbol + " " + converted.toLocaleString();
  };
  const fmtK = (n) => {
    if (n == null) return "—";
    const converted = Math.round(n / currConfig.rate);
    return converted >= 1000
      ? (converted / 1000).toFixed(converted % 1000 === 0 ? 0 : 1) + "K"
      : String(converted);
  };
  const currLabel = run?.currency || "AED";

  const applyRun = useCallbackPy((updated) => {
    setRun(updated);
    setRuns(prev => prev.map(r => r.runId === updated.runId ? updated : r));
    onUpdate && onUpdate("payrollRun", updated);
  }, [onUpdate]);

  const handleSelectRun = useCallbackPy((r) => {
    setRun(r);
    setSearch(""); setStatusFilter("all"); setDeptFilter("all");
    setEditingLine(null);
  }, []);

  // Stage toggle
  const handleStageToggle = useCallbackPy(async (idx) => {
    if (!run || saving) return;
    const newDone = !run.stages[idx].done;
    const now = new Date().toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).replace(",", "");
    const optimistic = {
      ...run,
      stages: run.stages.map((s, i) =>
        i === idx ? { ...s, done: newDone, at: newDone ? now : null } : s
      ),
    };
    setRun(optimistic);
    setSaving(true);
    try {
      const res = await fetch(`${API}/payroll/${run.runId}/stages/${idx}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: newDone, at: now }),
      });
      applyRun(await res.json());
    } catch { setRun(run); }
    finally { setSaving(false); }
  }, [run, saving, applyRun]);

  // Approve
  const handleApprove = useCallbackPy(async () => {
    if (!run || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/payroll/${run.runId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      applyRun(await res.json());
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }, [run, saving, applyRun]);

  // Line status
  const handleLineStatus = useCallbackPy(async (empId, status) => {
    if (!run) return;
    setRun(prev => ({ ...prev, lines: prev.lines.map(l => l.empId === empId ? { ...l, status } : l) }));
    try {
      const res = await fetch(`${API}/payroll/${run.runId}/lines/${empId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      applyRun(await res.json());
    } catch { /* optimistic stays */ }
  }, [run, applyRun]);

  // Line OT / bonus edit
  const startEdit  = (l) => { setEditingLine(l.empId); setEditVals({ overtime: l.overtime || 0, bonus: l.bonus || 0, daysWorked: l.daysWorked || 22, hoursWorked: l.hoursWorked || 176 }); };
  const cancelEdit = ()  => setEditingLine(null);

  const handleLineSave = useCallbackPy(async () => {
    if (!run || editingLine == null) return;
    const ot  = Number(editVals.overtime) || 0;
    const bon = Number(editVals.bonus)    || 0;
    const dw  = Number(editVals.daysWorked)  || 22;
    const hw  = Number(editVals.hoursWorked) || 176;
    const updatedLines = run.lines.map(l => {
      if (l.empId !== editingLine) return l;
      // Recompute base for daily/hourly wage basis
      let base = l.base;
      if (l.wageBasis === "daily")  base = Math.round((l.salary || (l.base / 0.7)) / 22 * dw);
      if (l.wageBasis === "hourly") base = Math.round((l.salary || (l.base / 0.7)) / 176 * hw);
      const allow = l.allowances;
      return { ...l, base, overtime: ot, bonus: bon, daysWorked: dw, hoursWorked: hw, net: base + allow + ot + bon - l.deductions };
    });
    const newGross = updatedLines.reduce((s, l) => s + l.base + l.allowances + (l.overtime || 0) + (l.bonus || 0), 0);
    const newNet   = updatedLines.reduce((s, l) => s + l.net, 0);
    const newBon   = updatedLines.reduce((s, l) => s + (l.overtime || 0) + (l.bonus || 0), 0);
    setRun(prev => ({ ...prev, lines: updatedLines, gross: newGross, netPay: newNet, bonuses: newBon }));
    setEditingLine(null);
    try {
      const res = await fetch(`${API}/payroll/${run.runId}/lines/${editingLine}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overtime: ot, bonus: bon, daysWorked: dw, hoursWorked: hw }),
      });
      applyRun(await res.json());
    } catch { /* optimistic stays */ }
  }, [run, editingLine, editVals, applyRun]);

  // Create new run (regular or off-cycle)
  const handleCreateRun = useCallbackPy(async ({ period, runDate, month, runType, currency, wageBasis, workDays, workHours, offReason }) => {
    if (!data?.employees) return;
    const [yr] = month.split("-");
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const mo = MONTHS[parseInt(month.split("-")[1]) - 1];
    const runId = runType === "off_cycle"
      ? `OFF-${month}-${offReason || "misc"}-${Date.now().toString(36).slice(-4)}`
      : `PAY-${month}`;

    const stagesRegular = [
      { id: "import",  label: "Inputs imported",  done: false, at: null, due: "01 " + mo + " " + yr },
      { id: "review",  label: "Variance review",   done: false, at: null, due: "20 " + mo + " " + yr },
      { id: "approve", label: "CFO approval",      done: false, at: null, due: "25 " + mo + " " + yr },
      { id: "bank",    label: "WPS bank file",     done: false, at: null, due: "27 " + mo + " " + yr },
      { id: "payout",  label: "Salaries paid",     done: false, at: null, due: "28 " + mo + " " + yr },
    ];
    const stagesOffCycle = [
      { id: "prepare", label: "Prepared",  done: false, at: null, due: "01 " + mo + " " + yr },
      { id: "approve", label: "Approved",  done: false, at: null, due: "05 " + mo + " " + yr },
      { id: "paid",    label: "Paid",      done: false, at: null, due: "07 " + mo + " " + yr },
    ];

    const lines = data.employees
      .filter(e => e.status === "active")
      .map(e => {
        const salary = e.salary || 20000;
        let base, allowances, dailyRate, hourlyRate, daysWorked, hoursWorked;
        if (wageBasis === "daily") {
          dailyRate  = Math.round(salary / (workDays || 22));
          daysWorked = workDays || 22;
          base       = dailyRate * daysWorked;
          allowances = 0;
        } else if (wageBasis === "hourly") {
          hourlyRate  = Math.round((salary / (workHours || 176)) * 100) / 100;
          hoursWorked = workHours || 176;
          base        = Math.round(hourlyRate * hoursWorked);
          allowances  = 0;
        } else {
          base       = Math.round(salary * 0.70);
          allowances = salary - base;
        }
        const ded = Math.round(salary * 0.05);
        return {
          empId: e.empId, emp: e.name, dept: e.dept, salary,
          wageBasis: wageBasis || "monthly",
          dailyRate, hourlyRate, daysWorked, hoursWorked,
          base, allowances, overtime: 0, bonus: 0, deductions: ded,
          net: base + allowances - ded, status: "ready",
        };
      });

    const gross  = lines.reduce((s, l) => s + l.base + l.allowances, 0);
    const netPay = lines.reduce((s, l) => s + l.net, 0);
    const deds   = lines.reduce((s, l) => s + l.deductions, 0);
    const body   = {
      runId, period, runDate,
      runType: runType || "regular",
      currency: currency || "AED",
      wageBasis: wageBasis || "monthly",
      offReason: offReason || null,
      headcount: lines.length, gross, netPay, deductions: deds, bonuses: 0,
      status: "draft",
      stages: runType === "off_cycle" ? stagesOffCycle : stagesRegular,
      flags: [], lines,
    };
    try {
      const res = await fetch(`${API}/payroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { alert("Run for this period may already exist."); return; }
      const created = await res.json();
      setRuns(prev => [created, ...prev]);
      if (runType !== "off_cycle") setRun(created);
      setShowNewRun(false);
    } catch (e) { console.error(e); }
  }, [data]);

  const openNewRun = (type = "regular") => {
    setNewRunType(type);
    setShowNewRun(true);
  };

  // Derived
  const regularRuns = useMemoPayroll(() => runs.filter(r => r.runType !== "off_cycle"), [runs]);

  const deptBreakdown = useMemoPayroll(() => {
    if (!run?.lines) return [];
    const map = {};
    run.lines.forEach(l => {
      if (!map[l.dept]) map[l.dept] = { dept: l.dept, net: 0, count: 0 };
      map[l.dept].net   += l.net;
      map[l.dept].count += 1;
    });
    return Object.values(map).sort((a, b) => b.net - a.net);
  }, [run?.lines]);

  const maxDeptNet  = useMemoPayroll(() => Math.max(...deptBreakdown.map(d => d.net), 1), [deptBreakdown]);
  const uniqueDepts = useMemoPayroll(() => [...new Set((run?.lines || []).map(l => l.dept))].sort(), [run?.lines]);

  const filtered = useMemoPayroll(() => {
    if (!run?.lines) return [];
    return run.lines.filter(l => {
      const q = (l.emp + l.dept + l.empId).toLowerCase();
      return (search === "" || q.includes(search.toLowerCase()))
          && (statusFilter === "all" || l.status === statusFilter)
          && (deptFilter   === "all" || l.dept  === deptFilter);
    });
  }, [run?.lines, search, statusFilter, deptFilter]);

  const maxNet = useMemoPayroll(() => Math.max(...(run?.lines || [{ net: 1 }]).map(l => l.net), 1), [run?.lines]);

  const totals = useMemoPayroll(() => filtered.reduce(
    (acc, l) => ({
      base:   acc.base  + l.base,
      allow:  acc.allow + l.allowances,
      extras: acc.extras + (l.overtime || 0) + (l.bonus || 0),
      ded:    acc.ded   + l.deductions,
      net:    acc.net   + l.net,
    }),
    { base: 0, allow: 0, extras: 0, ded: 0, net: 0 }
  ), [filtered]);

  // Reset page when filters change
  useEffectPy(() => { setPyPage(1); }, [search, statusFilter, deptFilter, run?.runId, pyPageSize]);

  const pyTotalPages = Math.max(1, Math.ceil(filtered.length / pyPageSize));
  const pySafePage   = Math.min(pyPage, pyTotalPages);
  const pyStart      = (pySafePage - 1) * pyPageSize;
  const pageLines    = filtered.slice(pyStart, pyStart + pyPageSize);

  const pyGoTo = p => setPyPage(Math.max(1, Math.min(p, pyTotalPages)));

  const pyPageButtons = useMemoPayroll(() => {
    if (pyTotalPages <= 7) return Array.from({ length: pyTotalPages }, (_, i) => i + 1);
    const delta = 2;
    const left  = Math.max(2, pySafePage - delta);
    const right = Math.min(pyTotalPages - 1, pySafePage + delta);
    const range = [1];
    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < pyTotalPages - 1) range.push("...");
    range.push(pyTotalPages);
    return range;
  }, [pyTotalPages, pySafePage]);

  const pyNavBtn = (disabled) => ({
    width: 30, height: 30, borderRadius: 7,
    border: "1px solid var(--border-subtle)",
    background: "var(--bg-surface)",
    cursor: disabled ? "default" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    opacity: disabled ? 0.4 : 1,
  });

  const STATUS_MAP = {
    ready:   { label: "Ready",   color: "var(--success-700)" },
    review:  { label: "Review",  color: "var(--warning-700)" },
    blocked: { label: "Blocked", color: "var(--danger-700)"  },
    paid:    { label: "Paid",    color: "var(--fg-3)"        },
  };

  const WAGE_BASIS_LABEL = { monthly: "Monthly", daily: "Daily rate", hourly: "Hourly rate" };

  if (loadingRuns) return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
      <div style={{ width: 32, height: 32, border: "3px solid var(--plum-100)", borderTopColor: "var(--brand-burgundy)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  const employees = data?.employees || [];

  return (
    <div className="page">

      {showNewRun && (
        <NewRunModal
          employees={employees}
          onSave={handleCreateRun}
          onClose={() => setShowNewRun(false)}
          defaultRunType={newRunType}
        />
      )}

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "1.5px solid var(--ink-150)", paddingBottom: 0 }}>
        {[
          { id: "runs",       label: "Payroll Runs",     icon: "wallet"      },
          { id: "settlement", label: "Final Settlement",  icon: "handshake"   },
          { id: "offcycle",   label: "Off-cycle",         icon: "rotate-cw"   },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", fontSize: 13, fontWeight: 600,
              background: "none", border: "none", cursor: "pointer",
              borderBottom: activeTab === tab.id ? "2.5px solid var(--brand-burgundy)" : "2.5px solid transparent",
              color: activeTab === tab.id ? "var(--brand-burgundy)" : "var(--fg-3)",
              marginBottom: "-1.5px",
            }}
          >
            <Icon name={tab.icon} size={14} color={activeTab === tab.id ? "var(--brand-burgundy)" : "var(--fg-4)"} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Final Settlement tab ── */}
      {activeTab === "settlement" && <FinalSettlementPanel employees={employees} />}

      {/* ── Off-cycle tab ── */}
      {activeTab === "offcycle" && <OffCyclePanel runs={runs} onCreateRun={() => openNewRun("off_cycle")} />}

      {/* ── Regular runs tab ── */}
      {activeTab === "runs" && (() => {
        if (runs.length === 0 && !run) return (
          <div>
            <div className="page-head">
              <div>
                <div className="eyebrow">Money · Payroll</div>
                <h1 className="page-title">No payroll runs</h1>
                <div className="page-sub">Create the first payroll run for this organisation.</div>
              </div>
              <Button variant="primary" icon="plus" onClick={() => openNewRun("regular")}>New Payroll Run</Button>
            </div>
          </div>
        );

        const isApproved = run?.status === "approved" || run?.status === "paid";
        if (!run) return null;

        return (
          <div>
            {/* ── Page header ── */}
            <div className="page-head">
              <div>
                <div className="eyebrow">Money · Payroll</div>
                <h1 className="page-title">{run.period} payroll run</h1>
                <div className="page-sub">
                  {run.headcount} employees · gross {fmt(run.gross)} · {currLabel}
                  {run.currency && run.currency !== "AED" && ` (AED ${(run.gross || 0).toLocaleString()})`}
                  {run.wageBasis && run.wageBasis !== "monthly" && ` · ${WAGE_BASIS_LABEL[run.wageBasis]}`}
                  {" · salaries on " + run.runDate}
                </div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <Button variant="secondary" icon="plus" onClick={() => openNewRun("regular")}>New Run</Button>
                <Button variant="secondary" icon="rotate-cw">Recalculate</Button>
                <Button variant="secondary" icon="download">Export WPS</Button>
                {isApproved
                  ? <Button variant="secondary" icon="check-circle-2" disabled>CFO approved</Button>
                  : <Button variant="primary" icon="check" onClick={handleApprove} disabled={saving}>
                      {saving ? "Submitting…" : "Submit for CFO approval"}
                    </Button>
                }
              </div>
            </div>

            {/* ── Currency badge ── */}
            {run.currency && run.currency !== "AED" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "8px 14px", borderRadius: 8, background: "var(--plum-50)", fontSize: 12.5, color: "var(--brand-burgundy)", fontWeight: 500 }}>
                <Icon name="currency" size={14} />
                Amounts displayed in <strong>{run.currency}</strong> · Exchange rate: 1 {run.currency} = AED {currConfig.rate}
              </div>
            )}

            {/* ── Run selector ── */}
            {regularRuns.length > 1 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
                {regularRuns.map(r => (
                  <button key={r.runId}
                    onClick={() => handleSelectRun(r)}
                    style={{
                      padding: "5px 14px", borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                      border: "1.5px solid",
                      borderColor: r.runId === run.runId ? "var(--brand-burgundy)" : "var(--ink-200)",
                      background:  r.runId === run.runId ? "var(--plum-50)" : "transparent",
                      color:       r.runId === run.runId ? "var(--brand-burgundy)" : "var(--fg-3)",
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    {r.period}
                    <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.75 }}>{r.status}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ── Status banner ── */}
            {isApproved ? (
              <div className="payroll-banner payroll-banner--success">
                <Icon name="check-circle-2" size={16} />
                <span><strong>Payroll approved</strong> by CFO · WPS bank file and salary transfer are next</span>
              </div>
            ) : (
              <div className="payroll-banner payroll-banner--warn">
                <Icon name="clock-alert" size={16} />
                <span><strong>CFO approval pending</strong> · due 26 May 2026</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <Button variant="ghost" size="sm">View checklist</Button>
                  <Button variant="primary" size="sm" icon="check" onClick={handleApprove} disabled={saving}>
                    {saving ? "Submitting…" : "Approve now"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── KPI row ── */}
            <div className="grid-4" style={{ marginBottom: 22 }}>
              <KPI label="Gross payroll"    value={currLabel + " " + fmtK(run.gross)}      icon="wallet"       delta="+2.1% vs Apr" />
              <KPI label="Net to employees" value={currLabel + " " + fmtK(run.netPay)}     icon="banknote" />
              <KPI label="Total deductions" value={currLabel + " " + fmtK(run.deductions)} icon="minus-circle"
                delta={run.gross ? Math.round((run.deductions / run.gross) * 100) + "% of gross" : ""} />
              <KPI label="Bonuses & OT"     value={currLabel + " " + fmtK(run.bonuses)}    icon="trophy"       delta="+18% vs Apr" />
            </div>

            {/* ── Progress + Flags ── */}
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, marginBottom: 20 }}>
              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title-lg">Run progress</div>
                    <div className="card-sub">
                      Step {run.stages.filter(s => s.done).length} of {run.stages.length} · click a step to toggle
                    </div>
                  </div>
                  <Chip kind={isApproved ? "success" : "warning"}>
                    {isApproved ? "Approved" : "In review"}
                  </Chip>
                </div>
                <div className="card-pad" style={{ paddingTop: 12 }}>
                  <PayrollStepper stages={run.stages} onToggle={handleStageToggle} />
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title-lg">Needs review</div>
                    <div className="card-sub">Flags raised by the payroll engine</div>
                  </div>
                  <Chip kind={(run.flags || []).some(f => f.kind === "danger") ? "danger" : "warning"}>
                    {(run.flags || []).length} flag{(run.flags || []).length !== 1 ? "s" : ""}
                  </Chip>
                </div>
                <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
                  {(run.flags || []).map((f, i) => (
                    <div key={i} className="list-item">
                      <div className={"icon-wrap " + (f.kind === "danger" ? "dang" : f.kind === "warning" ? "warn" : "info")}>
                        <Icon name={f.kind === "danger" ? "alert-octagon" : f.kind === "warning" ? "alert-triangle" : "info"} size={14} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="ttl">{f.text}</div>
                        <div className="sub">{f.dept}</div>
                      </div>
                      <Button variant="ghost" size="sm" iconRight="arrow-right">Review</Button>
                    </div>
                  ))}
                  {(run.flags || []).length === 0 && (
                    <div style={{ padding: "18px 0", textAlign: "center", color: "var(--fg-4)", fontSize: 12.5 }}>
                      <Icon name="check-circle" size={20} color="var(--success-600)" />
                      <div style={{ marginTop: 6 }}>No flags — payroll is clean</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Dept breakdown ── */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-head">
                <div>
                  <div className="card-title-lg">Payroll by department</div>
                  <div className="card-sub">Net pay across {deptBreakdown.length} departments this cycle</div>
                </div>
                <span className="cell-mono muted" style={{ fontSize: 12 }}>Total: {fmt(run.netPay)}</span>
              </div>
              <div className="card-pad">
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  {deptBreakdown.map(d => (
                    <div key={d.dept} style={{ display: "grid", gridTemplateColumns: "148px 1fr 120px 50px", alignItems: "center", gap: 14 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--fg-1)" }}>{d.dept}</span>
                      <div style={{ height: 7, background: "var(--ink-100)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: (d.net / maxDeptNet * 100) + "%", height: "100%", background: "var(--brand-burgundy)", borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-mono)", textAlign: "right" }}>
                        {fmt(d.net)}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--fg-3)", textAlign: "right" }}>{d.count} emp</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Payroll lines table ── */}
            <div className="card">
              <div className="tbl-toolbar">
                <div className="search" style={{ flex: 1, maxWidth: 280 }}>
                  <Icon name="search" size={14} color="var(--fg-3)" />
                  <input placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                <div className="segmented">
                  {["all", "ready", "review", "blocked"].map(s => (
                    <button key={s} className={statusFilter === s ? "active" : ""} onClick={() => setStatusFilter(s)}>
                      {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
                      <span className="text-mono muted" style={{ marginLeft: 4 }}>
                        {s === "all" ? run.lines.length : run.lines.filter(l => l.status === s).length}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="grow" />

                <select className="fi"
                  style={{ width: 168, fontSize: 12.5, padding: "5px 28px 5px 10px", height: 32 }}
                  value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                >
                  <option value="all">All departments</option>
                  {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <Button variant="ghost" size="sm" icon="download">Export</Button>
              </div>

              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}><input type="checkbox" /></th>
                    <th>Employee</th>
                    <th>Department</th>
                    {run.wageBasis && run.wageBasis !== "monthly"
                      ? <th style={{ textAlign: "right" }}>Rate</th>
                      : <th style={{ textAlign: "right" }}>Base</th>
                    }
                    <th style={{ textAlign: "right" }}>Allowances</th>
                    <th style={{ textAlign: "right" }}>Extras (OT / Bonus)</th>
                    <th style={{ textAlign: "right" }}>Deductions</th>
                    <th style={{ textAlign: "right", minWidth: 150 }}>Net pay ({currLabel})</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pageLines.map(l => {
                    const extras    = (l.overtime || 0) + (l.bonus || 0);
                    const isEditing = editingLine === l.empId;
                    const showRate  = l.wageBasis === "daily" || l.wageBasis === "hourly";
                    const rateLabel = l.wageBasis === "daily"
                      ? `${(l.dailyRate || 0).toLocaleString()}/day × ${l.daysWorked || 22}d`
                      : l.wageBasis === "hourly"
                        ? `${(l.hourlyRate || 0).toFixed(2)}/hr × ${l.hoursWorked || 176}h`
                        : null;
                    return (
                      <tr key={l.empId}
                        className={l.status === "blocked" ? "row-status danger" : l.status === "review" ? "row-status warning" : ""}
                      >
                        <td onClick={ev => ev.stopPropagation()}><input type="checkbox" /></td>
                        <td><AvatarRow name={l.emp} sub={l.empId} color={{ bg: "var(--plum-50)", fg: "var(--brand-burgundy)" }} /></td>
                        <td><Chip kind="default" dot={false}>{l.dept}</Chip></td>

                        {/* Base / rate cell */}
                        <td className="cell-mono" style={{ textAlign: "right" }}>
                          {showRate && rateLabel
                            ? <span title={`Base: AED ${l.base.toLocaleString()}`} style={{ cursor: "help" }}>
                                <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{rateLabel}</span>
                              </span>
                            : l.base.toLocaleString()
                          }
                        </td>

                        <td className="cell-mono cell-muted" style={{ textAlign: "right" }}>
                          {l.allowances ? l.allowances.toLocaleString() : "—"}
                        </td>

                        {/* Editable extras cell */}
                        <td style={{ textAlign: "right" }}>
                          {isEditing ? (
                            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", alignItems: "center" }}>
                              {showRate && (
                                <input type="number" placeholder={l.wageBasis === "daily" ? "Days" : "Hours"}
                                  value={l.wageBasis === "daily" ? editVals.daysWorked : editVals.hoursWorked}
                                  onChange={e => setEditVals(v => ({
                                    ...v,
                                    [l.wageBasis === "daily" ? "daysWorked" : "hoursWorked"]: e.target.value,
                                  }))}
                                  style={{ width: 52, fontSize: 11, padding: "3px 6px", border: "1.5px solid var(--ink-200)", borderRadius: 5, textAlign: "right" }}
                                />
                              )}
                              <input type="number" placeholder="OT"
                                value={editVals.overtime}
                                onChange={e => setEditVals(v => ({ ...v, overtime: e.target.value }))}
                                style={{ width: 64, fontSize: 11, padding: "3px 6px", border: "1.5px solid var(--ink-200)", borderRadius: 5, textAlign: "right" }}
                              />
                              <input type="number" placeholder="Bonus"
                                value={editVals.bonus}
                                onChange={e => setEditVals(v => ({ ...v, bonus: e.target.value }))}
                                style={{ width: 64, fontSize: 11, padding: "3px 6px", border: "1.5px solid var(--ink-200)", borderRadius: 5, textAlign: "right" }}
                              />
                              <button onClick={handleLineSave}
                                style={{ padding: "3px 8px", fontSize: 11, background: "var(--brand-burgundy)", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}>✓</button>
                              <button onClick={cancelEdit}
                                style={{ padding: "3px 7px", fontSize: 11, background: "var(--ink-100)", border: "none", borderRadius: 5, cursor: "pointer" }}>✕</button>
                            </div>
                          ) : (
                            <span className="cell-mono"
                              onClick={() => startEdit(l)}
                              title="Click to edit OT / bonus"
                              style={{ color: extras ? "var(--success-700)" : "var(--fg-4)", fontWeight: extras ? 600 : 400, cursor: "pointer" }}
                            >
                              {extras ? "+" + extras.toLocaleString() : "—"}
                            </span>
                          )}
                        </td>

                        <td className="cell-mono" style={{ textAlign: "right", color: "var(--danger-700)" }}>
                          −{l.deductions.toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right", minWidth: 150 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
                            <div style={{ width: 56, height: 5, background: "var(--ink-100)", borderRadius: 999, overflow: "hidden", flexShrink: 0 }}>
                              <div style={{ width: (l.net / maxNet * 100) + "%", height: "100%", background: "var(--brand-burgundy)", borderRadius: 999 }} />
                            </div>
                            <span className="cell-mono cell-strong">{Math.round(l.net / currConfig.rate).toLocaleString()}</span>
                          </div>
                        </td>

                        <td>
                          <select value={l.status}
                            onChange={e => handleLineStatus(l.empId, e.target.value)}
                            style={{
                              fontSize: 11.5, padding: "3px 24px 3px 8px",
                              border: "1.5px solid var(--ink-200)", borderRadius: 6,
                              background: "var(--canvas)", cursor: "pointer",
                              color: STATUS_MAP[l.status]?.color || "var(--fg-2)",
                              fontWeight: 600,
                            }}
                          >
                            <option value="ready">Ready</option>
                            <option value="review">Review</option>
                            <option value="blocked">Blocked</option>
                            <option value="paid">Paid</option>
                          </select>
                        </td>

                        <td>
                          <button className="icon-btn" style={{ width: 28, height: 28 }}
                            onClick={() => startEdit(l)} title="Edit OT / bonus">
                            <Icon name="pencil" size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr className="payroll-totals-row">
                    <td colSpan={3} style={{ padding: "11px 16px" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-2)" }}>
                        Totals · {filtered.length} of {run.lines.length} employees
                      </span>
                    </td>
                    <td className="cell-mono cell-strong" style={{ textAlign: "right", padding: "11px 16px" }}>
                      {totals.base.toLocaleString()}
                    </td>
                    <td className="cell-mono cell-muted" style={{ textAlign: "right", padding: "11px 16px" }}>
                      {totals.allow ? totals.allow.toLocaleString() : "—"}
                    </td>
                    <td className="cell-mono" style={{ textAlign: "right", padding: "11px 16px", color: "var(--success-700)", fontWeight: 600 }}>
                      {totals.extras ? "+" + totals.extras.toLocaleString() : "—"}
                    </td>
                    <td className="cell-mono" style={{ textAlign: "right", padding: "11px 16px", color: "var(--danger-700)", fontWeight: 600 }}>
                      −{totals.ded.toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right", padding: "11px 16px" }}>
                      <span className="cell-mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-burgundy)" }}>
                        {Math.round(totals.net / currConfig.rate).toLocaleString()}
                      </span>
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>

              <div className="tbl-foot" style={{ flexWrap: "wrap", gap: 10 }}>
                {/* Left: record info + rows per page */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "var(--fg-3)" }}>
                    {pyStart + 1}–{Math.min(pyStart + pyPageSize, filtered.length)} of {filtered.length} employees
                    {filtered.length < run.lines.length && <span style={{ color: "var(--fg-4)" }}> (filtered)</span>}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: "var(--fg-4)" }}>Rows:</span>
                    <select value={pyPageSize} onChange={e => setPyPageSize(Number(e.target.value))}
                      style={{ fontSize: 12, padding: "3px 6px", borderRadius: 6, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", color: "var(--fg-1)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                      {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <span className="cell-muted" style={{ fontSize: 11, borderLeft: "1px solid var(--border-subtle)", paddingLeft: 12 }}>
                    {currLabel}{run.wageBasis && run.wageBasis !== "monthly" ? ` · ${WAGE_BASIS_LABEL[run.wageBasis]}` : ""} · click extras to edit
                  </span>
                </div>

                {/* Right: page navigation */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button onClick={() => pyGoTo(1)} disabled={pySafePage === 1} style={pyNavBtn(pySafePage === 1)}>
                    <Icon name="chevrons-left" size={13} color="var(--fg-2)" />
                  </button>
                  <button onClick={() => pyGoTo(pySafePage - 1)} disabled={pySafePage === 1} style={pyNavBtn(pySafePage === 1)}>
                    <Icon name="chevron-left" size={13} color="var(--fg-2)" />
                  </button>

                  {pyPageButtons.map((btn, i) =>
                    btn === "..." ? (
                      <span key={"e" + i} style={{ width: 30, textAlign: "center", fontSize: 12, color: "var(--fg-4)" }}>…</span>
                    ) : (
                      <button key={btn} onClick={() => pyGoTo(btn)} style={{
                        width: 30, height: 30, borderRadius: 7,
                        border: `1px solid ${btn === pySafePage ? "var(--brand-burgundy)" : "var(--border-subtle)"}`,
                        background: btn === pySafePage ? "var(--brand-burgundy)" : "var(--bg-surface)",
                        color: btn === pySafePage ? "#fff" : "var(--fg-2)",
                        fontSize: 12.5, fontWeight: btn === pySafePage ? 700 : 400,
                        cursor: "pointer", fontFamily: "var(--font-sans)",
                      }}>{btn}</button>
                    )
                  )}

                  <button onClick={() => pyGoTo(pySafePage + 1)} disabled={pySafePage === pyTotalPages} style={pyNavBtn(pySafePage === pyTotalPages)}>
                    <Icon name="chevron-right" size={13} color="var(--fg-2)" />
                  </button>
                  <button onClick={() => pyGoTo(pyTotalPages)} disabled={pySafePage === pyTotalPages} style={pyNavBtn(pySafePage === pyTotalPages)}>
                    <Icon name="chevrons-right" size={13} color="var(--fg-2)" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

Object.assign(window, { PayrollPage });
