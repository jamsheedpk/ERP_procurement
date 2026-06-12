/**
 * Primitives the monolith Finance/Projects pages expect, ported from Primitives.jsx
 * to ESM with the original hrm.css classes. Icon runs on lucide-react. The
 * autocompletes read `window.API` (set by ./setup.js) and cache on window, exactly
 * like the monolith.
 */
import React from "react";
import * as Lucide from "lucide-react";

const toPascal = (name) => String(name || "").replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());

export function Icon({ name, size = 18, stroke = 1.75, className = "", color }) {
  const Cmp = Lucide[toPascal(name)] || Lucide.Square;
  return (
    <span className={"icon " + className} style={{ display: "inline-flex", width: size, height: size, color }}>
      <Cmp size={size} strokeWidth={stroke} color={color} />
    </span>
  );
}

export function Button({ variant = "primary", size, icon, iconRight, children, onClick, type = "button", style, title, disabled }) {
  const cls = ["btn", "btn-" + variant, size === "sm" ? "btn-sm" : "", size === "lg" ? "btn-lg" : "", disabled ? "btn-disabled" : ""].filter(Boolean).join(" ");
  return (
    <button className={cls} onClick={disabled ? undefined : onClick} type={type} style={style} title={title} disabled={disabled}>
      {icon ? <Icon name={icon} size={size === "sm" ? 13 : 14} stroke={2} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={size === "sm" ? 13 : 14} stroke={2} /> : null}
    </button>
  );
}

export function IconButton({ icon, title, onClick, badge }) {
  return (
    <button className="icon-btn" title={title} onClick={onClick}>
      <Icon name={icon} size={18} />
      {badge ? <span className="badge-dot" /> : null}
    </button>
  );
}

export function Avatar({ name, color, size = "md" }) {
  const cls = "av " + (size === "sm" ? "av-sm" : size === "lg" ? "av-lg" : size === "xl" ? "av-xl" : "");
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <div className={cls} style={color ? { background: color.bg, color: color.fg } : null}>{initials}</div>;
}

const _PARTY_TYPE_META = {
  vendor:     { label: "Vendor",     icon: "truck",           color: "#C0263A" },
  client:     { label: "Client",     icon: "briefcase",       color: "#2563B0" },
  employee:   { label: "Employee",   icon: "user",            color: "#6F1947" },
  bank:       { label: "Bank",       icon: "landmark",        color: "#1F8A52" },
  government: { label: "Government", icon: "building-2",      color: "#534AB7" },
  other:      { label: "Other",      icon: "more-horizontal", color: "#A89DA3" },
};

export function PartyAutocomplete({ value, onChange, placeholder }) {
  const [query, setQuery] = React.useState(value || "");
  const [parties, setParties] = React.useState(window._partyCacheData || []);
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    if (window._partyCacheData) { setParties(window._partyCacheData); return; }
    fetch(window.API + "/parties?status=active").then((r) => r.json()).then((data) => {
      const list = Array.isArray(data) ? data : [];
      window._partyCacheData = list; setParties(list);
    }).catch(() => {});
  }, []);
  React.useEffect(() => { setQuery(value || ""); }, [value]);
  React.useEffect(() => {
    function onDown(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? parties.filter((p) => p.name.toLowerCase().includes(q) || (p.contactPerson || "").toLowerCase().includes(q) || (p.taxNumber || "").toLowerCase().includes(q))
      : parties.slice(0, 10);
    return list.slice(0, 10);
  }, [query, parties]);

  const select = (party) => { setQuery(party.name); onChange(party.name); setOpen(false); };
  const handleInput = (e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <Icon name="contact-round" size={14} color="var(--fg-4)" />
        </span>
        <input className="form-input" style={{ paddingLeft: 32 }} placeholder={placeholder || "Search party / project or type a name…"} value={query} onChange={handleInput} onFocus={() => setOpen(true)} autoComplete="off" />
        {query && (
          <button onMouseDown={(e) => { e.preventDefault(); setQuery(""); onChange(""); }}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", color: "var(--fg-4)" }}>
            <Icon name="x" size={13} color="var(--fg-3)" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 300, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.13)", maxHeight: 230, overflowY: "auto" }}>
          {filtered.map((party, i) => {
            const pt = _PARTY_TYPE_META[party.type] || _PARTY_TYPE_META.other;
            return (
              <div key={party.partyId} onMouseDown={() => select(party)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", cursor: "pointer", borderBottom: i < filtered.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--ink-50)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: pt.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={pt.icon} size={14} color={pt.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{party.name}</div>
                  {party.contactPerson && <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{party.contactPerson}</div>}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: pt.color + "15", color: pt.color, flexShrink: 0, whiteSpace: "nowrap" }}>{pt.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const _PROJ_STAGE_COLORS = { quotation: "#2563B0", discussion: "#D78A14", approved: "#1F8A52", advance_collected: "#534AB7", work_started: "#6F1947", completed: "#0F6E56", on_hold: "#A89DA3", cancelled: "#C0263A" };
const _PROJ_STAGE_LABELS = { quotation: "Quotation", discussion: "Discussion", approved: "Approved", advance_collected: "Advance Collected", work_started: "Work Started", completed: "Completed", on_hold: "On Hold", cancelled: "Cancelled" };

export function ProjectSelect({ partyName, value, onChange, label }) {
  const [projects, setProjects] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (!partyName) { setProjects([]); return; }
    if (window._allProjectsCache) {
      const q = partyName.toLowerCase();
      setProjects(window._allProjectsCache.filter((p) => p.partyName && p.partyName.toLowerCase() === q));
      return;
    }
    setLoading(true);
    fetch(window.API + "/projects").then((r) => r.json()).then((data) => {
      const list = Array.isArray(data) ? data : [];
      window._allProjectsCache = list;
      const q = partyName.toLowerCase();
      setProjects(list.filter((p) => p.partyName && p.partyName.toLowerCase() === q));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [partyName]);

  if (!partyName) return null;
  const handleChange = (e) => { const id = e.target.value; const proj = projects.find((p) => p.projectId === id); onChange({ projectId: id, projectName: proj ? proj.title : "" }); };

  return (
    <div className="form-row">
      <label className="form-label">{label || "Project"}</label>
      {loading ? (
        <div style={{ fontSize: 12.5, color: "var(--fg-3)", padding: "8px 0" }}>Loading projects…</div>
      ) : projects.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--fg-4)", padding: "7px 10px", background: "var(--ink-50)", borderRadius: 8, fontStyle: "italic" }}>No projects found for this party</div>
      ) : (
        <select className="form-input" value={value || ""} onChange={handleChange}>
          <option value="">— Select project —</option>
          {projects.map((p) => <option key={p.projectId} value={p.projectId}>{p.title}  [{_PROJ_STAGE_LABELS[p.stage] || p.stage}]</option>)}
        </select>
      )}
      {value && (() => {
        const proj = projects.find((p) => p.projectId === value);
        if (!proj) return null;
        const col = _PROJ_STAGE_COLORS[proj.stage] || "#A89DA3";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: col, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: "var(--fg-3)" }}>{proj.type ? proj.type.charAt(0).toUpperCase() + proj.type.slice(1) : ""}{proj.location ? " · " + proj.location : ""}</span>
          </div>
        );
      })()}
    </div>
  );
}
