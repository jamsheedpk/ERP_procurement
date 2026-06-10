import React from "react";
import { Icon, Avatar, AvatarRow, Chip, Button, IconButton, KPI, Meter, Segmented, Tabs, Card } from "../legacy.jsx";
import "../setup.js";
const {
  useState:    useStateR,
  useMemo:     useMemoR,
  useEffect:   useEffectR,
  useCallback: useCallbackR,
} = React;

const STAGES = [
  { id: "applied",   label: "Applied",      color: "#A89DA3" },
  { id: "screen",    label: "Phone screen", color: "#2563B0" },
  { id: "interview", label: "Interview",    color: "#534AB7" },
  { id: "offer",     label: "Offer",        color: "#D78A14" },
  { id: "hired",     label: "Hired",        color: "#1F8A52" },
];

const SOURCE_META = {
  "LinkedIn":    { bg: "#DBEAFE", fg: "#1D4ED8" },
  "Referral":    { bg: "#D1FAE5", fg: "#065F46" },
  "Career site": { bg: "#EDE9FE", fg: "#5B21B6" },
  "Job board":   { bg: "#FEF3C7", fg: "#92400E" },
  "Agency":      { bg: "#F3F4F6", fg: "#374151" },
  "Other":       { bg: "#F3F4F6", fg: "#374151" },
};

const AV_COLORS = [
  { bg: "#F4DDE8", fg: "#6F1947" }, { bg: "#E8F5EE", fg: "#136138" },
  { bg: "#E8EFF8", fg: "#163E73" }, { bg: "#FCF2E1", fg: "#8B560A" },
];

function deptIcon(dept) {
  if (!dept) return "briefcase";
  const d = dept.toLowerCase();
  if (d.includes("tech") || d.includes("eng") || d.includes("dev")) return "code-2";
  if (d.includes("fin") || d.includes("account")) return "bar-chart-2";
  if (d.includes("hr") || d.includes("people")) return "users";
  if (d.includes("log") || d.includes("ops") || d.includes("fleet")) return "truck";
  if (d.includes("sales") || d.includes("revenue")) return "trending-up";
  if (d.includes("market") || d.includes("brand")) return "megaphone";
  if (d.includes("legal") || d.includes("compli")) return "shield";
  if (d.includes("data") || d.includes("analyt")) return "database";
  if (d.includes("product") || d.includes("design")) return "layers";
  return "briefcase";
}

function stageCounts(cands) {
  const c = { applied: 0, screen: 0, interview: 0, offer: 0, hired: 0, rejected: 0 };
  cands.forEach(x => { if (c[x.stage] !== undefined) c[x.stage]++; });
  return c;
}

// ── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating, size = 12, onClick }) {
  return (
    <div className="row-tight" style={{ gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ cursor: onClick ? "pointer" : "default" }}
          onClick={() => onClick && onClick(i + 1)}>
          <Icon name="star" size={size}
            color={i < (rating || 0) ? "#D78A14" : "var(--ink-300)"}
            stroke={i < (rating || 0) ? 0 : 1.8} />
        </span>
      ))}
    </div>
  );
}

// ── Candidate detail drawer ───────────────────────────────────────────────────
function CandidateDrawer({ cand, job, onClose, onMoveStage, onReject, onDelete, onRate, onSaveNotes }) {
  const [notes,      setNotes]      = useStateR(cand.notes || "");
  const [notesSaved, setNotesSaved] = useStateR(false);

  const stgIdx    = STAGES.findIndex(s => s.id === cand.stage);
  const stg       = STAGES[stgIdx];
  const nextStage = STAGES[stgIdx + 1];
  const prevStage = STAGES[stgIdx - 1];
  const srcMeta   = SOURCE_META[cand.source] || SOURCE_META["Other"];

  const saveNotes = async () => {
    await onSaveNotes(cand, notes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  return (
    <div className="cand-drawer">
      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--ink-100)", display: "flex", gap: 14, alignItems: "flex-start", flexShrink: 0 }}>
        <Avatar name={cand.name} color={cand.av} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{cand.name}</div>
          <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 8 }}>
            {cand.location}{cand.exp ? " · " + cand.exp + "y exp" : ""}
          </div>
          <Stars rating={cand.rating} size={15} onClick={(r) => onRate(cand, r)} />
        </div>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Stage + source badges */}
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <span style={{
            padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: stg ? stg.color + "20" : "var(--ink-100)",
            color: stg?.color || "var(--fg-2)",
            border: `1px solid ${stg ? stg.color + "55" : "transparent"}`,
          }}>{stg?.label || cand.stage}</span>
          <span className="kcard-src" style={{ background: srcMeta.bg, color: srcMeta.fg, padding: "4px 10px" }}>
            {cand.source}
          </span>
          <span className="text-mono muted" style={{ fontSize: 11, marginLeft: "auto", alignSelf: "center" }}>
            {cand.candidateId || cand.id}
          </span>
        </div>

        {/* Pipeline progress bar */}
        <div>
          <div className="label" style={{ marginBottom: 10 }}>Pipeline stage</div>
          <div className="row" style={{ gap: 0, alignItems: "center" }}>
            {STAGES.map((s, i) => (
              <React.Fragment key={s.id}>
                <div title={s.label} style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: i <= stgIdx ? s.color : "var(--ink-100)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: i === stgIdx ? `2.5px solid ${s.color}` : "none",
                  boxShadow: i === stgIdx ? `0 0 0 3px ${s.color}22` : "none",
                }}>
                  {i < stgIdx
                    ? <Icon name="check" size={11} color="#fff" stroke={2.5} />
                    : <span style={{ fontSize: 9.5, fontWeight: 700, color: i <= stgIdx ? "#fff" : "var(--fg-4)" }}>{i + 1}</span>
                  }
                </div>
                {i < STAGES.length - 1 && (
                  <div style={{ flex: 1, height: 3, background: i < stgIdx ? "var(--brand-burgundy)" : "var(--ink-200)", borderRadius: 2 }} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="row" style={{ marginTop: 5, gap: 0 }}>
            {STAGES.map(s => (
              <div key={s.id} style={{ flex: 1, fontSize: 9, textAlign: "center", color: "var(--fg-4)", fontWeight: 500 }}>
                {s.label.split(" ")[0]}
              </div>
            ))}
          </div>
        </div>

        {/* Metadata */}
        <div className="attr-grid">
          {cand.email && <div className="attr"><div className="k">Email</div><div className="v">{cand.email}</div></div>}
          <div className="attr"><div className="k">Applied</div><div className="v mono">{cand.applied}</div></div>
          <div className="attr"><div className="k">Experience</div><div className="v">{cand.exp} years</div></div>
          {job && <div className="attr"><div className="k">Role</div><div className="v">{job.role}</div></div>}
        </div>

        {/* Skills */}
        {(cand.tags || []).length > 0 && (
          <div>
            <div className="label" style={{ marginBottom: 8 }}>Skills</div>
            <div className="row-tight" style={{ gap: 6, flexWrap: "wrap" }}>
              {(cand.tags || []).map((t, i) => <span key={i} className="tag">{t}</span>)}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <div className="label" style={{ marginBottom: 8 }}>Interview notes</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            rows={5} className="fi"
            placeholder="Add interview feedback, observations…"
            style={{ resize: "vertical", fontSize: 12.5, lineHeight: 1.6 }}
          />
          <div className="row" style={{ justifyContent: "flex-end", marginTop: 6 }}>
            <Button variant="ghost" size="sm" icon={notesSaved ? "check" : "save"} onClick={saveNotes}>
              {notesSaved ? "Saved!" : "Save notes"}
            </Button>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="drawer-foot" style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--ink-100)" }}>
        <Button variant="ghost" size="sm" icon="trash-2" onClick={() => onDelete(cand)}>Remove</Button>
        <div className="row" style={{ gap: 6 }}>
          {prevStage && (
            <Button variant="secondary" size="sm" icon="arrow-left" onClick={() => onMoveStage(cand, prevStage.id)}>
              {prevStage.label}
            </Button>
          )}
          {nextStage ? (
            <Button variant="primary" size="sm" iconRight="arrow-right" onClick={() => onMoveStage(cand, nextStage.id)}>
              {nextStage.label}
            </Button>
          ) : (
            <Button variant="danger" size="sm" icon="x" onClick={() => { onReject(cand); onClose(); }}>
              Reject
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stat pill ────────────────────────────────────────────────────────────────
function Stat({ lbl, val, hi }) {
  return (
    <div style={{ minWidth: 64 }}>
      <div className="muted" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{lbl}</div>
      <div className="text-mono" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: hi ? "var(--success-700)" : "var(--fg-1)" }}>{val}</div>
    </div>
  );
}

// ── Main RecruitmentPage ──────────────────────────────────────────────────────
function RecruitmentPage({ data, onAdd, onUpdate }) {
  // ── Self-fetched state ──
  const [openings,    setOpenings]    = useStateR([]);
  const [candidates,  setCandidates]  = useStateR([]);
  const [job,         setJob]         = useStateR(null);
  const [loading,     setLoading]     = useStateR(true);
  const [candLoading, setCandLoading] = useStateR(false);

  // ── UI state ──
  const [view,              setView]              = useStateR("pipeline");
  const [search,            setSearch]            = useStateR("");
  const [stageFilter,       setStageFilter]       = useStateR("all");
  const [sourceFilter,      setSourceFilter]      = useStateR("all");
  const [showNewRole,       setShowNewRole]       = useStateR(false);
  const [addCandStage,      setAddCandStage]      = useStateR(null);
  const [selectedCand,      setSelectedCand]      = useStateR(null);

  // ── Fetch openings on mount ──
  useEffectR(() => {
    fetch(`${API}/openings`)
      .then(r => r.json())
      .then(docs => {
        const norm = docs.map(o => ({ ...o, id: o.jobId }));
        setOpenings(norm);
        const initial = norm.find(o => o.jobId === "JOB-121") || norm[0] || null;
        setJob(initial);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Fetch candidates when job changes ──
  const jobKey = job?.jobId || job?.id || "";
  useEffectR(() => {
    if (!jobKey) return;
    setCandLoading(true);
    setSelectedCand(null);
    setSearch(""); setStageFilter("all"); setSourceFilter("all");
    fetch(`${API}/candidates?jobId=${jobKey}`)
      .then(r => r.json())
      .then(docs => {
        setCandidates(docs.map(c => ({ ...c, id: c.candidateId })));
        setCandLoading(false);
      })
      .catch(() => setCandLoading(false));
  }, [jobKey]);

  // ── Derived ──
  const counts = useMemoR(() => stageCounts(candidates), [candidates]);

  const funnelData = useMemoR(() =>
    STAGES.map((stg, i) => {
      const count     = counts[stg.id] || 0;
      const prevCount = i === 0 ? candidates.length : (counts[STAGES[i - 1].id] || 0);
      const pct = i > 0 && prevCount > 0 ? Math.round((count / prevCount) * 100) : null;
      return { ...stg, count, pct };
    }),
    [counts, candidates]
  );

  const filtered = useMemoR(() => candidates.filter(c => {
    if (c.stage === "rejected") return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (stageFilter  !== "all" && c.stage  !== stageFilter)  return false;
    if (sourceFilter !== "all" && c.source !== sourceFilter) return false;
    return true;
  }), [candidates, search, stageFilter, sourceFilter]);

  const uniqueSources = useMemoR(() =>
    [...new Set(candidates.map(c => c.source).filter(Boolean))].sort(),
    [candidates]
  );

  // ── API helpers ──
  const patchCand = async (cid, body) => {
    const key = Object.keys(body)[0];
    const res = await fetch(`${API}/candidates/${cid}/${key}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const applyCand = (updated) => {
    setCandidates(prev => prev.map(c =>
      (c.candidateId || c.id) === updated.candidateId ? { ...updated, id: updated.candidateId } : c
    ));
    if ((selectedCand?.candidateId || selectedCand?.id) === updated.candidateId) {
      setSelectedCand({ ...updated, id: updated.candidateId });
    }
    onUpdate && onUpdate("candidate", { ...updated, id: updated.candidateId });
  };

  // ── Sync opening stage counts from DB after any candidate mutation ──
  const syncOpeningCounts = useCallbackR(async (jobId) => {
    if (!jobId) return;
    try {
      const res = await fetch(`${API}/openings/${jobId}/counts`, { method: "PATCH" });
      if (!res.ok) return;
      const upd = await res.json();
      setOpenings(prev => prev.map(o => (o.jobId || o.id) === jobId ? { ...upd, id: upd.jobId } : o));
    } catch {}
  }, []);

  // ── Stage move ──
  const moveStage = useCallbackR(async (cand, newStage) => {
    const cid = cand.candidateId || cand.id;
    const jid = job?.jobId || job?.id;
    setCandidates(prev => prev.map(c => (c.candidateId || c.id) === cid ? { ...c, stage: newStage } : c));
    if ((selectedCand?.candidateId || selectedCand?.id) === cid) {
      setSelectedCand(p => ({ ...p, stage: newStage }));
    }
    try {
      const updated = await patchCand(cid, { stage: newStage });
      applyCand(updated);
      syncOpeningCounts(jid);
    } catch {
      setCandidates(prev => prev.map(c => (c.candidateId || c.id) === cid ? { ...c, stage: cand.stage } : c));
    }
  }, [selectedCand, onUpdate, job, syncOpeningCounts]);

  // ── Reject ──
  const rejectCandidate = useCallbackR((cand) => moveStage(cand, "rejected"), [moveStage]);

  // ── Delete ──
  const deleteCandidate = useCallbackR(async (cand) => {
    if (!confirm(`Remove ${cand.name} from the pipeline?`)) return;
    const cid = cand.candidateId || cand.id;
    const jid = job?.jobId || job?.id;
    setCandidates(prev => prev.filter(c => (c.candidateId || c.id) !== cid));
    if ((selectedCand?.candidateId || selectedCand?.id) === cid) setSelectedCand(null);
    fetch(`${API}/candidates/${cid}`, { method: "DELETE" })
      .then(() => syncOpeningCounts(jid))
      .catch(() => { setCandidates(prev => [...prev, cand]); });
  }, [selectedCand, job, syncOpeningCounts]);

  // ── Rating ──
  const updateRating = useCallbackR(async (cand, rating) => {
    const cid = cand.candidateId || cand.id;
    setCandidates(prev => prev.map(c => (c.candidateId || c.id) === cid ? { ...c, rating } : c));
    if ((selectedCand?.candidateId || selectedCand?.id) === cid) setSelectedCand(p => ({ ...p, rating }));
    patchCand(cid, { rating }).catch(() => {});
  }, [selectedCand]);

  // ── Notes ──
  const updateNotes = useCallbackR(async (cand, notes) => {
    const cid = cand.candidateId || cand.id;
    setCandidates(prev => prev.map(c => (c.candidateId || c.id) === cid ? { ...c, notes } : c));
    patchCand(cid, { notes }).catch(() => {});
  }, []);

  // ── Close / reopen role ──
  const handleCloseRole = useCallbackR(async () => {
    if (!job) return;
    const jid = job.jobId || job.id;
    const newStatus = job.status === "closed" ? "open" : "closed";
    if (newStatus === "closed" && !confirm(`Close role "${job.role}"? It will no longer appear as active.`)) return;
    const updated = { ...job, status: newStatus };
    setJob(updated);
    setOpenings(prev => prev.map(o => (o.jobId || o.id) === jid ? updated : o));
    fetch(`${API}/openings/${jid}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => setJob(job));
  }, [job]);

  // ── Add role ──
  const handleAddRole = (item) => {
    const norm = { ...item, id: item.jobId };
    setOpenings(prev => [norm, ...prev]);
    setJob(norm);
    onAdd && onAdd("opening", norm);
    setShowNewRole(false);
  };

  // ── Add candidate ──
  const handleAddCandidate = (item) => {
    const norm = { ...item, id: item.candidateId };
    setCandidates(prev => [norm, ...prev]);
    onAdd && onAdd("candidate", norm);
    setAddCandStage(null);
    syncOpeningCounts(item.jobId);
  };

  if (loading) return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
      <div style={{ width: 32, height: 32, border: "3px solid var(--plum-100)", borderTopColor: "var(--brand-burgundy)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!job && !loading) return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">People · Recruitment</div>
          <h1 className="page-title">Hiring pipeline</h1>
          <div className="page-sub">No open roles yet. Create your first role to get started.</div>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setShowNewRole(true)}>New role</Button>
      </div>
      {showNewRole && <NewRoleModal onClose={() => setShowNewRole(false)} onSave={handleAddRole} />}
    </div>
  );

  const totalCands = openings.reduce((s, o) => s + (o.applicants || 0), 0);

  return (
    <div className="page">

      <div className="page-head">
        <div>
          <div className="eyebrow">People · Recruitment</div>
          <h1 className="page-title">Hiring pipeline</h1>
          <div className="page-sub">
            {openings.length} open roles · {totalCands} candidates in flight
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Button variant="secondary" icon="share-2">Share career site</Button>
          <Button variant="secondary" icon="users">Talent pool</Button>
          <Button variant="primary" icon="plus" onClick={() => setShowNewRole(true)}>New role</Button>
        </div>
      </div>

      {/* ── Roles strip ── */}
      <div className="scroll-x" style={{ marginBottom: 22, paddingBottom: 4 }}>
        <div className="row" style={{ gap: 12, minWidth: "max-content" }}>
          {openings.map(o => {
            const jid      = o.jobId || o.id;
            const isActive = (job?.jobId || job?.id) === jid;
            const total    = Object.values(o.stage || {}).reduce((s, v) => s + v, 0);
            const segs     = STAGES.map(s => ({ key: s.label, value: o.stage?.[s.id] || 0, color: s.color }));
            return (
              <div key={jid} onClick={() => setJob(o)}
                className={"card rec-job-card"
                  + (isActive ? " rec-job-card--active" : "")
                  + (o.status === "closed" ? " rec-job-card--closed" : "")}>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 6, alignItems: "flex-start" }}>
                  <span className="text-mono muted" style={{ fontSize: 10.5 }}>{jid}</span>
                  <div className="row" style={{ gap: 4 }}>
                    {o.status === "closed" && <Chip kind="danger" dot={false}>Closed</Chip>}
                    <Chip kind="default" dot={false}>{o.type}</Chip>
                  </div>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)", lineHeight: 1.3, marginBottom: 2 }}>{o.role}</div>
                <div className="muted" style={{ fontSize: 11.5, marginBottom: 12 }}>{o.dept} · {o.location}</div>
                <div className="meter-multi" style={{ marginBottom: 10 }}>
                  {total > 0
                    ? segs.map((s, i) => (
                        <span key={i} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} title={`${s.key}: ${s.value}`} />
                      ))
                    : <span style={{ width: "100%", background: "var(--ink-200)" }} />
                  }
                </div>
                <div className="row" style={{ justifyContent: "space-between", fontSize: 11.5 }}>
                  <span className="muted">{o.applicants} candidates</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: (o.stage?.hired || 0) > 0 ? "var(--success-700)" : "var(--fg-3)", fontWeight: 600 }}>
                    {o.stage?.hired || 0} hired
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Job header card ── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-pad" style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div className="rec-job-icon">
            <Icon name={deptIcon(job.dept)} size={26} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row" style={{ gap: 10, alignItems: "center", marginBottom: 3 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{job.role}</h2>
              <span className="text-mono muted" style={{ fontSize: 12 }}>{job.jobId || job.id}</span>
              <Chip kind={job.status === "closed" ? "danger" : "success"}>
                {job.status === "closed" ? "Closed" : "Open"}
              </Chip>
            </div>
            <div className="muted" style={{ fontSize: 12.5 }}>
              {job.dept} · {job.location} · {job.type} · posted {job.posted}
            </div>
          </div>
          <div className="row" style={{ gap: 20 }}>
            <Stat lbl="Applicants"  val={candLoading ? "…" : candidates.length} />
            <Stat lbl="In progress" val={candLoading ? "…" : (counts.screen || 0) + (counts.interview || 0)} />
            <Stat lbl="Time to hire" val="38d" />
            <Stat lbl="Hired"       val={candLoading ? "…" : counts.hired || 0} hi />
          </div>
          <div className="row" style={{ gap: 6 }}>
            <Button variant="secondary" size="sm"
              icon={job.status === "closed" ? "play" : "x-circle"}
              onClick={handleCloseRole}>
              {job.status === "closed" ? "Reopen role" : "Close role"}
            </Button>
            <Button variant="primary" size="sm" icon="user-plus" onClick={() => setAddCandStage("applied")}>
              Add candidate
            </Button>
          </div>
        </div>
      </div>

      {/* ── Funnel strip ── */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-pad" style={{ padding: "14px 20px" }}>
          {candLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 12.5 }}>
              <div style={{ width: 16, height: 16, border: "2px solid var(--plum-100)", borderTopColor: "var(--brand-burgundy)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Loading candidates…
            </div>
          ) : (
            <div className="rec-funnel">
              {funnelData.map((stg, i) => (
                <React.Fragment key={stg.id}>
                  <div className="rec-funnel-step"
                    style={{ cursor: "pointer", borderRadius: 6, padding: "4px 6px", background: stageFilter === stg.id ? stg.color + "15" : "transparent" }}
                    onClick={() => setStageFilter(prev => prev === stg.id ? "all" : stg.id)}
                    title="Click to filter by stage"
                  >
                    <div className="rec-funnel-count" style={{ color: stg.color }}>{stg.count}</div>
                    <div className="rec-funnel-label">
                      <span className="rec-funnel-dot" style={{ background: stg.color }} />
                      {stg.label}
                    </div>
                  </div>
                  {i < funnelData.length - 1 && (
                    <div className="rec-funnel-arrow">
                      <Icon name="chevron-right" size={14} color="var(--ink-300)" />
                      {funnelData[i + 1].pct !== null && (
                        <div className="rec-funnel-pct">{funnelData[i + 1].pct}%</div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="row" style={{ marginBottom: 14, gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <Segmented value={view} onChange={setView} options={[
            { value: "pipeline", label: "Pipeline" },
            { value: "list",     label: "List" },
          ]} />
          <div className="search" style={{ width: 220 }}>
            <Icon name="search" size={13} color="var(--fg-3)" />
            <input placeholder="Search candidates…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {uniqueSources.length > 1 && (
            <select className="fi" style={{ width: 140, fontSize: 12, padding: "4px 24px 4px 8px", height: 30 }}
              value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
              <option value="all">All sources</option>
              {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {(stageFilter !== "all" || sourceFilter !== "all" || search) && (
            <button onClick={() => { setStageFilter("all"); setSourceFilter("all"); setSearch(""); }}
              style={{ padding: "4px 10px", fontSize: 11.5, borderRadius: 12, border: "1px solid var(--ink-200)", background: "transparent", cursor: "pointer", color: "var(--fg-3)" }}>
              Clear filters ✕
            </button>
          )}
        </div>
        <span className="muted" style={{ fontSize: 12, alignSelf: "center" }}>
          {filtered.length} of {candidates.filter(c => c.stage !== "rejected").length} candidates
        </span>
      </div>

      {/* ── Kanban ── */}
      {view === "pipeline" && (
        <div className="kanban">
          {STAGES.map(stg => {
            const items     = filtered.filter(c => c.stage === stg.id);
            const nextStage = STAGES[STAGES.findIndex(s => s.id === stg.id) + 1];
            return (
              <div key={stg.id} className="kcol" style={{ borderTop: `3px solid ${stg.color}` }}>
                <div className="kcol-head">
                  <div className="ttl">
                    <span className="swatch" style={{ background: stg.color }} />
                    {stg.label}
                  </div>
                  <span className="ct" style={{ borderColor: stg.color + "55", color: stg.color }}>{items.length}</span>
                </div>

                {items.map(c => {
                  const cIdx    = STAGES.findIndex(s => s.id === c.stage);
                  const srcMeta = SOURCE_META[c.source] || SOURCE_META["Other"];
                  const isSel   = (selectedCand?.candidateId || selectedCand?.id) === (c.candidateId || c.id);
                  return (
                    <div key={c.candidateId || c.id}
                      className={"kcard" + (isSel ? " kcard--selected" : "")}
                      style={{ borderLeft: `3px solid ${stg.color}`, cursor: "pointer" }}
                      onClick={() => setSelectedCand(isSel ? null : c)}
                    >
                      <div className="row" style={{ alignItems: "flex-start", gap: 10 }}>
                        <Avatar name={c.name} color={c.av} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="role">{c.name}</div>
                          <div className="meta">
                            <Icon name="map-pin" size={11} /> {c.location || "—"}
                            {c.exp > 0 && <><span className="muted">·</span><span>{c.exp}y exp</span></>}
                          </div>
                        </div>
                        {c.rating > 0 && <Stars rating={c.rating} size={10} />}
                      </div>

                      {(c.tags || []).length > 0 && (
                        <div className="row-tight" style={{ marginTop: 8, gap: 5, flexWrap: "wrap" }}>
                          {(c.tags || []).slice(0, 3).map((t, i) => <span key={i} className="tag">{t}</span>)}
                        </div>
                      )}

                      <div className="kcard-foot">
                        <span className="kcard-src" style={{ background: srcMeta.bg, color: srcMeta.fg }}>{c.source}</span>
                        <div className="kcard-stage-dots">
                          {STAGES.map((s, i) => (
                            <span key={s.id} className="kcard-stage-dot"
                              style={{ background: i <= cIdx ? s.color : "var(--ink-200)" }} />
                          ))}
                        </div>
                      </div>

                      {nextStage && (
                        <button className="btn btn-ghost kcard-advance"
                          onClick={e => { e.stopPropagation(); moveStage(c, nextStage.id); }}>
                          <Icon name="arrow-right" size={12} stroke={2} /> Move to {nextStage.label}
                        </button>
                      )}
                    </div>
                  );
                })}

                {items.length === 0 && (
                  <div className="kcol-empty">
                    <Icon name="inbox" size={20} color="var(--ink-300)" />
                    <div>No candidates</div>
                  </div>
                )}

                <button className="btn btn-ghost" style={{ justifyContent: "center", marginTop: 4, fontSize: 12 }}
                  onClick={() => setAddCandStage(stg.id)}>
                  <Icon name="plus" size={13} stroke={2} /> Add candidate
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── List view ── */}
      {view === "list" && (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Stage</th>
                <th>Source</th>
                <th>Skills</th>
                <th>Applied</th>
                <th>Rating</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const stg       = STAGES.find(s => s.id === c.stage);
                const stgIdx    = STAGES.findIndex(s => s.id === c.stage);
                const nextStage = STAGES[stgIdx + 1];
                const srcMeta   = SOURCE_META[c.source] || SOURCE_META["Other"];
                return (
                  <tr key={c.candidateId || c.id}
                    style={{ cursor: "pointer", background: (selectedCand?.candidateId || selectedCand?.id) === (c.candidateId || c.id) ? "var(--plum-50)" : undefined }}
                    onClick={() => setSelectedCand(c)}
                  >
                    <td><AvatarRow name={c.name} sub={(c.location || "") + (c.exp ? " · " + c.exp + "y exp" : "")} color={c.av} /></td>
                    <td>
                      <span className="kcard-src" style={{ background: stg ? stg.color + "22" : undefined, color: stg?.color, border: `1px solid ${stg ? stg.color + "55" : "transparent"}` }}>
                        {stg?.label || c.stage}
                      </span>
                    </td>
                    <td><span className="kcard-src" style={{ background: srcMeta.bg, color: srcMeta.fg }}>{c.source}</span></td>
                    <td>
                      <div className="row-tight" style={{ gap: 4, flexWrap: "wrap" }}>
                        {(c.tags || []).slice(0, 3).map((t, i) => <span key={i} className="tag">{t}</span>)}
                        {(c.tags || []).length > 3 && <span className="muted" style={{ fontSize: 11 }}>+{c.tags.length - 3}</span>}
                      </div>
                    </td>
                    <td className="cell-mono">{c.applied}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <Stars rating={c.rating} size={12} onClick={(r) => updateRating(c, r)} />
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      {nextStage ? (
                        <Button variant="ghost" size="sm" iconRight="arrow-right" onClick={() => moveStage(c, nextStage.id)}>
                          {nextStage.label}
                        </Button>
                      ) : <Chip kind="success" dot={false}>Hired</Chip>}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px 0", color: "var(--fg-4)", fontSize: 13 }}>
                    No candidates match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Candidate detail drawer ── */}
      {selectedCand && (
        <CandidateDrawer
          cand={selectedCand}
          job={job}
          onClose={() => setSelectedCand(null)}
          onMoveStage={moveStage}
          onReject={rejectCandidate}
          onDelete={deleteCandidate}
          onRate={updateRating}
          onSaveNotes={updateNotes}
        />
      )}

      {/* ── Modals ── */}
      {showNewRole && <NewRoleModal onClose={() => setShowNewRole(false)} onSave={handleAddRole} />}
      {addCandStage !== null && (
        <AddCandidateModal
          jobId={job.jobId || job.id}
          role={job.role}
          defaultStage={addCandStage}
          onClose={() => setAddCandStage(null)}
          onSave={handleAddCandidate}
        />
      )}
    </div>
  );
}

// ── New Role Modal ────────────────────────────────────────────────────────────
function NewRoleModal({ onClose, onSave }) {
  const [form,   setForm]   = useStateR({ role: "", dept: "", type: "Full-time", location: "" });
  const [saving, setSaving] = useStateR(false);
  const [err,    setErr]    = useStateR("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.role.trim()) { setErr("Role title is required."); return; }
    setSaving(true); setErr("");
    const body = {
      jobId:      "JOB-" + (200 + Math.floor(Math.random() * 799)),
      role:       form.role.trim(),
      dept:       form.dept.trim(),
      type:       form.type,
      location:   form.location.trim(),
      posted:     new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      applicants: 0,
      stage:      { applied: 0, screen: 0, interview: 0, offer: 0, hired: 0 },
      status:     "open",
    };
    try {
      const res = await fetch(`${API}/openings`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      onSave({ ...saved, id: saved.jobId });
    } catch (e) { setErr(e.message || "Failed to create role."); setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-head-icon"><Icon name="briefcase" size={18} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-title">Open new role</div>
            <div className="modal-subtitle">Create a new job opening for your team.</div>
          </div>
          <button className="icon-btn modal-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body stack" style={{ gap: 14 }}>
          <div className="form-group">
            <label className="label">Role title <span className="req">*</span></label>
            <input className="fi" autoFocus value={form.role}
              onChange={e => { set("role", e.target.value); err && setErr(""); }}
              placeholder="e.g. Senior Data Analyst" />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="label">Department</label>
              <input className="fi" value={form.dept} onChange={e => set("dept", e.target.value)} placeholder="e.g. Finance" />
            </div>
            <div className="form-group">
              <label className="label">Employment type</label>
              <select className="fi" value={form.type} onChange={e => set("type", e.target.value)}>
                {["Full-time","Part-time","Contract","Internship"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="label">Location</label>
            <input className="fi" value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. DIFC Office / Remote" />
          </div>
          {err && <div className="form-err"><Icon name="alert-circle" size={15} color="var(--danger-700)" />{err}</div>}
        </div>
        <div className="modal-foot">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="plus" onClick={handleSubmit} disabled={saving || !form.role}>
            {saving ? "Creating…" : "Create role"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Add Candidate Modal ───────────────────────────────────────────────────────
function AddCandidateModal({ jobId, role, defaultStage, onClose, onSave }) {
  const [form,   setForm]   = useStateR({
    name: "", email: "", location: "", exp: "", source: "LinkedIn",
    stage: defaultStage || "applied", tags: "",
  });
  const [saving, setSaving] = useStateR(false);
  const [err,    setErr]    = useStateR("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setErr("Candidate name is required."); return; }
    setSaving(true); setErr("");
    const body = {
      candidateId: "C-" + (8000 + Math.floor(Math.random() * 999)),
      jobId, role,
      name:     form.name.trim(),
      email:    form.email.toLowerCase().trim(),
      location: form.location.trim(),
      exp:      parseInt(form.exp) || 0,
      source:   form.source,
      stage:    form.stage,
      rating:   0,
      applied:  new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      tags:     form.tags.split(",").map(t => t.trim()).filter(Boolean),
      av:       AV_COLORS[Math.floor(Math.random() * AV_COLORS.length)],
    };
    try {
      const res = await fetch(`${API}/candidates`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      onSave({ ...saved, id: saved.candidateId });
    } catch (e) { setErr(e.message || "Failed to add candidate."); setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-head-icon"><Icon name="user-plus" size={18} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-title">Add candidate</div>
            <div className="modal-subtitle">{role ? `For: ${role}` : "Add a new candidate to the pipeline."}</div>
          </div>
          <button className="icon-btn modal-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body stack" style={{ gap: 14 }}>
          <div className="form-group">
            <label className="label">Full name <span className="req">*</span></label>
            <input className="fi" autoFocus value={form.name}
              onChange={e => { set("name", e.target.value); err && setErr(""); }}
              placeholder="Candidate's full name" />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="label">Email</label>
              <input className="fi" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="form-group">
              <label className="label">Location</label>
              <input className="fi" value={form.location} onChange={e => set("location", e.target.value)} placeholder="City / Country" />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="label">Years of experience</label>
              <input className="fi" type="number" min="0" value={form.exp} onChange={e => set("exp", e.target.value)} placeholder="e.g. 5" />
            </div>
            <div className="form-group">
              <label className="label">Source</label>
              <select className="fi" value={form.source} onChange={e => set("source", e.target.value)}>
                {["LinkedIn","Referral","Career site","Job board","Agency","Other"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="label">Pipeline stage</label>
            <select className="fi" value={form.stage} onChange={e => set("stage", e.target.value)}>
              {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Skills / tags <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400, color: "var(--fg-3)" }}>(comma-separated)</span></label>
            <input className="fi" value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="e.g. React, TypeScript, Leadership" />
          </div>
          {err && <div className="form-err"><Icon name="alert-circle" size={15} color="var(--danger-700)" />{err}</div>}
        </div>
        <div className="modal-foot">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="user-plus" onClick={handleSubmit} disabled={saving || !form.name}>
            {saving ? "Adding…" : "Add candidate"}
          </Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { RecruitmentPage });

export default RecruitmentPage;
