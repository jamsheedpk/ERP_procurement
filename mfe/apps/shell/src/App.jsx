import React, { Suspense, useEffect, useState } from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { applyTheme, getSavedAccent } from "@meridian/theme";
import { Spinner } from "@meridian/ui";
import { api, getToken, USER_KEY, TOKEN_KEY } from "@meridian/api";
import { Sidebar, roleOf } from "./Sidebar.jsx";
import { Topbar } from "./Topbar.jsx";
import { Login } from "./Login.jsx";
import { RemoteBoundary } from "./RemoteBoundary.jsx";

// Federated remotes — each is an independently built & deployed micro-frontend.
// React.lazy + the host's federation config resolve `remote/App` at runtime.
const CoreApp        = React.lazy(() => import("core/App"));
const ProcurementApp = React.lazy(() => import("procurement/App"));
const HrApp          = React.lazy(() => import("hr/App"));
const FinanceApp     = React.lazy(() => import("finance/App"));
const ProjectsApp    = React.lazy(() => import("projects/App"));

function RemoteRoute({ name, children }) {
  const loc = useLocation();
  return (
    <RemoteBoundary name={name} routeKey={loc.pathname}>
      <Suspense fallback={<Spinner label={`Loading ${name}…`} />}>{children}</Suspense>
    </RemoteBoundary>
  );
}

// Admin workspace — full host chrome (sidebar + topbar) around the domain remotes.
// Employees never reach this; they get the portal full-screen (see App below).
function Layout({ user, onLogout }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("meridian_sidebar_collapsed") === "1"; } catch { return false; }
  });
  const toggleSidebar = () => setCollapsed((c) => {
    try { localStorage.setItem("meridian_sidebar_collapsed", c ? "0" : "1"); } catch { /* private mode */ }
    return !c;
  });
  return (
    <div className={"shell-root" + (collapsed ? " shell-root--collapsed" : "")}>
      <Sidebar user={user} collapsed={collapsed} />
      <div className="shell-main">
        <Topbar user={user} onLogout={onLogout} collapsed={collapsed} onToggleSidebar={toggleSidebar} />
        <main className="shell-content">
        <Routes>
          <Route path="/" element={<Navigate to="/core" replace />} />
          <Route path="/core/*"        element={<RemoteRoute name="Overview"><CoreApp /></RemoteRoute>} />
          <Route path="/procurement/*" element={<RemoteRoute name="Procurement"><ProcurementApp /></RemoteRoute>} />
          <Route path="/hr/*"          element={<RemoteRoute name="People & Culture"><HrApp /></RemoteRoute>} />
          <Route path="/finance/*"     element={<RemoteRoute name="Finance"><FinanceApp /></RemoteRoute>} />
          <Route path="/projects/*"    element={<RemoteRoute name="Projects"><ProjectsApp /></RemoteRoute>} />
          <Route path="*" element={<Navigate to="/core" replace />} />
        </Routes>
        </main>
      </div>
    </div>
  );
}

export function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; } catch { return null; }
  });
  const [checked, setChecked] = useState(false);

  useEffect(() => { applyTheme(getSavedAccent()); }, []);

  // Validate any stored token on boot.
  useEffect(() => {
    if (!getToken()) { setChecked(true); return; }
    api.get("/auth/me")
      .then((u) => { setUser(u); setChecked(true); })
      .catch(() => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); setUser(null); setChecked(true); });
  }, []);

  const onLogout = () => {
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); setUser(null);
  };

  if (!checked) return <Spinner label="Starting…" />;
  if (!user) return <Login onLogin={setUser} />;

  // Employees get their self-service portal full-screen. The portal ships its own
  // sidebar/topbar/sign-out, so wrapping it in the host chrome would double everything.
  if (roleOf(user) === "employee") {
    return (
      <div className="shell-employee">
        <RemoteBoundary name="My Portal" routeKey="portal">
          <Suspense fallback={<Spinner label="Loading your portal…" />}>
            <HrApp />
          </Suspense>
        </RemoteBoundary>
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout user={user} onLogout={onLogout} />
    </HashRouter>
  );
}
