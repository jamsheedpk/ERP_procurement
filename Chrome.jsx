/* global React, Icon, Avatar */
const { useState: useSidebarState } = React;

function Sidebar({ current, onNav, counts = {}, brandName = "Meridian HRM", collapsed, onToggle, user, onLogout }) {

  const nav = [
    { sec: "Overview", items: [
      { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
    ]},
    { sec: "People", items: [
      { id: "people",   label: "Employees",   icon: "users",         count: counts.people },
      { id: "org",      label: "Org chart",   icon: "git-branch" },
      { id: "onboard",  label: "Onboarding",  icon: "door-open",     count: counts.onboard, muted: true },
      { id: "docs",     label: "Documents",   icon: "files",         count: counts.docs,    muted: true },
      { id: "recruit",  label: "Recruitment", icon: "user-plus",     count: counts.recruit },
      { id: "parties",  label: "Party", icon: "contact-round" },
    ]},
    { sec: "Projects", items: [
      { id: "projects",   label: "Pipeline",   icon: "kanban" },
      { id: "quotations", label: "Quotations", icon: "file-text" },
      { id: "projreport", label: "P&L Report",  icon: "file-bar-chart" },
    ]},
    { sec: "Time", items: [
      { id: "leave",    label: "Leave",      icon: "calendar-off", count: counts.leave },
      { id: "attend",   label: "Attendance", icon: "clock" },
      { id: "shifts",   label: "Shifts",     icon: "calendar-cog" },
    ]},
    { sec: "Money", items: [
      { id: "payroll",  label: "Payroll",    icon: "wallet" },
      { id: "salary",   label: "Salary",     icon: "calculator" },
      { id: "benefits", label: "Benefits",   icon: "gift" },
      { id: "expense",  label: "Expenses",   icon: "receipt" },
      { id: "cashbook", label: "Cash Book", icon: "book-open" },
      { id: "daybook",  label: "Day Book",  icon: "notebook-pen" },
    ]},
    { sec: "Growth", items: [
      { id: "perf",     label: "Performance",icon: "chart-bar" },
      { id: "learn",    label: "Training",   icon: "graduation-cap" },
      { id: "reports",  label: "Reports",    icon: "file-bar-chart" },
    ]},
    { sec: "Settings", items: [
      { id: "permissions", label: "Permissions", icon: "shield-check" },
    ]},
  ];

  return (
    <>
      <aside className={"sidebar" + (collapsed ? " sidebar--collapsed" : "")}>
        {/* Scrollable nav area */}
        <div className="sidebar-scroll">
          <div className="sidebar-brand">
            <div className="mark">M</div>
            {!collapsed && (
              <div>
                <div className="wm">{brandName.split(" ")[0]}</div>
                <div className="sub">{brandName.split(" ").slice(1).join(" ") || "HR Suite"}</div>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="org-switch" title="Switch organisation">
              <div className="av">ML</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="nm">Meridian Logistics</div>
                <div className="sub">DMCC · 247 staff</div>
              </div>
              <span className="ico"><Icon name="chevrons-up-down" size={14} /></span>
            </div>
          )}

          {nav.map((section, si) => (
            <div className="sidebar-section" key={si}>
              {!collapsed && <div className="heading">{section.sec}</div>}
              {section.items.map(it => (
                <div
                  key={it.id}
                  className={"nav-item " + (current === it.id ? "active" : "")}
                  onClick={() => onNav && onNav(it.id)}
                >
                  <Icon name={it.icon} size={collapsed ? 18 : 17} />
                  <span className="nav-label">{it.label}</span>
                  {!collapsed && it.count != null && (
                    <span className={"count " + (it.muted ? "muted" : "")}>{it.count}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Sticky footer */}
        <div className="sidebar-footer">
          <div
            className="sidebar-collapse-btn"
            onClick={onToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon name={collapsed ? "panel-left-open" : "panel-left-close"} size={16} />
            {!collapsed && <span>Collapse</span>}
          </div>

          {!collapsed && onLogout && (
            <button className="sidebar-logout" onClick={onLogout} title="Sign out">
              <Icon name="log-out" size={14} color="rgba(244,221,232,0.55)" />
              <span>Sign out</span>
            </button>
          )}

          <div
            className="sidebar-user"
            title={collapsed ? (user?.name || "User") : undefined}
          >
            <Avatar
              name={user?.name || "User"}
              color={user?.avatar || { bg: "var(--brand-pink)", fg: "var(--plum-900)" }}
            />
            {!collapsed && (
              <>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="name">{user?.name || "—"}</div>
                  <div className="role">{user?.role || "HRM User"}</div>
                </div>
                <Icon name="settings" size={15} color="var(--fg-on-sidebar-muted)" />
              </>
            )}
          </div>
        </div>
      </aside>

    </>
  );
}

function Topbar({ crumbs = [], onToggleSidebar, onQuickAction }) {
  return (
    <header className="topbar">
      <button
        className="topbar-sidebar-toggle"
        onClick={onToggleSidebar}
        title="Toggle sidebar"
      >
        <Icon name="panel-left" size={18} />
      </button>

      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <span className="sep">›</span> : null}
            <span className={i === crumbs.length - 1 ? "cur" : ""}>{c}</span>
          </React.Fragment>
        ))}
      </div>

      <div className="search" style={{ marginLeft: 16 }}>
        <Icon name="search" size={15} color="var(--fg-3)" />
        <input placeholder="Search people, requests, payslips, jobs…" />
        <span className="kbd">⌘K</span>
      </div>

      <div className="topbar-actions">
        <IconButton icon="help-circle" title="Help" />
        <IconButton icon="message-circle" title="Inbox" badge />
        <IconButton icon="bell" title="Notifications" badge />
        <div style={{ width: 1, height: 22, background: "var(--border-subtle)", margin: "0 4px" }} />
        <Button variant="primary" icon="plus" onClick={onQuickAction}>New</Button>
      </div>
    </header>
  );
}

Object.assign(window, { Sidebar, Topbar });
