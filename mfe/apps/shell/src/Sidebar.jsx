import React from "react";
import { NavLink } from "react-router-dom";
import { Icon } from "@meridian/ui";

export const NAV = [
  { to: "/procurement", label: "Procurement", icon: "git-merge", remote: true },
  { to: "/hr",          label: "People & Culture", icon: "users", remote: true },
  { to: "/finance",     label: "Finance", icon: "wallet", remote: true },
  { to: "/projects",    label: "Projects", icon: "folder-kanban", remote: true },
];

export function Sidebar({ user, onLogout }) {
  return (
    <aside className="shell-sidebar">
      <div className="shell-brand">
        <div className="shell-mark">M</div>
        <div>
          <div className="shell-brand-name">Meridian ERP</div>
          <div className="shell-brand-sub">Micro-frontends</div>
        </div>
      </div>
      <nav className="shell-nav">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => "shell-nav-item" + (isActive ? " shell-nav-item--active" : "")}>
            <Icon name={n.icon} size={16} />
            <span>{n.label}</span>
            <span className="shell-nav-remote" title="Loaded as a federated remote">remote</span>
          </NavLink>
        ))}
      </nav>
      <div className="shell-foot">
        {user && <div className="shell-user">{user.name || user.email}</div>}
        <button className="shell-logout" onClick={onLogout}><Icon name="log-out" size={14} /> Sign out</button>
      </div>
    </aside>
  );
}
