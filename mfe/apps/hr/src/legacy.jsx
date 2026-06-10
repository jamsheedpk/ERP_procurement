/**
 * Primitives the monolith HR pages expect, ported from Primitives.jsx to ESM and
 * keeping the original hrm.css class names. Icon runs on lucide-react (a real React
 * component) instead of window.lucide.createIcons().
 */
import React from "react";
import * as Lucide from "lucide-react";

const toPascal = (name) => String(name || "").replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());

export function Icon({ name, size = 18, stroke = 1.75, className = "", color }) {
  const Cmp = Lucide[toPascal(name)] || Lucide.Square;
  return (
    <span className={"icon " + className} style={{ display: "inline-flex", width: size, height: size, color }}>
      <Cmp size={size} strokeWidth={stroke} color={color} />
    </span>
  );
}

export function Avatar({ name, color, size = "md" }) {
  const cls = "av " + (size === "sm" ? "av-sm" : size === "lg" ? "av-lg" : size === "xl" ? "av-xl" : "");
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <div className={cls} style={color ? { background: color.bg, color: color.fg } : null}>{initials}</div>;
}

export function AvatarRow({ name, sub, color, size = "md", right }) {
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

export function Chip({ kind = "default", children, dot = true, icon }) {
  const cls = "chip " + (kind !== "default" ? "chip-" + kind : "");
  return (
    <span className={cls}>
      {icon ? <Icon name={icon} size={12} stroke={2} /> : (dot && kind !== "default" ? <span className="dot" /> : null)}
      {children}
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

export function KPI({ label, value, unit, delta, deltaDir = "up", icon }) {
  return (
    <div className="kpi">
      <div className="lbl">{label}</div>
      <div className="val">{value}{unit ? <span className="unit">{unit}</span> : null}</div>
      {delta ? (
        <div className={"delta " + (deltaDir === "down" ? "down" : "")}>
          <Icon name={deltaDir === "down" ? "trending-down" : "trending-up"} size={12} stroke={2.2} />
          <span>{delta}</span>
        </div>
      ) : null}
      {icon ? <div className="ico"><Icon name={icon} size={16} stroke={2} /></div> : null}
    </div>
  );
}

export function Meter({ value, max = 100, kind }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return <div className={"meter " + (kind ? "meter-" + kind : "")}><span style={{ width: pct + "%" }} /></div>;
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button key={o.value} className={value === o.value ? "active" : ""} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <div key={t.id} className={"tab " + (active === t.id ? "active" : "")} onClick={() => onChange(t.id)}>
          {t.label}{typeof t.count !== "undefined" ? <span className="count">{t.count}</span> : null}
        </div>
      ))}
    </div>
  );
}

// A couple of HR pages list `Card` in their /* global */ banner but never render it;
// exported as a harmless passthrough so any stray reference resolves.
export function Card({ children, style, className = "" }) {
  return <div className={"card " + className} style={style}>{children}</div>;
}
