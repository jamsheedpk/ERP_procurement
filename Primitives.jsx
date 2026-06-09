/* global React */
window.API = "http://localhost:5000/api";

/* Lucide icon renderer */
function Icon({ name, size = 18, stroke = 1.75, className = "", color }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (window.lucide && ref.current) {
      ref.current.innerHTML = "";
      const i = document.createElement("i");
      i.setAttribute("data-lucide", name);
      i.style.width = size + "px";
      i.style.height = size + "px";
      if (color) i.style.color = color;
      ref.current.appendChild(i);
      window.lucide.createIcons({ attrs: { "stroke-width": stroke, width: size, height: size } });
    }
  }, [name, size, stroke, color]);
  return <span ref={ref} className={"icon " + className} style={{ display: "inline-flex", width: size, height: size, color }} />;
}

function Avatar({ name, color, size = "md" }) {
  const cls = "av " + (size === "sm" ? "av-sm" : size === "lg" ? "av-lg" : size === "xl" ? "av-xl" : "");
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return <div className={cls} style={color ? { background: color.bg, color: color.fg } : null}>{initials}</div>;
}

function AvatarRow({ name, sub, color, size = "md", muted, right }) {
  return (
    <div className="av-row">
      <Avatar name={name} color={color} size={size} />
      <div style={{ minWidth: 0 }}>
        <div className="nm">{name}</div>
        {sub ? <div className="sub">{sub}</div> : null}
      </div>
      {right ? <div style={{ marginLeft: "auto" }}>{right}</div> : null}
    </div>
  );
}

function Chip({ kind = "default", children, dot = true, icon }) {
  const cls = "chip " + (kind !== "default" ? "chip-" + kind : "");
  return (
    <span className={cls}>
      {icon ? <Icon name={icon} size={12} stroke={2} /> :
        (dot && kind !== "default" ? <span className="dot" /> : null)}
      {children}
    </span>
  );
}

function Button({ variant = "primary", size, icon, iconRight, children, onClick, type = "button", style, title, disabled }) {
  const cls = ["btn", "btn-" + variant, size === "sm" ? "btn-sm" : "", size === "lg" ? "btn-lg" : "", disabled ? "btn-disabled" : ""].filter(Boolean).join(" ");
  return (
    <button className={cls} onClick={disabled ? undefined : onClick} type={type} style={style} title={title} disabled={disabled}>
      {icon ? <Icon name={icon} size={size === "sm" ? 13 : 14} stroke={2} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={size === "sm" ? 13 : 14} stroke={2} /> : null}
    </button>
  );
}

function IconButton({ icon, title, onClick, badge }) {
  return (
    <button className="icon-btn" title={title} onClick={onClick}>
      <Icon name={icon} size={18} />
      {badge ? <span className="badge-dot" /> : null}
    </button>
  );
}

function KPI({ label, value, unit, delta, deltaDir = "up", icon }) {
  return (
    <div className="kpi">
      <div className="lbl">{label}</div>
      <div className="val">{value}{unit ? <span className="unit">{unit}</span> : null}</div>
      {delta ? <div className={"delta " + (deltaDir === "down" ? "down" : "")}>
        <Icon name={deltaDir === "down" ? "trending-down" : "trending-up"} size={12} stroke={2.2} />
        <span>{delta}</span>
      </div> : null}
      {icon ? <div className="ico"><Icon name={icon} size={16} stroke={2} /></div> : null}
    </div>
  );
}

function Meter({ value, max = 100, kind }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const cls = "meter " + (kind ? "meter-" + kind : "");
  return <div className={cls}><span style={{ width: pct + "%" }} /></div>;
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented">
      {options.map(o => (
        <button key={o.value} className={value === o.value ? "active" : ""} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <div key={t.id} className={"tab " + (active === t.id ? "active" : "")} onClick={() => onChange(t.id)}>
          {t.label}{typeof t.count !== "undefined" ? <span className="count">{t.count}</span> : null}
        </div>
      ))}
    </div>
  );
}

/* Tiny donut/ring chart in SVG */
function Donut({ size = 160, stroke = 18, segments, label, value }) {
  const r = size / 2 - stroke / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  return (
    <div className="ring" style={{ maxWidth: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--ink-100)" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const offset = c - acc;
          acc += len;
          return (
            <circle key={i}
              cx={size/2} cy={size/2} r={r}
              fill="none" stroke={s.color} strokeWidth={stroke}
              strokeDasharray={`${len} ${c}`}
              strokeDashoffset={offset - c}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      <div className="center">
        <div className="v">{value}</div>
        <div className="l">{label}</div>
      </div>
    </div>
  );
}

/* Sparkline area chart (SVG) */
function Spark({ points, color = "var(--brand-burgundy)", height = 60, fill }) {
  if (!points || !points.length) return null;
  const max = Math.max(...points), min = Math.min(...points);
  const range = Math.max(1, max - min);
  const w = 100;
  const step = w / (points.length - 1);
  const path = points.map((p, i) => `${i ? "L" : "M"}${(i*step).toFixed(2)} ${(height - 4 - ((p - min) / range) * (height - 8)).toFixed(2)}`).join(" ");
  const area = path + ` L${w} ${height} L0 ${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
      {fill !== false ? <path d={area} fill={color} opacity="0.1" /> : null}
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

/* Stacked bar chart — explicit pixel heights for predictable rendering */
function BarsChart({ data, height = 160 }) {
  const labelH = 22;
  const padTop = 6;
  const chartH = height - labelH - padTop;
  const max = Math.max(...data.map(d => d.segments.reduce((s,x)=>s+x.value,0))) || 1;
  return (
    <div className="bars-v2" style={{ height }}>
      {data.map((d, i) => {
        const total = d.segments.reduce((s,x)=>s+x.value, 0);
        const colHeight = Math.round((total / max) * chartH);
        return (
          <div key={i} className="bar-col-v2">
            <div className="bar-track" style={{ height: chartH }}>
              <div className="bar-fill" style={{ height: colHeight }}>
                {[...d.segments].reverse().map((s, j) => {
                  const segH = total > 0 ? Math.round((s.value / total) * colHeight) : 0;
                  return (
                    <div key={j} className="bar-seg" style={{ height: segH, background: s.color }} title={`${s.key}: ${s.value}`} />
                  );
                })}
              </div>
            </div>
            <div className="bar-lbl">{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── PartyAutocomplete ──────────────────────────────────────────────────────────
// Shared across Cash Book, Day Book, etc.
// Fetches active parties once per page load (cached in window._partyCacheData).
const _PARTY_TYPE_META = {
  vendor:     { label: "Vendor",      icon: "truck",           color: "#C0263A" },
  client:     { label: "Client",      icon: "briefcase",       color: "#2563B0" },
  employee:   { label: "Employee",    icon: "user",            color: "#6F1947" },
  bank:       { label: "Bank",        icon: "landmark",        color: "#1F8A52" },
  government: { label: "Government",  icon: "building-2",      color: "#534AB7" },
  other:      { label: "Other",       icon: "more-horizontal", color: "#A89DA3" },
};

function PartyAutocomplete({ value, onChange, placeholder }) {
  const [query,   setQuery]   = React.useState(value || "");
  const [parties, setParties] = React.useState(window._partyCacheData || []);
  const [open,    setOpen]    = React.useState(false);
  const wrapRef = React.useRef(null);

  // Fetch once and cache
  React.useEffect(() => {
    if (window._partyCacheData) { setParties(window._partyCacheData); return; }
    fetch(window.API + "/parties?status=active")
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        window._partyCacheData = list;
        setParties(list);
      })
      .catch(() => {});
  }, []);

  // Sync when parent resets the value (e.g. form cleared)
  React.useEffect(() => { setQuery(value || ""); }, [value]);

  // Close dropdown on click outside
  React.useEffect(() => {
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? parties.filter(p =>
          p.name.toLowerCase().includes(q) ||
          (p.contactPerson || "").toLowerCase().includes(q) ||
          (p.taxNumber || "").toLowerCase().includes(q))
      : parties.slice(0, 10);
    return list.slice(0, 10);
  }, [query, parties]);

  function select(party) {
    setQuery(party.name);
    onChange(party.name);
    setOpen(false);
  }

  function handleInput(e) {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <Icon name="contact-round" size={14} color="var(--fg-4)" />
        </span>
        <input
          className="form-input"
          style={{ paddingLeft: 32 }}
          placeholder={placeholder || "Search party / project or type a name…"}
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {query && (
          <button
            onMouseDown={e => { e.preventDefault(); setQuery(""); onChange(""); }}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", padding: 2,
              display: "flex", alignItems: "center", color: "var(--fg-4)" }}>
            <Icon name="x" size={13} color="var(--fg-3)" />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 300,
          background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
          borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.13)",
          maxHeight: 230, overflowY: "auto",
        }}>
          {filtered.map((party, i) => {
            const pt = _PARTY_TYPE_META[party.type] || _PARTY_TYPE_META.other;
            return (
              <div key={party.partyId}
                onMouseDown={() => select(party)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", cursor: "pointer",
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--border-subtle)" : "none",
                  background: "transparent",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--ink-50)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: pt.color + "18",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={pt.icon} size={14} color={pt.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {party.name}
                  </div>
                  {party.contactPerson && (
                    <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{party.contactPerson}</div>
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                  background: pt.color + "15", color: pt.color, flexShrink: 0,
                  whiteSpace: "nowrap" }}>{pt.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── ProjectSelect ──────────────────────────────────────────────────────────────
// Shows projects belonging to the selected party.
// Caches full project list in window._allProjectsCache.
// Props: partyName (string), value (projectId), onChange({ projectId, projectName })
const _PROJ_STAGE_COLORS = {
  quotation: "#2563B0", discussion: "#D78A14", approved: "#1F8A52",
  advance_collected: "#534AB7", work_started: "#6F1947",
  completed: "#0F6E56", on_hold: "#A89DA3", cancelled: "#C0263A",
};
const _PROJ_STAGE_LABELS = {
  quotation: "Quotation", discussion: "Discussion", approved: "Approved",
  advance_collected: "Advance Collected", work_started: "Work Started",
  completed: "Completed", on_hold: "On Hold", cancelled: "Cancelled",
};

function ProjectSelect({ partyName, value, onChange, label }) {
  const [projects, setProjects] = React.useState([]);
  const [loading,  setLoading]  = React.useState(false);

  React.useEffect(() => {
    if (!partyName) { setProjects([]); return; }
    // Use cached list if available
    if (window._allProjectsCache) {
      const q = partyName.toLowerCase();
      setProjects(window._allProjectsCache.filter(function(p) {
        return p.partyName && p.partyName.toLowerCase() === q;
      }));
      return;
    }
    setLoading(true);
    fetch(window.API + "/projects")
      .then(function(r) { return r.json(); })
      .then(function(data) {
        const list = Array.isArray(data) ? data : [];
        window._allProjectsCache = list;
        const q = partyName.toLowerCase();
        setProjects(list.filter(function(p) {
          return p.partyName && p.partyName.toLowerCase() === q;
        }));
        setLoading(false);
      })
      .catch(function() { setLoading(false); });
  }, [partyName]);

  if (!partyName) return null;

  function handleChange(e) {
    const id   = e.target.value;
    const proj = projects.find(function(p) { return p.projectId === id; });
    onChange({ projectId: id, projectName: proj ? proj.title : "" });
  }

  return (
    <div className="form-row">
      <label className="form-label">{label || "Project"}</label>
      {loading ? (
        <div style={{ fontSize: 12.5, color: "var(--fg-3)", padding: "8px 0" }}>Loading projects…</div>
      ) : projects.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--fg-4)", padding: "7px 10px",
          background: "var(--ink-50)", borderRadius: 8, fontStyle: "italic" }}>
          No projects found for this party
        </div>
      ) : (
        <select className="form-input" value={value || ""} onChange={handleChange}>
          <option value="">— Select project —</option>
          {projects.map(function(p) {
            const stageLabel = _PROJ_STAGE_LABELS[p.stage] || p.stage;
            return (
              <option key={p.projectId} value={p.projectId}>
                {p.title}  [{stageLabel}]
              </option>
            );
          })}
        </select>
      )}
      {value && (function() {
        const proj = projects.find(function(p) { return p.projectId === value; });
        if (!proj) return null;
        const col = _PROJ_STAGE_COLORS[proj.stage] || "#A89DA3";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: col, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: "var(--fg-3)" }}>
              {proj.type ? proj.type.charAt(0).toUpperCase() + proj.type.slice(1) : ""}
              {proj.location ? " · " + proj.location : ""}
            </span>
          </div>
        );
      })()}
    </div>
  );
}

Object.assign(window, { Icon, Avatar, AvatarRow, Chip, Button, IconButton, KPI, Meter, Segmented, Tabs, Donut, Spark, BarsChart, PartyAutocomplete, ProjectSelect });
