import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@meridian/ui";
import { ACCENT_THEMES, getSavedAccent, setAccent } from "@meridian/theme";
import { navFor } from "./Sidebar.jsx";
import { useNotifications } from "./notifications.js";

const initials = (name) => (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

/**
 * Host topbar — the consistent product frame above every remote: a breadcrumb for
 * the active section, a (visual) global search, notifications, and the user menu
 * (which owns sign-out, so the sidebar stays focused on navigation).
 */
export function Topbar({ user, onLogout, collapsed, onToggleSidebar }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const current = navFor(user).find((n) => loc.pathname.startsWith(n.to));
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [accent, setAccentState] = useState(getSavedAccent);
  const ref = useRef(null);
  const notifRef = useRef(null);
  const { items: notifs, seen, unseenCount, markAllSeen, refresh } = useNotifications();

  const pickAccent = (a) => { setAccent(a); setAccentState(a); };

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const openNotif = () => {
    setNotifOpen((o) => !o);
    if (!notifOpen) refresh();
  };
  const goTo = (item) => {
    setNotifOpen(false);
    navigate(item.to);
  };

  return (
    <header className="shell-topbar">
      <div className="shell-crumbs">
        <button className="shell-icon-btn shell-collapse-btn" title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={onToggleSidebar}>
          <Icon name={collapsed ? "panel-left-open" : "panel-left-close"} size={16} />
        </button>
        <Icon name={current?.icon || "layout-grid"} size={15} />
        <span className="shell-crumb-current">{current?.label || "Workspace"}</span>
      </div>

      <div className="shell-topbar-actions">
        <div className="shell-search" title="Search (coming soon)">
          <Icon name="search" size={15} />
          <input placeholder="Search Meridian…" aria-label="Search" />
          <kbd>⌘K</kbd>
        </div>

        <div className="shell-usermenu" ref={notifRef}>
          <button className="shell-icon-btn" title="Notifications" aria-label="Notifications"
            aria-haspopup="menu" aria-expanded={notifOpen} onClick={openNotif}>
            <Icon name="bell" size={17} />
            {unseenCount > 0 && <span className="shell-badge">{unseenCount > 99 ? "99+" : unseenCount}</span>}
          </button>
          {notifOpen && (
            <div className="shell-dropdown shell-notifs" role="menu">
              <div className="shell-notifs-head">
                <span>Notifications{notifs.length ? ` · ${notifs.length}` : ""}</span>
                {unseenCount > 0 && (
                  <button className="shell-notifs-clear" onClick={markAllSeen}>Mark all read</button>
                )}
              </div>
              <div className="shell-notifs-list">
                {notifs.length === 0 && (
                  <div className="shell-notifs-empty">
                    <Icon name="check-circle-2" size={20} color="var(--success-700, #1F8A52)" />
                    <span>You're all caught up</span>
                  </div>
                )}
                {notifs.map((n) => (
                  <button key={n.id} className="shell-notif-item" role="menuitem" onClick={() => goTo(n)}>
                    <span className="shell-notif-ico" style={{ color: n.color }}>
                      <Icon name={n.icon} size={15} />
                    </span>
                    <span className="shell-notif-meta">
                      <span className="shell-notif-title">{n.title}</span>
                      <span className="shell-notif-sub">{n.sub}</span>
                    </span>
                    {!seen.has(n.id) && <span className="shell-notif-unread" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="shell-usermenu" ref={ref}>
          <button className="shell-userchip" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
            <span className="shell-avatar">{initials(user?.name || user?.email)}</span>
            <span className="shell-userchip-meta">
              <span className="shell-userchip-name">{user?.name || user?.email}</span>
              <span className="shell-userchip-role">{user?.role || "Member"}</span>
            </span>
            <Icon name="chevron-down" size={14} />
          </button>
          {open && (
            <div className="shell-dropdown" role="menu">
              <div className="shell-dropdown-head">
                <span className="shell-avatar shell-avatar--lg">{initials(user?.name || user?.email)}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="shell-dropdown-name">{user?.name || "Signed in"}</div>
                  <div className="shell-dropdown-sub">{user?.email}</div>
                </div>
              </div>
              <div className="shell-dropdown-section">
                <div className="shell-dropdown-label"><Icon name="palette" size={13} /> Theme</div>
                <div className="shell-swatches">
                  {Object.entries(ACCENT_THEMES).map(([hex, t]) => (
                    <button
                      key={hex}
                      className={"shell-swatch" + (accent === hex ? " shell-swatch--active" : "")}
                      style={{ background: `linear-gradient(135deg, ${t.magenta}, ${hex})` }}
                      title={t.name}
                      aria-label={`${t.name} theme`}
                      onClick={() => pickAccent(hex)}
                    >
                      {accent === hex && <Icon name="check" size={13} color="#fff" stroke={3} />}
                    </button>
                  ))}
                </div>
              </div>
              <button className="shell-dropdown-item" role="menuitem" onClick={onLogout}>
                <Icon name="log-out" size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
