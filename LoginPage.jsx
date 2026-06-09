/* global React, API */
const { useState: useStateLogin, useEffect: useEffectLogin } = React;

function LoginPage({ onLogin }) {
  const [email,    setEmail]    = useStateLogin("admin@meridian.ae");
  const [password, setPassword] = useStateLogin("");
  const [loading,  setLoading]  = useStateLogin(false);
  const [error,    setError]    = useStateLogin("");
  const [showPw,   setShowPw]   = useStateLogin(false);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email.trim() || !password) { setError("Enter your email and password."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Login failed."); return; }
      localStorage.setItem("hrm_token", data.token);
      localStorage.setItem("hrm_user",  JSON.stringify(data.user));
      onLogin(data.user, data.token);
    } catch {
      setError("Cannot reach the server. Make sure it is running.");
    } finally { setLoading(false); }
  };

  const onKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div className="login-root">
      {/* Left panel — brand */}
      <div className="login-brand">
        <div className="login-brand-inner">
          <div className="login-logo">
            <div className="login-logo-mark">M</div>
          </div>
          <div className="login-brand-name">Meridian ERP</div>
          <div className="login-brand-sub">Enterprise Resource Platform</div>

          <div className="login-features">
            {[
              ["users",        "Employee directory & HR"],
              ["wallet",       "Payroll & WPS filing"],
              ["book-open",    "Finance & accounting"],
              ["kanban",       "Projects & quotations"],
            ].map(([icon, label]) => (
              <div key={icon} className="login-feature-item">
                <div className="login-feature-icon">
                  <i data-lucide={icon} style={{ width: 15, height: 15 }} />
                </div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="login-brand-footer">
          Meridian Logistics DMCC · Dubai, UAE
        </div>
      </div>

      {/* Right panel — form */}
      <div className="login-panel">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <div className="login-card-head">
            <div className="login-card-title">Welcome back</div>
            <div className="login-card-sub">Sign in to your ERP account</div>
          </div>

          <div className="stack" style={{ gap: 14 }}>
            <div className="form-group">
              <label className="label">Email address</label>
              <input
                className={"fi" + (error ? " fi-error" : "")}
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={onKey}
                placeholder="you@meridian.ae"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <label className="label" style={{ margin: 0 }}>Password</label>
                <span className="login-forgot">Forgot password?</span>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  className={"fi" + (error ? " fi-error" : "")}
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={onKey}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  className="login-pw-toggle"
                  onClick={() => setShowPw(v => !v)}
                  tabIndex={-1}
                >
                  <i data-lucide={showPw ? "eye-off" : "eye"} style={{ width: 15, height: 15 }} />
                </button>
              </div>
            </div>

            {error && (
              <div className="form-err" style={{ marginTop: 0 }}>
                <i data-lucide="alert-circle" style={{ width: 14, height: 14, flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button
              type="submit"
              className={"btn btn-primary btn-lg login-submit" + (loading ? " btn-disabled" : "")}
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Signing in…
                </>
              ) : "Sign in"}
            </button>
          </div>

          <div className="login-hint" style={{ flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <i data-lucide="shield" style={{ width: 13, height: 13 }} />
              <span><strong>Admin</strong> — admin@meridian.ae / <strong>admin123</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, borderTop: "1px solid var(--plum-100)", paddingTop: 6, width: "100%" }}>
              <i data-lucide="user" style={{ width: 13, height: 13 }} />
              <span><strong>Employee</strong> — aarav.s@meridian.ae / <strong>emp123</strong></span>
            </div>
          </div>
        </form>

        <div className="login-panel-footer">
          © 2026 Meridian Logistics DMCC. All rights reserved.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginPage });
