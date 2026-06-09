/* global React, Icon, Avatar, AvatarRow, Chip, Button, KPI, Meter, Donut, Spark, BarsChart, Segmented */
const { useState: useStateD, useMemo: useMemoD, useEffect: useEffectD, useCallback: useCallbackD } = React;

const DAY_NAMES   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(d) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function leaveTypeIcon(type) {
  if (!type) return "calendar-off";
  const t = type.toLowerCase();
  if (t.includes("annual") || t.includes("vacation")) return "sun";
  if (t.includes("sick"))     return "thermometer";
  if (t.includes("hajj"))     return "moon";
  if (t.includes("maternity") || t.includes("paternity")) return "baby";
  return "calendar-off";
}

// ── Skeleton placeholder ──────────────────────────────────────────────────────
function Skel({ w = "100%", h = 18, r = 8, style = {} }) {
  return (
    <div style={{ width: w, height: h, borderRadius: r, background: "var(--ink-100)",
      animation: "pulse 1.4s ease-in-out infinite", ...style }} />
  );
}

// ── Project pipeline map ──────────────────────────────────────────────────────
// `mark` = single letter drawn inside the pin · `lucide` = legend chip icon
const PROJ_STAGE_MAP = {
  quotation:         { label: "Quotation",         color: "#2563B0", mark: "Q", lucide: "file-text" },
  discussion:        { label: "Discussion",        color: "#D78A14", mark: "D", lucide: "message-circle" },
  approved:          { label: "Approved",          color: "#1F8A52", mark: "A", lucide: "check-circle-2" },
  advance_collected: { label: "Advance Collected", color: "#534AB7", mark: "$", lucide: "banknote" },
  work_started:      { label: "Work Started",      color: "#6F1947", mark: "W", lucide: "hard-hat" },
  completed:         { label: "Completed",         color: "#0F6E56", mark: "✓", lucide: "flag" },
  on_hold:           { label: "On Hold",           color: "#A89DA3", mark: "I", lucide: "pause-circle" },
  cancelled:         { label: "Cancelled",         color: "#C0263A", mark: "✕", lucide: "x-circle" },
};

// Build a teardrop pin SVG (data-URL) coloured by stage with a white letter inside
function pinIcon(color, mark) {
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">' +
      '<path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 16.2 28.6 16.9 29.3a1.6 1.6 0 0 0 2.2 0C19.8 46.6 36 30.6 36 18 36 8.06 27.94 0 18 0z" ' +
        'fill="' + color + '" stroke="#ffffff" stroke-width="2.5"/>' +
      '<circle cx="18" cy="18" r="10.5" fill="#ffffff"/>' +
      '<text x="18" y="18" text-anchor="middle" dominant-baseline="central" ' +
        'font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="' + color + '">' + mark + '</text>' +
    '</svg>';
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function ProjectsMap({ projects, onNav }) {
  const divRef    = React.useRef(null);
  const mapRef    = React.useRef(null);
  const markersRef = React.useRef([]);
  const infoRef   = React.useRef(null);
  const [ready, setReady] = useStateD(false);
  const [activeStage, setActiveStage] = useStateD("all");

  const located = useMemoD(
    () => (projects || []).filter(p => typeof p.lat === "number" && typeof p.lng === "number"),
    [projects]
  );

  const stageCounts = useMemoD(() => {
    const m = {};
    located.forEach(p => { m[p.stage] = (m[p.stage] || 0) + 1; });
    return m;
  }, [located]);

  // Wait for Google Maps to load (async script)
  useEffectD(() => {
    if (window.google && window.google.maps) { setReady(true); return; }
    const iv = setInterval(() => {
      if (window.google && window.google.maps) { setReady(true); clearInterval(iv); }
    }, 300);
    return () => clearInterval(iv);
  }, []);

  // Init map once
  useEffectD(() => {
    if (!ready || !divRef.current || mapRef.current) return;
    mapRef.current = new window.google.maps.Map(divRef.current, {
      center: { lat: 25.0, lng: 55.2 },   // UAE default
      zoom: 8,
      mapTypeId: "roadmap",
      disableDefaultUI: true,
      zoomControl: true,
      fullscreenControl: true,
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ],
    });
    infoRef.current = new window.google.maps.InfoWindow();
  }, [ready]);

  // Plot / refresh markers when data or filter changes
  useEffectD(() => {
    if (!ready || !mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const shown = located.filter(p => activeStage === "all" || p.stage === activeStage);
    if (shown.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();

    shown.forEach(p => {
      const meta = PROJ_STAGE_MAP[p.stage] || { label: p.stage, color: "#888", mark: "•" };
      const pos  = { lat: p.lat, lng: p.lng };
      const marker = new window.google.maps.Marker({
        position: pos,
        map: mapRef.current,
        // native title kept minimal; rich detail comes from the info window
        title: p.title || "Project",
        icon: {
          url: pinIcon(meta.color, meta.mark || "•"),
          scaledSize: new window.google.maps.Size(34, 45),
          anchor: new window.google.maps.Point(17, 45),
          labelOrigin: new window.google.maps.Point(17, 17),
        },
      });

      // Build the detail card once per marker
      const buildHtml = () => {
        const amt   = p.quotationAmount ? "AED " + Number(p.quotationAmount).toLocaleString() : "";
        const row   = (label, val) => val
          ? '<div style="display:flex;gap:6px;font-size:11.5px;margin-top:3px">' +
              '<span style="color:#999;min-width:46px">' + label + '</span>' +
              '<span style="color:#444;font-weight:600">' + val + '</span></div>'
          : "";
        return '<div style="font-family:Arial,sans-serif;min-width:190px;max-width:240px;padding:3px 2px">' +
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">' +
            '<span style="width:18px;height:18px;border-radius:50%;background:' + meta.color + ';color:#fff;' +
              'display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0">' + (meta.mark || "•") + '</span>' +
            '<span style="font-weight:700;font-size:13px;color:#1a1a1a;line-height:1.25">' + (p.title || "Project") + '</span>' +
          '</div>' +
          '<div style="display:inline-block;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:5px;background:' + meta.color + '20;color:' + meta.color + '">' + meta.label + '</div>' +
          row("Client", p.partyName) +
          row("Type", p.type ? (p.type.charAt(0).toUpperCase() + p.type.slice(1)) : "") +
          row("Location", p.location) +
          (amt ? '<div style="margin-top:6px;padding-top:5px;border-top:1px solid #eee;font-size:13px;font-weight:800;color:#1F8A52">' + amt + '</div>' : '') +
          '</div>';
      };

      // Hover → show details
      marker.addListener("mouseover", () => {
        infoRef.current.setContent(buildHtml());
        infoRef.current.open(mapRef.current, marker);
      });
      marker.addListener("mouseout", () => {
        infoRef.current.close();
      });
      // Click → jump to the pipeline
      marker.addListener("click", () => {
        if (onNav) onNav("projects");
      });

      markersRef.current.push(marker);
      bounds.extend(pos);
    });

    if (shown.length === 1) {
      mapRef.current.setCenter(bounds.getCenter());
      mapRef.current.setZoom(13);
    } else {
      mapRef.current.fitBounds(bounds, 60);
    }
  }, [ready, located, activeStage]);

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-head">
        <div>
          <div className="card-title-lg">Project locations</div>
          <div className="card-sub">{located.length} of {(projects || []).length} projects mapped</div>
        </div>
        <Button variant="ghost" size="sm" icon="kanban" onClick={() => onNav && onNav("projects")}>Pipeline</Button>
      </div>

      {/* Stage legend / filter */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 16px 10px" }}>
        <button onClick={() => setActiveStage("all")}
          style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 20, cursor: "pointer",
            fontFamily: "var(--font-sans)",
            border: "1px solid " + (activeStage === "all" ? "var(--brand-burgundy)" : "var(--border-subtle)"),
            background: activeStage === "all" ? "var(--plum-50)" : "var(--bg-surface)",
            color: activeStage === "all" ? "var(--brand-burgundy)" : "var(--fg-2)" }}>
          All · {located.length}
        </button>
        {Object.keys(PROJ_STAGE_MAP).map(key => {
          const c = stageCounts[key] || 0;
          if (c === 0) return null;
          const meta = PROJ_STAGE_MAP[key];
          const active = activeStage === key;
          return (
            <button key={key} onClick={() => setActiveStage(active ? "all" : key)}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600,
                padding: "3px 10px", borderRadius: 20, cursor: "pointer", fontFamily: "var(--font-sans)",
                border: "1px solid " + (active ? meta.color : "var(--border-subtle)"),
                background: active ? meta.color + "15" : "var(--bg-surface)",
                color: active ? meta.color : "var(--fg-2)" }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: meta.color,
                color: "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 800, lineHeight: 1 }}>{meta.mark}</span>
              {meta.label} · {c}
            </button>
          );
        })}
      </div>

      {/* Map / empty state */}
      <div style={{ position: "relative", padding: "0 4px 4px" }}>
        {located.length === 0 ? (
          <div style={{ height: 320, borderRadius: 10, background: "var(--ink-50)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            color: "var(--fg-3)", border: "1px dashed var(--border-subtle)" }}>
            <Icon name="map-pin-off" size={30} color="var(--fg-4)" />
            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600 }}>No mapped projects yet</div>
            <div style={{ fontSize: 12, color: "var(--fg-4)", marginTop: 2 }}>
              Add a location when creating a project to see it here
            </div>
          </div>
        ) : (
          <div ref={divRef} style={{ width: "100%", height: 360, borderRadius: 10,
            overflow: "hidden", background: "var(--ink-100)", border: "1px solid var(--border-subtle)" }} />
        )}
      </div>
    </div>
  );
}

function DashboardPage({ onNav, onApproveLeave: parentApprove, onDeclineLeave: parentDecline }) {
  const [dash, setDash]           = useStateD(null);
  const [projects, setProjects]   = useStateD([]);
  const [loading, setLoading]     = useStateD(true);
  const [actioning, setActioning] = useStateD({});   // { leaveId: "approve"|"decline" }
  const [range, setRange]         = useStateD("month");

  const today   = new Date();
  const hour    = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dayName  = DAY_NAMES[today.getDay()];

  useEffectD(() => {
    fetch(`${window.API}/dashboard`)
      .then(r => r.json())
      .then(d => { setDash(d); setLoading(false); })
      .catch(() => setLoading(false));
    fetch(`${window.API}/projects`)
      .then(r => r.json())
      .then(d => setProjects(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const handleLeaveAction = useCallbackD(async (leave, action) => {
    const id = leave.leaveId;
    if (actioning[id]) return;
    setActioning(a => ({ ...a, [id]: action }));

    // Optimistic: remove from pending list
    setDash(prev => ({
      ...prev,
      pendingLeaves: prev.pendingLeaves.filter(l => l.leaveId !== id),
    }));

    try {
      await fetch(`${window.API}/leave-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action === "approve" ? "approved" : "declined" }),
      });
      if (action === "approve" && parentApprove) parentApprove(leave);
      if (action === "decline" && parentDecline) parentDecline(leave);
    } catch {
      // Revert on failure
      setDash(prev => ({
        ...prev,
        pendingLeaves: [leave, ...prev.pendingLeaves],
      }));
    } finally {
      setActioning(a => { const n = { ...a }; delete n[id]; return n; });
    }
  }, [actioning, parentApprove, parentDecline]);

  const upcomingEvents = useMemoD(() => {
    if (!dash?.monthEvents) return [];
    const todayDate = today.getDate();
    return Object.entries(dash.monthEvents)
      .filter(([d]) => parseInt(d) >= todayDate)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .flatMap(([d, evts]) =>
        evts.filter(e => e.kind === "event" || e.kind === "holiday")
            .map(e => ({ day: parseInt(d), ...e }))
      )
      .slice(0, 5);
  }, [dash?.monthEvents]);

  const sparkPoints = useMemoD(
    () => (dash?.headcountTrend || []).map(h => h.v),
    [dash?.headcountTrend]
  );

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading || !dash) {
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <Skel w={120} h={12} style={{ marginBottom: 10 }} />
            <Skel w={240} h={28} style={{ marginBottom: 8 }} />
            <Skel w={320} h={13} />
          </div>
        </div>
        <div className="grid-4" style={{ marginBottom: 22 }}>
          {[0,1,2,3].map(i => (
            <div key={i} className="card" style={{ height: 88 }}><Skel h="100%" r={12} /></div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, marginBottom: 20 }}>
          <div className="card" style={{ height: 260 }}><Skel h="100%" r={12} /></div>
          <div className="card" style={{ height: 260 }}><Skel h="100%" r={12} /></div>
        </div>
      </div>
    );
  }

  const {
    company, departments, pendingLeaves, renewals, openings,
    payrollRun, activity, attendanceToday, weekAttendance,
  } = dash;

  const dangerRenewals   = renewals.filter(r => r.severity === "danger");
  const criticalRenewals = renewals.filter(r => r.severity === "danger" || r.severity === "warning").slice(0, 5);
  const week             = weekAttendance || [];

  const stageCurrentIdx = payrollRun?.stages?.findIndex(s => !s.done) ?? -1;
  const stagesDone      = payrollRun?.stages?.filter(s => s.done).length ?? 0;

  return (
    <div className="page">

      {/* ── Header ── */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Today · {fmtDate(today)} · {dayName}</div>
          <h1 className="page-title">{greeting}, Fatima</h1>
          <div className="page-sub">
            {pendingLeaves.length} leave request{pendingLeaves.length !== 1 ? "s" : ""} waiting
            {payrollRun && ` · ${payrollRun.period} payroll closes ${payrollRun.runDate}`}
            {dangerRenewals.length > 0 && ` · ${dangerRenewals.length} document${dangerRenewals.length !== 1 ? "s" : ""} overdue`}
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Segmented value={range} onChange={setRange} options={[
            { value: "today", label: "Today"   },
            { value: "week",  label: "Week"    },
            { value: "month", label: "Month"   },
            { value: "qtr",   label: "Quarter" },
          ]} />
          <Button variant="secondary" icon="download">Export</Button>
        </div>
      </div>

      {/* ── Urgency strip ── */}
      {(pendingLeaves.length > 0 || dangerRenewals.length > 0) && (
        <div className="dash-urgency">
          {pendingLeaves.length > 0 && (
            <button className="urgency-chip warn" onClick={() => onNav && onNav("leave")}>
              <Icon name="clock" size={13} />
              {pendingLeaves.length} pending leave approval{pendingLeaves.length !== 1 ? "s" : ""}
            </button>
          )}
          {dangerRenewals.length > 0 && (
            <button className="urgency-chip danger" onClick={() => onNav && onNav("people")}>
              <Icon name="alert-triangle" size={13} />
              {dangerRenewals.length} document{dangerRenewals.length !== 1 ? "s" : ""} overdue
            </button>
          )}
          {payrollRun && (
            <button className="urgency-chip brand" onClick={() => onNav && onNav("payroll")}>
              <Icon name="wallet" size={13} />
              {payrollRun.period} payroll · closes {payrollRun.runDate}
            </button>
          )}
          {openings.length > 0 && (
            <button className="urgency-chip info" onClick={() => onNav && onNav("recruit")}>
              <Icon name="user-plus" size={13} />
              {openings.length} open role{openings.length !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {/* ── KPI row ── */}
      <div className="grid-4" style={{ marginBottom: 22 }}>
        {/* Headcount with sparkline */}
        <div className="kpi" style={{ overflow: "hidden" }}>
          <div className="lbl">Headcount</div>
          <div className="val">{company.headcount}</div>
          <div className="delta">
            <Icon name="trending-up" size={12} stroke={2.2} />
            <span>+4 this month</span>
          </div>
          <div className="ico"><Icon name="users" size={16} stroke={2} /></div>
          {sparkPoints.length > 1 && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 44, opacity: 0.18, pointerEvents: "none" }}>
              <Spark points={sparkPoints} height={44} color="var(--brand-burgundy)" />
            </div>
          )}
        </div>

        <KPI label="Active today"      value={company.activeToday}    unit={` / ${company.headcount}`} delta={Math.round(company.activeToday / company.headcount * 100) + "%"} icon="activity" />
        <KPI label="On leave"          value={company.onLeave}        delta="−2 vs yesterday" deltaDir="down" icon="palmtree" />
        <KPI label="Pending approvals" value={pendingLeaves.length}   delta={pendingLeaves.length > 0 ? "+3 today" : "All clear"} icon="bell-ring" />
      </div>

      {/* ── Workforce + Approvals ── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, marginBottom: 20 }}>

        {/* Workforce activity */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title-lg">Workforce activity</div>
              <div className="card-sub">Present, remote and away · {fmtDate(today)}</div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <Button variant="ghost" size="sm" icon="calendar">
                {MONTH_NAMES[today.getMonth()]} {today.getFullYear()}
              </Button>
              <Button variant="ghost" size="sm" icon="external-link" />
            </div>
          </div>
          <div className="card-pad" style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 28, alignItems: "center" }}>
            <div>
              <Donut size={150} stroke={18} value={company.activeToday} label="Present"
                segments={(attendanceToday || []).map(a => ({ value: a.v, color: a.c }))} />
              <div className="legend" style={{ marginTop: 12, flexDirection: "column", gap: 6 }}>
                {(attendanceToday || []).map((a, i) => (
                  <div key={i} className="legend-item" style={{ justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="sw" style={{ background: a.c }} />
                      {a.lbl}
                    </span>
                    <span className="text-mono" style={{ fontWeight: 600, color: "var(--fg-1)", fontSize: 12 }}>{a.v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
                <div className="label" style={{ color: "var(--fg-3)", fontSize: 11 }}>This week</div>
                <div className="legend" style={{ gap: 10 }}>
                  <span className="legend-item"><span className="sw" style={{ background: "#1F8A52" }} />Present</span>
                  <span className="legend-item"><span className="sw" style={{ background: "#2563B0" }} />WFH</span>
                  <span className="legend-item"><span className="sw" style={{ background: "#B61B54" }} />Leave</span>
                </div>
              </div>
              <BarsChart data={week} height={152} />
            </div>
          </div>
        </div>

        {/* Approvals queue */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title-lg">Approvals queue</div>
              <div className="card-sub">
                {pendingLeaves.length} leave request{pendingLeaves.length !== 1 ? "s" : ""} pending
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNav && onNav("leave")} iconRight="arrow-right">View all</Button>
          </div>
          <div className="card-pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {pendingLeaves.slice(0, 5).map(l => {
              const busy = !!actioning[l.leaveId];
              return (
                <div key={l.leaveId} className="list-item" style={{ cursor: "pointer", gap: 10, opacity: busy ? 0.5 : 1 }}>
                  <div className="icon-wrap info" style={{ flexShrink: 0 }}>
                    <Icon name={leaveTypeIcon(l.typeLbl)} size={13} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="ttl" style={{ fontSize: 12.5 }}>
                      {l.emp}
                      <span className="muted" style={{ fontWeight: 400 }}> · {l.typeLbl}</span>
                    </div>
                    <div className="sub">{l.from} → {l.to} · <strong>{l.days}d</strong> · {l.dept}</div>
                  </div>
                  <div className="row" style={{ gap: 3, flexShrink: 0 }}>
                    <button className="icon-btn" title="Approve" disabled={busy}
                      style={{ width: 28, height: 28, color: "var(--success-700)", background: "var(--success-50)", borderRadius: 7 }}
                      onClick={e => { e.stopPropagation(); handleLeaveAction(l, "approve"); }}>
                      <Icon name="check" size={14} stroke={2.5} />
                    </button>
                    <button className="icon-btn" title="Decline" disabled={busy}
                      style={{ width: 28, height: 28, color: "var(--danger-700)", background: "var(--danger-50)", borderRadius: 7 }}
                      onClick={e => { e.stopPropagation(); handleLeaveAction(l, "decline"); }}>
                      <Icon name="x" size={14} stroke={2.5} />
                    </button>
                  </div>
                </div>
              );
            })}
            {pendingLeaves.length === 0 && (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--fg-3)", fontSize: 13 }}>
                <Icon name="check-circle-2" size={28} color="var(--success-500)" />
                <div style={{ marginTop: 8 }}>All clear — no pending approvals</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Renewals · Payroll · Hiring ── */}
      <div className="grid-3" style={{ marginBottom: 20 }}>

        {/* Renewal radar */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title-lg">Renewal radar</div>
              <div className="card-sub">Visas, EID & licences expiring soon</div>
            </div>
            <Chip kind="danger">{dangerRenewals.length} overdue</Chip>
          </div>
          <div className="card-pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {criticalRenewals.map(r => (
              <div key={r.empId + r.kind} className="list-item">
                <div className={"icon-wrap " + (r.severity === "danger" ? "dang" : "warn")}>
                  <Icon name={r.kind === "Emirates ID" ? "id-card" : r.kind === "Visa" ? "plane" : "file-text"} size={14} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="ttl">{r.emp}</div>
                  <div className="sub">{r.kind} · expires {r.expires}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: r.severity === "danger" ? "var(--danger-700)" : "var(--warning-700)" }}>
                    {r.days < 0 ? `${Math.abs(r.days)}d overdue` : `${r.days}d left`}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card-foot">
            <span className="muted" style={{ fontSize: 12 }}>
              {renewals.length} total · {new Set(renewals.map(r => r.empId)).size} employees
            </span>
            <Button variant="ghost" size="sm" iconRight="arrow-right" onClick={() => onNav && onNav("people")}>All renewals</Button>
          </div>
        </div>

        {/* Payroll snapshot */}
        {payrollRun && (
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title-lg">{payrollRun.period} payroll</div>
                <div className="card-sub">Closes {payrollRun.runDate} · {payrollRun.headcount} employees</div>
              </div>
              <Chip kind={payrollRun.status === "approved" ? "success" : "warning"}>
                {payrollRun.status === "approved" ? "Approved" : "In review"}
              </Chip>
            </div>
            <div className="card-pad">
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.025em", fontFamily: "var(--font-mono)", color: "var(--fg-1)", lineHeight: 1.1 }}>
                  AED {(payrollRun.gross / 1000).toFixed(1)}K
                </div>
                <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 3 }}>
                  Gross · <span style={{ color: "var(--success-700)", fontWeight: 600 }}>+2.1%</span> vs prev
                </div>
              </div>

              {/* Stage stepper */}
              <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 14 }}>
                {payrollRun.stages.map((s, i) => (
                  <React.Fragment key={s.id}>
                    {i > 0 && (
                      <div style={{ flex: 1, height: 2, background: s.done ? "var(--brand-burgundy)" : "var(--ink-200)", transition: "background 0.3s" }} />
                    )}
                    <div title={s.label} style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background:  s.done ? "var(--brand-burgundy)" : i === stageCurrentIdx ? "#fff" : "var(--ink-100)",
                      border:      s.done ? "2px solid var(--brand-burgundy)" : i === stageCurrentIdx ? "2px solid var(--brand-burgundy)" : "2px solid var(--ink-200)",
                      boxShadow:   i === stageCurrentIdx ? "0 0 0 3px var(--plum-100)" : "none",
                      color:       s.done ? "#fff" : i === stageCurrentIdx ? "var(--brand-burgundy)" : "var(--fg-4)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700,
                    }}>
                      {s.done ? <Icon name="check" size={12} stroke={3} color="#fff" /> : i + 1}
                    </div>
                  </React.Fragment>
                ))}
              </div>

              <div style={{ fontSize: 12, color: "var(--fg-2)", marginBottom: 12 }}>
                <span style={{ fontWeight: 600 }}>Step {stagesDone} of {payrollRun.stages.length}</span>
                {stageCurrentIdx >= 0 && (
                  <span className="muted"> · {payrollRun.stages[stageCurrentIdx].label}{payrollRun.stages[stageCurrentIdx].due ? ` due ${payrollRun.stages[stageCurrentIdx].due.split(" ").slice(0,2).join(" ")}` : ""}</span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Net to pay",  value: "AED " + (payrollRun.netPay / 1000).toFixed(1) + "K" },
                  { label: "Bonuses & OT", value: "AED " + (payrollRun.bonuses / 1000).toFixed(0) + "K" },
                ].map(item => (
                  <div key={item.label} style={{ padding: "8px 10px", background: "var(--ink-50)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--fg-1)", marginTop: 2 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-foot">
              <span style={{ fontSize: 12, color: "var(--fg-3)" }}>
                {(payrollRun.flags || []).length} flag{(payrollRun.flags || []).length !== 1 ? "s" : ""} need review
              </span>
              <Button variant="primary" size="sm" onClick={() => onNav && onNav("payroll")}>Open payroll</Button>
            </div>
          </div>
        )}

        {/* Hiring pipeline */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title-lg">Hiring pipeline</div>
              <div className="card-sub">
                {openings.length} open role{openings.length !== 1 ? "s" : ""} · {openings.reduce((s, o) => s + (o.applicants || 0), 0)} candidates
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNav && onNav("recruit")} iconRight="arrow-right">Open</Button>
          </div>
          <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
            {openings.slice(0, 5).map(o => {
              const maxApplicants = Math.max(...openings.map(x => x.applicants || 0), 1);
              return (
                <div key={o.jobId} className="list-item">
                  <div className="icon-wrap brand"><Icon name="briefcase" size={13} /></div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="ttl">{o.role}</div>
                    <div className="sub">{o.dept} · {o.location}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg-1)", fontFamily: "var(--font-mono)" }}>
                      {o.applicants || 0}
                    </div>
                    <div style={{ width: 44, height: 3, background: "var(--ink-100)", borderRadius: 999, marginTop: 4, overflow: "hidden" }}>
                      <div style={{ width: ((o.applicants || 0) / maxApplicants * 100) + "%", height: "100%", background: "var(--brand-burgundy)", borderRadius: 999 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Project locations map ── */}
      <ProjectsMap projects={projects} onNav={onNav} />

      {/* ── Departments + Activity & Events ── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>

        {/* Departments table */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title-lg">Departments</div>
              <div className="card-sub">Headcount and workforce share</div>
            </div>
            <Button variant="ghost" size="sm" icon="git-branch" onClick={() => onNav && onNav("org")}>Org chart</Button>
          </div>
          <div style={{ padding: "0 4px 4px" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Lead</th>
                  <th style={{ textAlign: "right" }}>Count</th>
                  <th>Share</th>
                  <th style={{ textAlign: "right" }}>Avg tenure</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(d => {
                  const pct = company.headcount > 0 ? (d.count / company.headcount) * 100 : 0;
                  const tenures = { ops:"3.2y", war:"2.4y", fle:"2.1y", fin:"3.8y", hr:"4.1y", sal:"2.9y", tec:"1.9y", leg:"5.4y" };
                  return (
                    <tr key={d.deptId} onClick={() => onNav && onNav("people")} style={{ cursor: "pointer" }}>
                      <td>
                        <div className="row" style={{ gap: 10, alignItems: "center" }}>
                          <span style={{ width: 3, height: 20, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                          <span className="cell-strong">{d.name}</span>
                        </div>
                      </td>
                      <td className="cell-muted" style={{ fontSize: 12 }}>{d.lead}</td>
                      <td className="cell-mono" style={{ textAlign: "right", fontWeight: 600 }}>{d.count}</td>
                      <td>
                        <div className="row" style={{ gap: 8, alignItems: "center" }}>
                          <div style={{ flex: 1, height: 5, background: "var(--ink-100)", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ width: pct + "%", height: "100%", background: d.color, borderRadius: 999 }} />
                          </div>
                          <span className="cell-mono cell-muted" style={{ width: 36, textAlign: "right", fontSize: 11 }}>{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="cell-mono cell-muted" style={{ textAlign: "right" }}>{tenures[d.deptId] || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity + Upcoming */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Activity feed */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-head">
              <div>
                <div className="card-title-lg">Activity</div>
                <div className="card-sub">Recent events across HR</div>
              </div>
              <Button variant="ghost" size="sm" icon="filter" />
            </div>
            <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
              {(activity || []).map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 11, padding: "8px 0", position: "relative" }}>
                  {i < activity.length - 1 && (
                    <div style={{ position: "absolute", left: 15, top: 34, bottom: -8, width: 1, background: "var(--border-subtle)", zIndex: 0 }} />
                  )}
                  <div className={"icon-wrap " + a.kind} style={{ flexShrink: 0, zIndex: 1 }}>
                    <Icon name={a.icon} size={13} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12.5, lineHeight: 1.4, color: "var(--fg-1)" }}>
                      <span style={{ fontWeight: 600 }}>{a.who}</span>{" "}
                      <span style={{ color: "var(--fg-2)", fontWeight: 400 }}>{a.what}</span>
                    </div>
                    <div className="sub" style={{ marginTop: 2 }}>{a.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming events */}
          {upcomingEvents.length > 0 && (
            <div className="card">
              <div className="card-head" style={{ paddingBottom: 10 }}>
                <div>
                  <div className="card-title-lg">Upcoming</div>
                  <div className="card-sub">Rest of {MONTH_NAMES[today.getMonth()]}</div>
                </div>
              </div>
              <div className="card-pad" style={{ paddingTop: 4, paddingBottom: 8 }}>
                {upcomingEvents.map((e, i) => (
                  <div key={i} className="list-item" style={{ gap: 10, paddingTop: 7, paddingBottom: 7 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: e.kind === "holiday" ? "var(--plum-50)" : "var(--info-50)",
                      border: "1px solid " + (e.kind === "holiday" ? "var(--plum-100)" : "var(--info-100)"),
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1, color: e.kind === "holiday" ? "var(--brand-burgundy)" : "var(--info-700)" }}>{e.day}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {MONTH_NAMES[today.getMonth()]}
                      </div>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)" }}>{e.label}</div>
                      <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 1, textTransform: "capitalize" }}>{e.kind}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DashboardPage });
