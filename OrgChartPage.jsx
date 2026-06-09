/* global React, Icon, Avatar, Card, Chip, Button, IconButton */
const { useState: useStateOC, useMemo: useMemoOC } = React;

const DEPT_COLORS = {
  "Operations": "#2563B0", "Finance": "#1F8A52", "Technology": "#6F1947",
  "HR": "#D78A14", "Sales": "#534AB7", "Logistics": "#B61B54",
  "Admin": "#A89DA3", "Legal": "#C0263A", "Marketing": "#2E7D54",
};

function deptColor(dept) {
  for (const key of Object.keys(DEPT_COLORS)) {
    if (dept && dept.toLowerCase().includes(key.toLowerCase())) return DEPT_COLORS[key];
  }
  return "#6F1947";
}

function OrgChartPage({ data }) {
  const { employees = [], departments = [] } = data || {};
  const [selectedDept, setSelectedDept] = useStateOC(null);
  const [view, setView] = useStateOC("dept"); // dept | tree

  const deptMap = useMemoOC(() => {
    const map = {};
    departments.forEach(d => { map[d.deptId || d.id] = d; });
    return map;
  }, [departments]);

  const byDept = useMemoOC(() => {
    const map = {};
    employees.forEach(e => {
      const key = e.dept || "Unassigned";
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [employees]);

  const deptList = useMemoOC(() => {
    return Object.entries(byDept).map(([dept, emps]) => {
      const head = emps.find(e => e.role && (e.role.toLowerCase().includes("head") || e.role.toLowerCase().includes("manager") || e.role.toLowerCase().includes("director") || e.role.toLowerCase().includes("ceo") || e.role.toLowerCase().includes("cfo") || e.role.toLowerCase().includes("cto")));
      return { dept, emps, head: head || emps[0], count: emps.length };
    }).sort((a, b) => b.count - a.count);
  }, [byDept]);

  const leadership = useMemoOC(() => {
    return employees.filter(e => e.role && (e.role.toLowerCase().includes("ceo") || e.role.toLowerCase().includes("cto") || e.role.toLowerCase().includes("cfo") || e.role.toLowerCase().includes("vp") || e.role.toLowerCase().includes("director") || e.grade === "L6" || e.grade === "L7")).slice(0, 6);
  }, [employees]);

  const selDeptEmps = useMemoOC(() => {
    if (!selectedDept) return [];
    return byDept[selectedDept] || [];
  }, [selectedDept, byDept]);

  const GRADES = ["L1","L2","L3","L4","L5","L6","L7"];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">People & Culture</div>
          <h1 className="page-title">Org Chart</h1>
          <div className="page-sub">{employees.length} people across {deptList.length} departments</div>
        </div>
        <div className="row">
          <div className="seg-ctrl">
            {["dept","tree"].map(v => (
              <button key={v} className={"seg-btn" + (view === v ? " active" : "")} onClick={() => setView(v)}>
                <Icon name={v === "dept" ? "layout-grid" : "git-branch"} size={14} />
                {v === "dept" ? "Departments" : "Hierarchy"}
              </button>
            ))}
          </div>
          <Button variant="primary" icon="download">Export</Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: "Total Headcount", value: employees.length, icon: "users", color: "#2563B0" },
          { label: "Departments", value: deptList.length, icon: "building-2", color: "#1F8A52" },
          { label: "Avg Team Size", value: (employees.length / Math.max(deptList.length,1)).toFixed(1), icon: "users-round", color: "#6F1947" },
          { label: "Open Positions", value: (data.openings || []).length, icon: "briefcase", color: "#D78A14" },
        ].map(k => (
          <div key={k.label} className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px" }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: k.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={k.icon} size={20} color={k.color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--fg-1)" }}>{k.value}</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 1 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {view === "dept" ? (
        <>
          {/* Leadership strip */}
          {leadership.length > 0 && (
            <div className="card" style={{ marginBottom: 24, padding: "18px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 16 }}>Leadership</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {leadership.map(e => (
                  <div key={e.empId} className="org-leader-card">
                    <Avatar name={e.name} color={e.avatar} size={40} />
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)", lineHeight: 1.2 }}>{e.name}</div>
                      <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2 }}>{e.role}</div>
                      <div style={{ fontSize: 10.5, color: "var(--brand-burgundy)", marginTop: 3, fontWeight: 600 }}>{e.dept}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Department grid */}
          <div className="grid-3" style={{ alignItems: "start" }}>
            {deptList.map(({ dept, emps, head, count }) => {
              const color = deptColor(dept);
              const isSel = selectedDept === dept;
              return (
                <div key={dept} className={"card org-dept-card" + (isSel ? " org-dept-card--active" : "")}
                  style={{ borderTop: `3px solid ${color}`, cursor: "pointer", padding: "16px 18px" }}
                  onClick={() => setSelectedDept(isSel ? null : dept)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="building-2" size={17} color={color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--fg-1)" }}>{dept}</div>
                      <div style={{ fontSize: 11.5, color: "var(--fg-3)" }}>{count} {count === 1 ? "member" : "members"}</div>
                    </div>
                    <Icon name={isSel ? "chevron-up" : "chevron-down"} size={15} color="var(--fg-3)" />
                  </div>
                  {head && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--ink-50)", borderRadius: 8 }}>
                      <Avatar name={head.name} color={head.avatar} size={26} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-1)" }}>{head.name}</div>
                        <div style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{head.role}</div>
                      </div>
                    </div>
                  )}
                  {/* Grade distribution bar */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", gap: 2, height: 4, borderRadius: 4, overflow: "hidden" }}>
                      {GRADES.map(g => {
                        const cnt = emps.filter(e => e.grade === g).length;
                        if (!cnt) return null;
                        return <div key={g} style={{ flex: cnt, background: color, opacity: 0.3 + (GRADES.indexOf(g) * 0.1) }} />;
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      {GRADES.map(g => {
                        const cnt = emps.filter(e => e.grade === g).length;
                        if (!cnt) return null;
                        return (
                          <div key={g} style={{ fontSize: 10, color: "var(--fg-3)" }}>
                            <span style={{ fontWeight: 700, color: color }}>{cnt}</span> {g}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expanded member list */}
                  {isSel && (
                    <div style={{ marginTop: 14, borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {emps.map(e => (
                          <div key={e.empId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                            <Avatar name={e.name} color={e.avatar} size={24} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</div>
                              <div style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{e.role}</div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: color + "18", color: color }}>{e.grade}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Hierarchy / Tree view */
        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 20 }}>Organisation Hierarchy</div>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 700 }}>
              {deptList.map(({ dept, emps, head, count }) => {
                const color = deptColor(dept);
                const mgrs = emps.filter(e => e.role && (e.role.toLowerCase().includes("manager") || e.role.toLowerCase().includes("lead") || e.role.toLowerCase().includes("head")));
                const ics  = emps.filter(e => !mgrs.includes(e));
                return (
                  <div key={dept} style={{ marginBottom: 20, borderLeft: `3px solid ${color}`, paddingLeft: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg-1)" }}>{dept}</div>
                      <span style={{ fontSize: 11, color: "var(--fg-3)" }}>— {count} people</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingLeft: 18 }}>
                      {emps.slice(0, 12).map(e => (
                        <div key={e.empId} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", background: "var(--ink-50)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                          <Avatar name={e.name} color={e.avatar} size={20} />
                          <div>
                            <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--fg-1)", whiteSpace: "nowrap" }}>{e.name}</div>
                            <div style={{ fontSize: 10, color: "var(--fg-3)" }}>{e.role}</div>
                          </div>
                        </div>
                      ))}
                      {emps.length > 12 && (
                        <div style={{ display: "flex", alignItems: "center", padding: "4px 10px", background: "var(--ink-100)", borderRadius: 8, fontSize: 11.5, color: "var(--fg-3)", fontWeight: 600 }}>
                          +{emps.length - 12} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { OrgChartPage });
