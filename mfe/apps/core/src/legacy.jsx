/**
 * Primitives the monolith Dashboard / Reports / Permissions pages expect, ported
 * from Primitives.jsx to ESM and keeping the original hrm.css class names. Icon
 * runs on lucide-react instead of window.lucide.createIcons().
 *
 * Superset of the hr remote's legacy.jsx: adds the SVG chart primitives
 * (Donut, Spark, BarsChart) the executive Dashboard needs.
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

/* Tiny donut/ring chart in SVG */
export function Donut({ size = 160, stroke = 18, segments, label, value }) {
  const r = size / 2 - stroke / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  return (
    <div className="ring" style={{ maxWidth: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ink-100)" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const offset = c - acc;
          acc += len;
          return (
            <circle key={i}
              cx={size / 2} cy={size / 2} r={r}
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
export function Spark({ points, color = "var(--brand-burgundy)", height = 60, fill }) {
  if (!points || !points.length) return null;
  const max = Math.max(...points), min = Math.min(...points);
  const range = Math.max(1, max - min);
  const w = 100;
  const step = w / (points.length - 1);
  const path = points.map((p, i) => `${i ? "L" : "M"}${(i * step).toFixed(2)} ${(height - 4 - ((p - min) / range) * (height - 8)).toFixed(2)}`).join(" ");
  const area = path + ` L${w} ${height} L0 ${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
      {fill !== false ? <path d={area} fill={color} opacity="0.1" /> : null}
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

/* Stacked bar chart — explicit pixel heights for predictable rendering */
export function BarsChart({ data, height = 160 }) {
  const labelH = 22;
  const padTop = 6;
  const chartH = height - labelH - padTop;
  const max = Math.max(...data.map((d) => d.segments.reduce((s, x) => s + x.value, 0))) || 1;
  return (
    <div className="bars-v2" style={{ height }}>
      {data.map((d, i) => {
        const total = d.segments.reduce((s, x) => s + x.value, 0);
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

// A couple of pages list `Card` in their /* global */ banner but never render it;
// exported as a harmless passthrough so any stray reference resolves.
export function Card({ children, style, className = "" }) {
  return <div className={"card " + className} style={style}>{children}</div>;
}
