import React from "react";
import { Icon, Avatar, AvatarRow, Chip, Button, IconButton, KPI, Meter, Segmented, Tabs, Card } from "../legacy.jsx";
import "../setup.js";
const {
  useState:    useStateDC,
  useMemo:     useMemoDC,
  useEffect:   useEffectDC,
  useCallback: useCallbackDC,
  useRef:      useRefDC,
} = React;

// "01 Jan 2026" → "2026-01-01"  (for date input value)
function toInputDate(str) {
  if (!str) return "";
  const months = { Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",
                   Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12" };
  const parts = str.split(" ");
  if (parts.length === 3 && months[parts[1]]) {
    return `${parts[2]}-${months[parts[1]]}-${parts[0].padStart(2,"0")}`;
  }
  return str; // already YYYY-MM-DD or unrecognised
}

// "2026-01-01" → "01 Jan 2026"  (stored/displayed format)
function fromInputDate(str) {
  if (!str) return "";
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const parts = str.split("-");
  if (parts.length === 3) {
    return `${parts[2]} ${m[parseInt(parts[1],10)-1]} ${parts[0]}`;
  }
  return str;
}

const DOC_CATS = {
  contract:    { label: "Contract",    color: "#6F1947", icon: "file-text" },
  policy:      { label: "Policy",      color: "#2563B0", icon: "book-open" },
  template:    { label: "Template",    color: "#1F8A52", icon: "copy" },
  certificate: { label: "Certificate", color: "#D78A14", icon: "award" },
  nda:         { label: "NDA",         color: "#C0263A", icon: "lock" },
  letter:      { label: "Letter",      color: "#534AB7", icon: "mail" },
};

const DOC_STATUS = {
  active:            { label: "Active",            color: "#1F8A52", bg: "#ECFDF5" },
  draft:             { label: "Draft",             color: "#A89DA3", bg: "var(--ink-100)" },
  pending_signature: { label: "Pending Signature", color: "#D78A14", bg: "#FEF3C7" },
  expired:           { label: "Expired",           color: "#C0263A", bg: "#FFF1F2" },
};

// ── DocFormModal ───────────────────────────────────────────────────────────────
function DocFormModal({ initial, employees, onClose, onSave }) {
  const blank = { title:"", category:"contract", empId:"", status:"active",
                  issuedDate:"", expiryDate:"", fileSizeMB:0.5, notes:"", file:null, fileName:"" };
  const [form, setForm] = useStateDC(() => ({
    ...blank,
    ...(initial || {}),
    // convert stored "DD MMM YYYY" to "YYYY-MM-DD" for the date inputs
    issuedDate: toInputDate(initial?.issuedDate || ""),
    expiryDate: toInputDate(initial?.expiryDate || ""),
  }));
  const [dragOver, setDragOver] = useStateDC(false);
  const fileRef = useRefDC(null);
  const isEdit = !!initial;

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  function handleFile(file) {
    if (!file) return;
    setForm(p => ({
      ...p,
      file,
      fileName:   file.name,
      fileSizeMB: +(file.size / (1024 * 1024)).toFixed(2),
      // auto-fill title from filename (strip extension) if title is empty
      title: p.title.trim() ? p.title : file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
    }));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const ALLOWED_EXTS = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontWeight: 700, fontSize: 15 }}>{isEdit ? "Edit Document" : "Upload Document"}</div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div className="modal-body">

          {/* File upload zone — upload only (not shown in edit) */}
          {!isEdit && (
            <div className="form-row">
              <label className="form-label">File</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? "var(--brand-burgundy)" : "var(--border-subtle)"}`,
                  borderRadius: 10,
                  padding: "18px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragOver ? "var(--plum-50)" : "var(--ink-50)",
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept={ALLOWED_EXTS}
                  style={{ display: "none" }}
                  onChange={e => handleFile(e.target.files[0])}
                />
                {form.file ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--brand-burgundy)15",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="file-check" size={18} color="var(--brand-burgundy)" />
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>{form.fileName}</div>
                      <div style={{ fontSize: 11.5, color: "var(--fg-3)" }}>{form.fileSizeMB} MB</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setForm(p => ({ ...p, file:null, fileName:"" })); }}
                      style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", color: "var(--fg-3)", padding: 4 }}>
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Icon name="upload-cloud" size={28} color="var(--fg-3)" />
                    <div style={{ marginTop: 8, fontSize: 13, color: "var(--fg-2)", fontWeight: 600 }}>
                      Click or drag & drop to upload
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--fg-4)", marginTop: 4 }}>
                      PDF, Word, Excel, Images · max 20 MB
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="form-row">
            <label className="form-label">Document Title *</label>
            <input className="form-input" placeholder="e.g. Employment Contract — John Smith"
              value={form.title} onChange={set("title")} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-row">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={set("category")}>
                {Object.entries(DOC_CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={set("status")}>
                {Object.entries(DOC_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Employee (leave blank for company-wide)</label>
            <select className="form-input" value={form.empId}
              onChange={e => {
                const emp = employees.find(x => x.empId === e.target.value);
                setForm(p => ({ ...p, empId: e.target.value, empName: emp?.name || "" }));
              }}>
              <option value="">— Company-wide / HR Template —</option>
              {employees.map(e => <option key={e.empId} value={e.empId}>{e.name} ({e.dept})</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-row">
              <label className="form-label">Issue Date</label>
              <input className="form-input" type="date" value={form.issuedDate} onChange={set("issuedDate")} />
            </div>
            <div className="form-row">
              <label className="form-label">Expiry Date (optional)</label>
              <input className="form-input" type="date" value={form.expiryDate} onChange={set("expiryDate")} />
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={3}
              placeholder="Any relevant notes about this document…"
              value={form.notes} onChange={set("notes")}
              style={{ resize: "vertical", fontFamily: "inherit", fontSize: 13 }} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary"
            onClick={() => onSave({
              ...form,
              issuedDate: fromInputDate(form.issuedDate),
              expiryDate: fromInputDate(form.expiryDate),
            })}
            disabled={!form.title.trim()}>
            {isEdit ? "Save Changes" : "Upload Document"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DocumentsPage ──────────────────────────────────────────────────────────────
function DocumentsPage() {
  const [docs,      setDocs]      = useStateDC([]);
  const [employees, setEmployees] = useStateDC([]);
  const [loading,   setLoading]   = useStateDC(true);

  const [catFilter,    setCatFilter]    = useStateDC("all");
  const [statusFilter, setStatusFilter] = useStateDC("all");
  const [search,       setSearch]       = useStateDC("");
  const [selected,     setSelected]     = useStateDC(null);
  const [page,         setPage]         = useStateDC(1);
  const [pageSize,     setPageSize]     = useStateDC(10);

  const [showUpload,  setShowUpload]  = useStateDC(false);
  const [showEdit,    setShowEdit]    = useStateDC(false);
  const [editingNote, setEditingNote] = useStateDC(false);
  const [noteDraft,   setNoteDraft]   = useStateDC("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffectDC(() => {
    async function load() {
      setLoading(true);
      try {
        const [dr, er] = await Promise.all([
          fetch(`${window.API}/documents`).then(r => r.json()),
          fetch(`${window.API}/employees`).then(r => r.json()),
        ]);
        setDocs(Array.isArray(dr) ? dr : []);
        setEmployees(Array.isArray(er) ? er : []);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = useMemoDC(() => docs.filter(d => {
    if (catFilter !== "all" && d.category !== catFilter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase()) &&
        !d.empName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [docs, catFilter, statusFilter, search]);

  const totals = useMemoDC(() => ({
    total:     docs.length,
    contracts: docs.filter(d => d.category === "contract").length,
    pending:   docs.filter(d => d.status === "pending_signature").length,
    expiring:  docs.filter(d => {
      if (!d.expiryDate) return false;
      const exp = new Date(d.expiryDate.split(" ").reverse().join("-"));
      const diff = (exp - new Date()) / 86400000;
      return diff >= 0 && diff <= 60;
    }).length,
  }), [docs]);

  const selDoc = docs.find(d => d.docId === selected);

  const empMap = useMemoDC(() => {
    const m = {};
    employees.forEach(e => { m[e.empId] = e; });
    return m;
  }, [employees]);

  // Reset page on filter/search change
  useEffectDC(() => { setPage(1); }, [catFilter, statusFilter, search, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * pageSize;
  const pageRows   = filtered.slice(start, start + pageSize);

  const goTo = p => setPage(Math.max(1, Math.min(p, totalPages)));

  const pageButtons = useMemoDC(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const delta = 2;
    const left  = Math.max(2, safePage - delta);
    const right = Math.min(totalPages - 1, safePage + delta);
    const range = [1];
    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push("...");
    range.push(totalPages);
    return range;
  }, [totalPages, safePage]);

  const navBtn = (disabled) => ({
    width: 30, height: 30, borderRadius: 7,
    border: "1px solid var(--border-subtle)",
    background: "var(--bg-surface)",
    cursor: disabled ? "default" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    opacity: disabled ? 0.4 : 1,
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUpload = useCallbackDC(async (form) => {
    const docId = "DOC-" + Date.now().toString(36).toUpperCase();
    try {
      const fd = new FormData();
      fd.append("docId",      docId);
      fd.append("title",      form.title);
      fd.append("category",   form.category);
      fd.append("status",     form.status);
      fd.append("empId",      form.empId || "");
      fd.append("empName",    form.empName || (form.empId ? "" : "Company-wide"));
      fd.append("issuedDate", form.issuedDate || "");
      fd.append("expiryDate", form.expiryDate || "");
      fd.append("notes",      form.notes || "");
      if (form.file) fd.append("file", form.file);
      const res = await fetch(`${window.API}/documents`, { method: "POST", body: fd });
      const doc = await res.json();
      setDocs(prev => [doc, ...prev]);
    } catch (e) { console.error(e); }
    setShowUpload(false);
  }, []);

  const handleEdit = useCallbackDC(async (form) => {
    if (!selDoc) return;
    setDocs(prev => prev.map(d => d.docId === selDoc.docId ? { ...d, ...form } : d));
    try {
      const res = await fetch(`${window.API}/documents/${selDoc.docId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const updated = await res.json();
      setDocs(prev => prev.map(d => d.docId === selDoc.docId ? updated : d));
    } catch (e) { console.error(e); }
    setShowEdit(false);
  }, [selDoc]);

  const handleDelete = useCallbackDC(async (docId) => {
    setDocs(prev => prev.filter(d => d.docId !== docId));
    setSelected(null);
    try {
      await fetch(`${window.API}/documents/${docId}`, { method: "DELETE" });
    } catch (e) { console.error(e); }
  }, []);

  const handlePatch = useCallbackDC(async (docId, patch) => {
    setDocs(prev => prev.map(d => d.docId === docId ? { ...d, ...patch } : d));
    try {
      await fetch(`${window.API}/documents/${docId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch (e) { console.error(e); }
  }, []);

  const handleNoteSave = useCallbackDC(async () => {
    if (!selDoc) return;
    await handlePatch(selDoc.docId, { notes: noteDraft });
    setEditingNote(false);
  }, [selDoc, noteDraft, handlePatch]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page">
      <div className="page-head">
        <div><div className="eyebrow">Compliance</div><h1 className="page-title">Documents & Contracts</h1></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        {[1,2,3,4,5,6].map(i => <div key={i} className="card pulse" style={{ height: 52 }} />)}
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Compliance</div>
          <h1 className="page-title">Documents & Contracts</h1>
          <div className="page-sub">{docs.length} documents · {totals.contracts} contracts</div>
        </div>
        <div className="row">
          <Button variant="primary" icon="upload" onClick={() => setShowUpload(true)}>Upload Document</Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Documents",    value: totals.total,     icon: "files",          color: "#2563B0" },
          { label: "Employment Contracts",value: totals.contracts, icon: "file-text",      color: "#6F1947" },
          { label: "Pending Signature",  value: totals.pending,   icon: "pen-line",       color: "#D78A14" },
          { label: "Expiring (60 days)", value: totals.expiring,  icon: "alert-triangle", color: "#C0263A" },
        ].map(k => (
          <div key={k.label} className="card" style={{ display: "flex", alignItems: "center", gap: 12, borderTop: `3px solid ${k.color}`, padding: "16px 20px" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: k.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={k.icon} size={19} color={k.color} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{k.value}</div>
              <div style={{ fontSize: 11.5, color: "var(--fg-3)" }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={14} color="var(--fg-3)" />
          </span>
          <input className="search-input" placeholder="Search by title or employee…" value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32, width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", ...Object.keys(DOC_CATS)].map(c => (
            <button key={c} className={"pill-btn" + (catFilter === c ? " active" : "")} onClick={() => setCatFilter(c)}>
              {c === "all" ? "All Types" : DOC_CATS[c].label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", ...Object.keys(DOC_STATUS)].map(s => (
            <button key={s} className={"pill-btn" + (statusFilter === s ? " active" : "")} onClick={() => setStatusFilter(s)}>
              {s === "all" ? "All Status" : DOC_STATUS[s].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 340px" : "1fr", gap: 20, alignItems: "start" }}>

        {/* Document table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--ink-50)" }}>
                {["Document", "Category", "Employee / Scope", "Issued", "Expiry", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700,
                    textTransform: "uppercase", color: "var(--fg-3)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map(doc => {
                const cat = DOC_CATS[doc.category] || DOC_CATS.contract;
                const st  = DOC_STATUS[doc.status]  || DOC_STATUS.active;
                const emp = doc.empId ? empMap[doc.empId] : null;
                const isSelected = selected === doc.docId;
                return (
                  <tr key={doc.docId}
                    style={{ borderBottom: "1px solid var(--border-subtle)", cursor: "pointer",
                      background: isSelected ? "var(--plum-50)" : "transparent" }}
                    onClick={() => setSelected(isSelected ? null : doc.docId)}>

                    <td style={{ padding: "11px 14px", maxWidth: 280 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 7, background: cat.color + "15",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon name={cat.icon} size={14} color={cat.color} />
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                          {doc.title}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, padding: "2px 8px", borderRadius: 5,
                        background: cat.color + "15", color: cat.color }}>
                        {cat.label}
                      </span>
                    </td>

                    <td style={{ padding: "11px 14px" }}>
                      {emp ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Avatar name={emp.name} color={emp.av} size={22} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{emp.name}</div>
                            <div style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{emp.dept}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--fg-3)", fontStyle: "italic" }}>
                          {doc.empName || "Company-wide"}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--fg-2)", whiteSpace: "nowrap" }}>
                      {doc.issuedDate || "—"}
                    </td>

                    <td style={{ padding: "11px 14px", fontSize: 12, whiteSpace: "nowrap",
                      color: doc.expiryDate ? (doc.status === "expired" ? "#C0263A" : "var(--fg-2)") : "var(--fg-3)" }}>
                      {doc.expiryDate || "No expiry"}
                    </td>

                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ padding: "3px 9px", borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                        background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </td>

                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <IconButton icon="eye" title="View document" />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>
                    <Icon name="files" size={28} color="var(--fg-3)" />
                    <div style={{ marginTop: 10, fontWeight: 600 }}>No documents match your filter</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination footer */}
          {filtered.length > 0 && (
            <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-subtle)", background: "var(--ink-50)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>

              {/* Left: count + rows per page */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: "var(--fg-3)" }}>
                  {start + 1}–{Math.min(start + pageSize, filtered.length)} of {filtered.length} documents
                  {filtered.length < docs.length && <span style={{ color: "var(--fg-4)" }}> (filtered from {docs.length})</span>}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--fg-4)" }}>Rows:</span>
                  <select
                    value={pageSize}
                    onChange={e => setPageSize(Number(e.target.value))}
                    style={{ fontSize: 12, padding: "3px 6px", borderRadius: 6, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", color: "var(--fg-1)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                    {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              {/* Right: page navigation */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button onClick={() => goTo(1)} disabled={safePage === 1} style={navBtn(safePage === 1)}>
                  <Icon name="chevrons-left" size={13} color="var(--fg-2)" />
                </button>
                <button onClick={() => goTo(safePage - 1)} disabled={safePage === 1} style={navBtn(safePage === 1)}>
                  <Icon name="chevron-left" size={13} color="var(--fg-2)" />
                </button>

                {pageButtons.map((btn, i) =>
                  btn === "..." ? (
                    <span key={"e" + i} style={{ width: 30, textAlign: "center", fontSize: 12, color: "var(--fg-4)" }}>…</span>
                  ) : (
                    <button key={btn} onClick={() => goTo(btn)} style={{
                      width: 30, height: 30, borderRadius: 7,
                      border: `1px solid ${btn === safePage ? "#2563B0" : "var(--border-subtle)"}`,
                      background: btn === safePage ? "#2563B0" : "var(--bg-surface)",
                      color: btn === safePage ? "#fff" : "var(--fg-2)",
                      fontSize: 12.5, fontWeight: btn === safePage ? 700 : 400,
                      cursor: "pointer", fontFamily: "var(--font-sans)",
                    }}>{btn}</button>
                  )
                )}

                <button onClick={() => goTo(safePage + 1)} disabled={safePage === totalPages} style={navBtn(safePage === totalPages)}>
                  <Icon name="chevron-right" size={13} color="var(--fg-2)" />
                </button>
                <button onClick={() => goTo(totalPages)} disabled={safePage === totalPages} style={navBtn(safePage === totalPages)}>
                  <Icon name="chevrons-right" size={13} color="var(--fg-2)" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail pane */}
        {selDoc && (() => {
          const cat = DOC_CATS[selDoc.category] || DOC_CATS.contract;
          const st  = DOC_STATUS[selDoc.status]  || DOC_STATUS.active;
          const emp = selDoc.empId ? empMap[selDoc.empId] : null;
          const needsSig = ["contract", "nda", "letter"].includes(selDoc.category);
          return (
            <div className="card" style={{ position: "sticky", top: 90, padding: "18px 20px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16,
                paddingBottom: 14, borderBottom: "1px solid var(--border-subtle)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: cat.color + "18",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={cat.icon} size={20} color={cat.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.3 }}>{selDoc.title}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 5,
                      background: cat.color + "15", color: cat.color }}>{cat.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 5,
                      background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <IconButton icon="edit-2" title="Edit" onClick={() => setShowEdit(true)} />
                  <IconButton icon="trash-2" title="Delete" onClick={() => handleDelete(selDoc.docId)} />
                  <IconButton icon="x" title="Close" onClick={() => setSelected(null)} />
                </div>
              </div>

              {/* Employee */}
              {emp && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                  padding: "10px 12px", background: "var(--ink-50)", borderRadius: 8 }}>
                  <Avatar name={emp.name} color={emp.av} size={30} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{emp.name}</div>
                    <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{emp.title} · {emp.dept}</div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {[
                  { label: "Document ID", value: selDoc.docId },
                  { label: "Issued",      value: selDoc.issuedDate || "—" },
                  { label: "Expires",     value: selDoc.expiryDate || "No expiry" },
                  { label: "File",        value: selDoc.fileName || (selDoc.fileType || "PDF") },
                  { label: "File size",   value: selDoc.fileSizeMB ? selDoc.fileSizeMB + " MB" : "—" },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span style={{ color: "var(--fg-3)" }}>{row.label}</span>
                    <span style={{ fontWeight: 600, color: "var(--fg-1)", textAlign: "right", maxWidth: 180,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Signature status */}
              {needsSig && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
                    color: "var(--fg-3)", marginBottom: 10 }}>Signature Status</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { key: "signedByHR",  label: "Signed by HR" },
                      { key: "signedByEmp", label: "Signed by Employee" },
                    ].map(({ key, label }) => {
                      const signed = selDoc[key];
                      return (
                        <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "8px 12px", borderRadius: 8,
                          background: signed ? "#ECFDF5" : "var(--ink-50)",
                          border: `1px solid ${signed ? "#bbf7d0" : "var(--border-subtle)"}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Icon name={signed ? "check-circle-2" : "circle"} size={16}
                              color={signed ? "#1F8A52" : "var(--fg-3)"} />
                            <span style={{ fontSize: 12.5, fontWeight: 600,
                              color: signed ? "#1F8A52" : "var(--fg-2)" }}>{label}</span>
                          </div>
                          <button
                            onClick={() => handlePatch(selDoc.docId, { [key]: !signed })}
                            style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, border: "none", cursor: "pointer",
                              fontWeight: 600,
                              background: signed ? "#1F8A5215" : "var(--brand-burgundy)",
                              color: signed ? "#1F8A52" : "#fff" }}>
                            {signed ? "Undo" : "Mark signed"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.1em", color: "var(--fg-3)" }}>Notes</div>
                  {!editingNote && (
                    <button style={{ fontSize: 11.5, color: "var(--brand-burgundy)", fontWeight: 600,
                      background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      onClick={() => { setEditingNote(true); setNoteDraft(selDoc.notes || ""); }}>
                      {selDoc.notes ? "Edit" : "Add notes"}
                    </button>
                  )}
                </div>
                {editingNote ? (
                  <div>
                    <textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)} rows={3}
                      autoFocus
                      style={{ width: "100%", fontSize: 12.5, padding: "8px 10px", borderRadius: 8,
                        border: "1px solid var(--border-subtle)", resize: "vertical", fontFamily: "inherit",
                        color: "var(--fg-1)", background: "var(--surface)" }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button className="btn btn-primary" style={{ fontSize: 12, padding: "5px 14px" }}
                        onClick={handleNoteSave}>Save</button>
                      <button className="btn" style={{ fontSize: 12, padding: "5px 14px" }}
                        onClick={() => setEditingNote(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12.5, color: selDoc.notes ? "var(--fg-2)" : "var(--fg-3)",
                    lineHeight: 1.55, padding: "10px 12px", background: "var(--ink-50)", borderRadius: 8,
                    fontStyle: selDoc.notes ? "normal" : "italic", minHeight: 40 }}>
                    {selDoc.notes || "No notes."}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                {selDoc.filePath ? (
                  <a
                    href={selDoc.filePath} download={selDoc.fileName || selDoc.title}
                    className="btn"
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, textDecoration: "none" }}>
                    <Icon name="download" size={14} /> Download
                  </a>
                ) : (
                  <button className="btn" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, opacity: 0.5 }} disabled>
                    <Icon name="download" size={14} /> No file
                  </button>
                )}
                {selDoc.status !== "pending_signature" && needsSig && (
                  <button className="btn btn-primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13 }}
                    onClick={() => handlePatch(selDoc.docId, { status: "pending_signature" })}>
                    <Icon name="send" size={14} /> Send for Signature
                  </button>
                )}
                {selDoc.status === "pending_signature" && (
                  <button className="btn" style={{ flex: 1, fontSize: 13, background: "#1F8A5215", color: "#1F8A52", borderColor: "#bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    onClick={() => handlePatch(selDoc.docId, { status: "active" })}>
                    <Icon name="check-circle-2" size={14} /> Mark Active
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Modals */}
      {showUpload && (
        <DocFormModal employees={employees} onClose={() => setShowUpload(false)} onSave={handleUpload} />
      )}
      {showEdit && selDoc && (
        <DocFormModal
          initial={{ title: selDoc.title, category: selDoc.category, empId: selDoc.empId,
            empName: selDoc.empName, status: selDoc.status, issuedDate: selDoc.issuedDate,
            expiryDate: selDoc.expiryDate, fileSizeMB: selDoc.fileSizeMB, notes: selDoc.notes }}
          employees={employees}
          onClose={() => setShowEdit(false)}
          onSave={handleEdit}
        />
      )}
    </div>
  );
}

Object.assign(window, { DocumentsPage });

export default DocumentsPage;
