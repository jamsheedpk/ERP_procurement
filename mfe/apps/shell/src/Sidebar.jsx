import React from "react";
import { NavLink } from "react-router-dom";
import { Icon } from "@meridian/ui";

// Role-aware navigation. Admins get the full ERP; employees get only their
// self-service portal (so they can't reach Finance, Procurement, or other
// people's HR records).
const ALL_NAV = [
  { to: "/core",        label: "Overview",         icon: "layout-dashboard", roles: ["admin"] },
  { to: "/procurement", label: "Procurement",      icon: "git-merge",        roles: ["admin"] },
  { to: "/hr",          label: "People & Culture", icon: "users",            roles: ["admin"] },
  { to: "/finance",     label: "Finance",          icon: "wallet",           roles: ["admin"] },
  { to: "/projects",    label: "Projects",         icon: "folder-kanban",    roles: ["admin"] },
  { to: "/hr",          label: "My Portal",        icon: "user-circle",      roles: ["employee"] },
];

export const roleOf = (user) => (user?.userRole === "employee" ? "employee" : "admin");
export const navFor = (user) => ALL_NAV.filter((n) => n.roles.includes(roleOf(user)));

export function Sidebar({ user, collapsed }) {
  const nav = navFor(user);
  return (
    <aside className="shell-sidebar">
      <div className="shell-brand">
        <div className="shell-mark">M</div>
        {!collapsed && (
          <div>
            <div className="shell-brand-name">Meridian ERP</div>
            <div className="shell-brand-sub">Logistics DMCC</div>
          </div>
        )}
      </div>

      {!collapsed && <div className="shell-nav-label">{roleOf(user) === "employee" ? "My space" : "Workspace"}</div>}
      <nav className="shell-nav">
        {nav.map((n) => (
          <NavLink key={n.label} to={n.to} title={collapsed ? n.label : undefined}
            className={({ isActive }) => "shell-nav-item" + (isActive ? " shell-nav-item--active" : "")}>
            <span className="shell-nav-ico"><Icon name={n.icon} size={17} /></span>
            {!collapsed && <span>{n.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="shell-foot">
        {collapsed ? (
          <div className="shell-foot-brand" style={{ textAlign: "center" }} title="Meridian Logistics DMCC · Enterprise v0.1">·</div>
        ) : (
          <>
            <div className="shell-foot-brand">Meridian Logistics DMCC</div>
            <div className="shell-foot-ver">Enterprise · v0.1</div>
          </>
        )}
      </div>
    </aside>
  );
}
