/**
 * Shared UI primitives for all micro-frontends — the ESM successor to the
 * monolith's Primitives.jsx. Components are imported explicitly (no global scope),
 * which is exactly what prevents the class of cross-module name collisions that
 * bit the monolith (e.g. the duplicate global `stageIndex`).
 */
import React from "react";
import * as Lucide from "lucide-react";

const toPascal = (name) =>
  String(name || "").replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());

/** Lucide icon by kebab-case name, matching the monolith's <Icon name="..."/> API. */
export function Icon({ name, size = 16, color = "currentColor", stroke = 2, style }) {
  const Cmp = Lucide[toPascal(name)] || Lucide.Square;
  return <Cmp size={size} color={color} strokeWidth={stroke} style={style} />;
}

export function Button({ variant = "secondary", size = "md", icon, children, ...rest }) {
  return (
    <button className={`m-btn m-btn--${variant} m-btn--${size}`} {...rest}>
      {icon && <Icon name={icon} size={size === "sm" ? 13 : 15} />}
      {children}
    </button>
  );
}

export function IconButton({ icon, title, ...rest }) {
  return (
    <button className="m-icon-btn" title={title} {...rest}>
      <Icon name={icon} size={16} />
    </button>
  );
}

export function Card({ children, style, className = "", ...rest }) {
  return <div className={`m-card ${className}`} style={style} {...rest}>{children}</div>;
}

export function KPI({ label, value, sub, icon, color = "var(--brand-burgundy)" }) {
  return (
    <div className="m-kpi">
      <div className="m-kpi-lbl">{label}</div>
      <div className="m-kpi-val">{value}</div>
      {sub && <div className="m-kpi-sub">{sub}</div>}
      {icon && <div className="m-kpi-ico" style={{ color, background: color + "18" }}><Icon name={icon} size={16} /></div>}
    </div>
  );
}

export function Badge({ children, color = "var(--fg-3)", icon }) {
  return (
    <span className="m-badge" style={{ color, background: color + "1A" }}>
      {icon && <Icon name={icon} size={10} />}{children}
    </span>
  );
}

export function Spinner({ label }) {
  return (
    <div className="m-spinner-wrap">
      <div className="m-spinner" />
      {label && <div className="m-spinner-lbl">{label}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <div className="m-error">
      <Icon name="alert-circle" size={28} color="var(--danger-500)" />
      <div className="m-error-title">{title}</div>
      {message && <div className="m-error-msg">{message}</div>}
      {onRetry && <Button variant="secondary" icon="refresh-cw" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

/** AED currency formatter shared across finance/procurement modules. */
export const AED = (n) => "AED " + (Number(n) || 0).toLocaleString();
export const VAT_RATE = 0.05;
