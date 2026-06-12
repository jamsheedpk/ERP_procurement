/**
 * The exact primitives the monolith's ProcurementPage expects (Icon, Button,
 * IconButton, Meter), ported to ESM and keeping the original hrm.css class names
 * so the ported page looks identical.
 *
 * Icon is reimplemented on lucide-react (a real React component) instead of the
 * monolith's window.lucide.createIcons() DOM-mutation approach — same icons, no
 * global script or post-render timing.
 */
import React from "react";
import * as Lucide from "lucide-react";

const toPascal = (name) =>
  String(name || "").replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());

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

export function Meter({ value, max = 100, kind }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return <div className={"meter " + (kind ? "meter-" + kind : "")}><span style={{ width: pct + "%" }} /></div>;
}
