import React from "react";
import { Icon, Button, IconButton, Avatar, PartyAutocomplete, ProjectSelect } from "../legacy.jsx";
import "../setup.js";
const {
  useState:    useStateEX,
  useMemo:     useMemoEX,
  useEffect:   useEffectEX,
  useCallback: useCallbackEX,
  useRef:      useRefEX,
} = React;

const EX_ALLOWED = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.heic,.webp";

const PAYMENT_TYPES = {
  cash:           { label: "Cash",           icon: "banknote",      color: "#1F8A52" },
  bank_transfer:  { label: "Bank Transfer",  icon: "landmark",      color: "#2563B0" },
  cheque:         { label: "Cheque",         icon: "file-signature", color: "#534AB7" },
  credit_card:    { label: "Credit Card",    icon: "credit-card",   color: "#D78A14" },
  corporate_card: { label: "Corporate Card", icon: "badge-check",   color: "#6F1947" },
  mobile_pay:     { label: "Mobile Pay",     icon: "smartphone",    color: "#0F6E56" },
  other:          { label: "Other",          icon: "more-horizontal",color: "#A89DA3" },
};

function FileDropZone({ files, onChange }) {
  const [dragOver, setDragOver] = useStateEX(false);
  const ref = useRefEX(null);

  function addFiles(incoming) {
    const merged = [...files];
    Array.from(incoming).forEach(f => {
      if (!merged.find(x => x.name === f.name && x.size === f.size)) merged.push(f);
    });
    onChange(merged);
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => ref.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? "var(--brand-burgundy)" : "var(--border-subtle)"}`,
          borderRadius: 10, padding: "14px 16px", textAlign: "center", cursor: "pointer",
          background: dragOver ? "var(--plum-50)" : "var(--ink-50)",
          transition: "border-color 0.15s, background 0.15s",
        }}>
        <input ref={ref} type="file" accept={EX_ALLOWED} multiple style={{ display: "none" }}
          onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
        <Icon name="upload-cloud" size={22} color="var(--fg-3)" />
        <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 600, color: "var(--fg-2)" }}>
          Click or drag receipts / documents
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 3 }}>
          PDF, Word, Excel, Images · max 20 MB each
        </div>
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
              borderRadius: 8, background: "var(--ink-50)", border: "1px solid var(--border-subtle)" }}>
              <Icon name="file" size={14} color="var(--fg-3)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-1)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                <div style={{ fontSize: 11, color: "var(--fg-4)" }}>
                  {(f.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); onChange(files.filter((_, j) => j !== i)); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 2,
                  color: "var(--fg-3)", display: "flex", alignItems: "center" }}>
                <Icon name="x" size={13} color="#C0263A" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const EX_CATS = {
  travel:    { label: "Travel",        icon: "plane",            color: "#2563B0" },
  meals:     { label: "Meals",         icon: "utensils",         color: "#D78A14" },
  accomm:    { label: "Accommodation", icon: "bed-double",       color: "#534AB7" },
  office:    { label: "Office",        icon: "monitor",          color: "#1F8A52" },
  training:  { label: "Training",      icon: "graduation-cap",   color: "#6F1947" },
  client:    { label: "Client Ent.",   icon: "handshake",        color: "#B61B54" },
  transport: { label: "Transport",     icon: "car",              color: "#C0263A" },
  other:     { label: "Other",         icon: "more-horizontal",  color: "#A89DA3" },
};

const STATUS_META_EX = {
  pending:    { label: "Pending",    color: "#D78A14", bg: "#FEF3C7", icon: "clock" },
  approved:   { label: "Approved",   color: "#1F8A52", bg: "#ECFDF5", icon: "check-circle-2" },
  reimbursed: { label: "Reimbursed", color: "#2563B0", bg: "#EFF6FF", icon: "banknote" },
  rejected:   { label: "Rejected",   color: "#C0263A", bg: "#FFF1F2", icon: "x-circle" },
};

function StatusChip({ status }) {
  const s = STATUS_META_EX[status] || STATUS_META_EX.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px",
      borderRadius: 6, fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.color }}>
      <Icon name={s.icon} size={11} color={s.color} />
      {s.label}
    </span>
  );
}

// ── NewClaimModal ──────────────────────────────────────────────────────────────
function NewClaimModal({ employees, initial, onClose, onSave }) {
  const isEdit = !!initial;
  const [form, setForm] = useStateEX(initial ? {
    empId: initial.empId || "", cat: initial.cat || "travel", desc: initial.desc || "",
    amount: initial.amount != null ? String(initial.amount) : "", date: initial.date || "",
    paymentType: initial.paymentType || "cash", party: initial.party || "",
    projectId: initial.projectId || "", projectName: initial.projectName || "",
    notes: initial.notes || "",
    empName: initial.empName || "", dept: initial.dept || "", avatar: initial.avatar || {},
  } : {
    empId: "", cat: "travel", desc: "", amount: "", date: "",
    paymentType: "cash", party: "", projectId: "", projectName: "", notes: "",
  });
  const [files, setFiles] = useStateEX([]);
  const set   = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const valid = form.empId && form.desc.trim() && parseFloat(form.amount) > 0 && form.date;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontWeight: 700, fontSize: 15 }}>{isEdit ? "Edit Expense Claim" : "New Expense Claim"}</div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label className="form-label">Employee *</label>
            <select className="form-input" value={form.empId}
              onChange={e => {
                const emp = employees.find(x => x.empId === e.target.value);
                setForm(p => ({ ...p, empId: e.target.value,
                  empName: emp?.name || "", dept: emp?.dept || "",
                  avatar: emp?.av || {} }));
              }}>
              <option value="">— Select employee —</option>
              {employees.map(e => (
                <option key={e.empId} value={e.empId}>{e.name} · {e.dept}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-row">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.cat} onChange={set("cat")}>
                {Object.entries(EX_CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">Date *</label>
              <input className="form-input" type="date" value={form.date} onChange={set("date")} />
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Description *</label>
            <input className="form-input" placeholder="Brief description of the expense"
              value={form.desc} onChange={set("desc")} />
          </div>

          <div className="form-row">
            <label className="form-label">Party</label>
            <PartyAutocomplete
              value={form.party}
              onChange={v => setForm(p => ({ ...p, party: v, projectId: "", projectName: "" }))}
              placeholder="Vendor, client or service provider…"
            />
          </div>
          <ProjectSelect
            partyName={form.party}
            value={form.projectId}
            onChange={sel => setForm(p => ({ ...p, projectId: sel.projectId, projectName: sel.projectName }))}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-row">
              <label className="form-label">Amount (AED) *</label>
              <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00"
                value={form.amount} onChange={set("amount")} />
            </div>
            <div className="form-row">
              <label className="form-label">Payment Type</label>
              <select className="form-input" value={form.paymentType} onChange={set("paymentType")}>
                {Object.entries(PAYMENT_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {!isEdit && (
            <div className="form-row">
              <label className="form-label">
                Attachments
                {files.length > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, padding: "1px 7px",
                    borderRadius: 10, background: "var(--brand-burgundy)18", color: "var(--brand-burgundy)" }}>
                    {files.length} file{files.length !== 1 ? "s" : ""}
                  </span>
                )}
              </label>
              <FileDropZone files={files} onChange={setFiles} />
            </div>
          )}

          <div className="form-row">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} placeholder="Any supporting notes…"
              value={form.notes} onChange={set("notes")}
              style={{ resize: "vertical", fontFamily: "inherit", fontSize: 13 }} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form, files)} disabled={!valid}>
            {isEdit ? "Save Changes" : "Submit Claim"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AttachmentsPanel ──────────────────────────────────────────────────────────
function AttachmentsPanel({ expense, onAdd, onDelete }) {
  const [addOpen, setAddOpen] = useStateEX(false);
  const [newFiles, setNewFiles] = useStateEX([]);
  const [uploading, setUploading] = useStateEX(false);

  const attachments = expense.attachments || [];

  const EXT_ICON = { pdf: "file-text", doc: "file-text", docx: "file-text",
    xls: "file-spreadsheet", xlsx: "file-spreadsheet",
    png: "image", jpg: "image", jpeg: "image", heic: "image", webp: "image" };
  const getIcon = name => {
    const ext = (name || "").split(".").pop().toLowerCase();
    return EXT_ICON[ext] || "file";
  };

  const handleUpload = async () => {
    if (!newFiles.length) return;
    setUploading(true);
    await onAdd(expense.expenseId, newFiles);
    setNewFiles([]);
    setAddOpen(false);
    setUploading(false);
  };

  const btnStyle = { width: 26, height: 26, borderRadius: 6,
    border: "1px solid var(--border-subtle)", background: "var(--bg-surface)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0, textDecoration: "none" };

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.1em", color: "var(--fg-3)" }}>
          Attachments
          {attachments.length > 0 && (
            <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, padding: "1px 6px",
              borderRadius: 8, background: "var(--ink-100)", color: "var(--fg-3)" }}>
              {attachments.length}
            </span>
          )}
        </div>
        <button onClick={() => { setAddOpen(o => !o); setNewFiles([]); }}
          style={{ fontSize: 11.5, color: "var(--brand-burgundy)", fontWeight: 600,
            background: "none", border: "none", cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", gap: 4 }}>
          <Icon name={addOpen ? "x" : "plus"} size={12} color="var(--brand-burgundy)" />
          {addOpen ? "Cancel" : "Add"}
        </button>
      </div>

      {/* File list */}
      {attachments.length === 0 && !addOpen && (
        <div style={{ fontSize: 12, color: "var(--fg-4)", fontStyle: "italic",
          padding: "8px 10px", background: "var(--ink-50)", borderRadius: 8 }}>
          No attachments yet.
        </div>
      )}
      {attachments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: addOpen ? 10 : 0 }}>
          {attachments.map((att, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8,
              padding: "7px 10px", borderRadius: 8, background: "var(--ink-50)",
              border: "1px solid var(--border-subtle)" }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#2563B015",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={getIcon(att.fileName)} size={14} color="#2563B0" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-1)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {att.fileName}
                </div>
                <div style={{ fontSize: 11, color: "var(--fg-4)" }}>{att.fileSizeMB} MB</div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <a href={att.filePath} target="_blank" rel="noopener noreferrer"
                  title="View" style={btnStyle}>
                  <Icon name="eye" size={13} color="var(--fg-2)" />
                </a>
                <a href={att.filePath} download={att.fileName}
                  title="Download" style={btnStyle}>
                  <Icon name="download" size={13} color="var(--fg-2)" />
                </a>
                <button title="Remove" onClick={() => onDelete(expense.expenseId, i)}
                  style={{ ...btnStyle, border: "1px solid #FFF1F2", background: "#FFF1F2" }}>
                  <Icon name="trash-2" size={13} color="#C0263A" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add files zone */}
      {addOpen && (
        <div>
          <FileDropZone files={newFiles} onChange={setNewFiles} />
          {newFiles.length > 0 && (
            <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}
              style={{ marginTop: 8, width: "100%", fontSize: 12 }}>
              <Icon name="upload" size={13} />
              {uploading ? "Uploading…" : `Upload ${newFiles.length} file${newFiles.length !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── ExpensePage ────────────────────────────────────────────────────────────────
function ExpensePage() {
  const [expenses,  setExpenses]  = useStateEX([]);
  const [employees, setEmployees] = useStateEX([]);
  const [loading,   setLoading]   = useStateEX(true);

  const [statusFilter, setStatusFilter] = useStateEX("all");
  const [catFilter,    setCatFilter]    = useStateEX("all");
  const [search,       setSearch]       = useStateEX("");
  const [selected,     setSelected]     = useStateEX(null);
  const [showNew,      setShowNew]      = useStateEX(false);
  const [editExp,      setEditExp]      = useStateEX(null);
  const [exPage,       setExPage]       = useStateEX(1);
  const [exPageSize,   setExPageSize]   = useStateEX(10);

  const [editingNote, setEditingNote] = useStateEX(false);
  const [noteDraft,   setNoteDraft]   = useStateEX("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffectEX(() => {
    async function load() {
      setLoading(true);
      try {
        const [er, emr] = await Promise.all([
          fetch(`${window.API}/expenses`).then(r => r.json()),
          fetch(`${window.API}/employees`).then(r => r.json()),
        ]);
        setExpenses(Array.isArray(er) ? er : []);
        setEmployees(Array.isArray(emr) ? emr : []);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = useMemoEX(() => expenses.filter(e => {
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (catFilter    !== "all" && e.cat    !== catFilter)    return false;
    if (search && !e.empName.toLowerCase().includes(search.toLowerCase()) &&
                  !e.desc.toLowerCase().includes(search.toLowerCase()))   return false;
    return true;
  }), [expenses, statusFilter, catFilter, search]);

  useEffectEX(() => { setExPage(1); }, [statusFilter, catFilter, search, exPageSize]);

  const exTotalPages  = Math.max(1, Math.ceil(filtered.length / exPageSize));
  const exSafePage    = Math.min(exPage, exTotalPages);
  const exStart       = (exSafePage - 1) * exPageSize;
  const exPageRows    = filtered.slice(exStart, exStart + exPageSize);
  const exNavBtn      = (dis) => ({ width:30, height:30, borderRadius:7, border:"1px solid var(--border-subtle)", background:"var(--bg-surface)", cursor:dis?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:dis?0.4:1 });
  const exPageButtons = useMemoEX(() => {
    if (exTotalPages <= 7) return Array.from({ length: exTotalPages }, (_, i) => i + 1);
    const left  = Math.max(2, exSafePage - 2);
    const right = Math.min(exTotalPages - 1, exSafePage + 2);
    const r = [1];
    if (left > 2) r.push("...");
    for (let i = left; i <= right; i++) r.push(i);
    if (right < exTotalPages - 1) r.push("...");
    if (exTotalPages > 1) r.push(exTotalPages);
    return r;
  }, [exTotalPages, exSafePage]);

  const thisMonth = useMemoEX(() => expenses.filter(e => e.date.startsWith("2026-05")), [expenses]);

  const totals = useMemoEX(() => ({
    total:      thisMonth.reduce((s, e) => s + e.amount, 0),
    pending:    thisMonth.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0),
    approved:   thisMonth.filter(e => e.status === "approved").reduce((s, e) => s + e.amount, 0),
    reimbursed: thisMonth.filter(e => e.status === "reimbursed").reduce((s, e) => s + e.amount, 0),
    count:      { pending: thisMonth.filter(e => e.status === "pending").length },
  }), [thisMonth]);

  const catBreakdown = useMemoEX(() => {
    const grandTotal = expenses.reduce((s, e) => s + e.amount, 0) || 1;
    const amtMap = {}, cntMap = {};
    expenses.forEach(e => {
      amtMap[e.cat] = (amtMap[e.cat] || 0) + e.amount;
      cntMap[e.cat] = (cntMap[e.cat] || 0) + 1;
    });
    return Object.entries(amtMap)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => ({
        cat,
        amt,
        count: cntMap[cat] || 0,
        pct: Math.round(amt / grandTotal * 100),
      }));
  }, [expenses]);

  const paymentBreakdown = useMemoEX(() => {
    const grandTotal = expenses.reduce((s, e) => s + e.amount, 0) || 1;
    const map = {};
    expenses.forEach(e => {
      const k = e.paymentType || "cash";
      map[k] = (map[k] || 0) + e.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([type, amt]) => ({ type, amt, pct: Math.round(amt / grandTotal * 100) }));
  }, [expenses]);

  const selExp = expenses.find(e => e.expenseId === selected);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const patch = useCallbackEX(async (expenseId, update) => {
    setExpenses(prev => prev.map(e => e.expenseId === expenseId ? { ...e, ...update } : e));
    try {
      await fetch(`${window.API}/expenses/${expenseId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
    } catch (err) { console.error(err); }
  }, []);

  const handleDelete = useCallbackEX(async (expenseId) => {
    setExpenses(prev => prev.filter(e => e.expenseId !== expenseId));
    setSelected(null);
    try {
      await fetch(`${window.API}/expenses/${expenseId}`, { method: "DELETE" });
    } catch (err) { console.error(err); }
  }, []);

  const handleEdit = useCallbackEX(async (form) => {
    if (!editExp) return;
    const id  = editExp.expenseId;
    const emp = employees.find(e => e.empId === form.empId);
    const update = {
      empId:       form.empId,
      empName:     emp?.name || editExp.empName || "",
      dept:        emp?.dept || editExp.dept || "",
      avatar:      emp?.av || editExp.avatar || {},
      cat:         form.cat,
      amount:      parseFloat(form.amount) || 0,
      date:        form.date,
      desc:        form.desc,
      party:       form.party || "",
      projectId:   form.projectId || "",
      projectName: form.projectName || "",
      paymentType: form.paymentType || "cash",
      notes:       form.notes || "",
    };
    // Optimistic
    setExpenses(prev => prev.map(e => e.expenseId === id ? { ...e, ...update } : e));
    try {
      const res = await fetch(`${window.API}/expenses/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      const doc = await res.json();
      setExpenses(prev => prev.map(e => e.expenseId === id ? doc : e));
    } catch (err) { console.error(err); }
    setEditExp(null);
  }, [editExp, employees]);

  const handleNew = useCallbackEX(async (form, files = []) => {
    const expenseId = "EXP-" + Date.now().toString(36).toUpperCase();
    const emp = employees.find(e => e.empId === form.empId);
    const fd  = new FormData();
    fd.append("expenseId", expenseId);
    fd.append("empId",     form.empId);
    fd.append("empName",   emp?.name  || "");
    fd.append("dept",      emp?.dept  || "");
    fd.append("avatar",    JSON.stringify(emp?.av || {}));
    fd.append("cat",       form.cat);
    fd.append("amount",    parseFloat(form.amount) || 0);
    fd.append("currency",  "AED");
    fd.append("date",      form.date);
    fd.append("desc",        form.desc);
    fd.append("party",       form.party || "");
    fd.append("projectId",   form.projectId   || "");
    fd.append("projectName", form.projectName || "");
    fd.append("paymentType", form.paymentType || "cash");
    fd.append("notes",       form.notes || "");
    fd.append("status",      "pending");
    fd.append("receipts",  files.length);
    files.forEach(f => fd.append("files", f));
    try {
      const res = await fetch(`${window.API}/expenses`, { method: "POST", body: fd });
      const doc = await res.json();
      setExpenses(prev => [doc, ...prev]);
    } catch (err) { console.error(err); }
    setShowNew(false);
  }, [employees]);

  const handleAddAttachments = useCallbackEX(async (expenseId, files) => {
    if (!files.length) return;
    const fd = new FormData();
    files.forEach(f => fd.append("files", f));
    try {
      const res = await fetch(`${window.API}/expenses/${expenseId}/attachments`, { method: "POST", body: fd });
      const doc = await res.json();
      setExpenses(prev => prev.map(e => e.expenseId === expenseId ? doc : e));
    } catch (err) { console.error(err); }
  }, []);

  const handleDeleteAttachment = useCallbackEX(async (expenseId, idx) => {
    setExpenses(prev => prev.map(e => {
      if (e.expenseId !== expenseId) return e;
      const attachments = e.attachments.filter((_, i) => i !== idx);
      return { ...e, attachments, receipts: Math.max(0, (e.receipts || 0) - 1) };
    }));
    try {
      const res = await fetch(`${window.API}/expenses/${expenseId}/attachments/${idx}`, { method: "DELETE" });
      const doc = await res.json();
      setExpenses(prev => prev.map(e => e.expenseId === expenseId ? doc : e));
    } catch (err) { console.error(err); }
  }, []);

  const handleNoteSave = useCallbackEX(() => {
    if (!selExp) return;
    patch(selExp.expenseId, { notes: noteDraft });
    setEditingNote(false);
  }, [selExp, noteDraft, patch]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page">
      <div className="page-head">
        <div><div className="eyebrow">Money</div><h1 className="page-title">Expense Management</h1></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        {[1,2,3,4,5].map(i => <div key={i} className="card pulse" style={{ height: 52 }} />)}
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Money</div>
          <h1 className="page-title">Expense Management</h1>
          <div className="page-sub">Submit, review and reimburse employee expenses</div>
        </div>
        <div className="row">
          <Button variant="primary" icon="plus" onClick={() => setShowNew(true)}>New Claim</Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "This Month Total",  value: "AED " + totals.total.toLocaleString(),      icon: "receipt",        color: "#2563B0" },
          { label: "Pending Review",    value: "AED " + totals.pending.toLocaleString(),     icon: "clock",          color: "#D78A14",
            sub: totals.count.pending + " claim" + (totals.count.pending !== 1 ? "s" : "") },
          { label: "Approved",          value: "AED " + totals.approved.toLocaleString(),    icon: "check-circle-2", color: "#1F8A52" },
          { label: "Reimbursed",        value: "AED " + totals.reimbursed.toLocaleString(),  icon: "banknote",       color: "#534AB7" },
        ].map(k => (
          <div key={k.label} className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderTop: `3px solid ${k.color}` }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: k.color + "15",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={k.icon} size={20} color={k.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--fg-1)" }}>{k.value}</div>
              <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>
                {k.sub ? k.sub : k.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 320px" : "1fr 300px", gap: 20, alignItems: "start" }}>

        {/* ── Main section ────────────────────────────────────────────────── */}
        <div>
          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
                <Icon name="search" size={14} color="var(--fg-3)" />
              </span>
              <input className="search-input" placeholder="Search employee or description…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 32, width: "100%" }} />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["all", ...Object.keys(STATUS_META_EX)].map(s => (
                <button key={s} className={"pill-btn" + (statusFilter === s ? " active" : "")}
                  onClick={() => setStatusFilter(s)}>
                  {s === "all" ? "All Status" : STATUS_META_EX[s].label}
                </button>
              ))}
            </div>
            {catFilter !== "all" && (
              <button className="pill-btn active" onClick={() => setCatFilter("all")} style={{ gap: 4 }}>
                <Icon name="x" size={11} /> {EX_CATS[catFilter]?.label}
              </button>
            )}
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--ink-50)" }}>
                  {["Employee","Category","Description","Date","Amount","Payment","Rcpts","Status",""].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: h === "Amount" ? "right" : "left",
                      fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--fg-3)",
                      whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exPageRows.map(ex => {
                  const cat = EX_CATS[ex.cat] || EX_CATS.other;
                  const isSel = selected === ex.expenseId;
                  return (
                    <tr key={ex.expenseId}
                      style={{ borderBottom: "1px solid var(--border-subtle)", cursor: "pointer",
                        background: isSel ? "var(--plum-50)" : "transparent" }}
                      onClick={() => { setSelected(isSel ? null : ex.expenseId); setEditingNote(false); }}>

                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar name={ex.empName} color={ex.avatar} size={26} />
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{ex.empName}</div>
                            <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{ex.dept}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5,
                          fontWeight: 600, padding: "2px 7px", borderRadius: 5,
                          background: cat.color + "15", color: cat.color }}>
                          <Icon name={cat.icon} size={11} color={cat.color} />
                          {cat.label}
                        </span>
                      </td>

                      <td style={{ padding: "10px 14px", maxWidth: 260 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--fg-1)", whiteSpace: "nowrap",
                          overflow: "hidden", textOverflow: "ellipsis", maxWidth: 240 }}>
                          {ex.desc}
                        </div>
                        {ex.party && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2,
                            fontSize: 11, color: "var(--fg-3)" }}>
                            <Icon name="contact-round" size={10} color="var(--fg-4)" />
                            {ex.party}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--fg-3)", whiteSpace: "nowrap" }}>
                        {ex.date}
                      </td>

                      <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 13,
                        fontWeight: 700, color: "var(--fg-1)", whiteSpace: "nowrap" }}>
                        {ex.currency} {ex.amount.toLocaleString()}
                      </td>

                      <td style={{ padding: "10px 14px" }}>
                        {(() => {
                          const pt = PAYMENT_TYPES[ex.paymentType] || PAYMENT_TYPES.cash;
                          return (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5,
                              fontSize: 11.5, fontWeight: 600, padding: "2px 8px", borderRadius: 5,
                              background: pt.color + "15", color: pt.color, whiteSpace: "nowrap" }}>
                              <Icon name={pt.icon} size={11} color={pt.color} />
                              {pt.label}
                            </span>
                          );
                        })()}
                      </td>

                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        {(() => {
                          const count = ex.attachments?.length || ex.receipts || 0;
                          return (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3,
                              fontSize: 11.5,
                              color: count > 0 ? "#2563B0" : "var(--fg-4)",
                              fontWeight: count > 0 ? 700 : 400 }}>
                              <Icon name="paperclip" size={12} color={count > 0 ? "#2563B0" : "var(--fg-4)"} />
                              {count}
                            </span>
                          );
                        })()}
                      </td>

                      <td style={{ padding: "10px 14px" }}>
                        <StatusChip status={ex.status} />
                      </td>

                      <td style={{ padding: "10px 14px" }}>
                        {ex.status === "pending" && (
                          <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                            <button title="Approve"
                              style={{ width: 26, height: 26, borderRadius: 6, border: "none", cursor: "pointer",
                                background: "#ECFDF5", color: "#1F8A52", display: "flex", alignItems: "center",
                                justifyContent: "center" }}
                              onClick={() => patch(ex.expenseId, { status: "approved" })}>
                              <Icon name="check" size={13} color="#1F8A52" />
                            </button>
                            <button title="Reject"
                              style={{ width: 26, height: 26, borderRadius: 6, border: "none", cursor: "pointer",
                                background: "#FFF1F2", color: "#C0263A", display: "flex", alignItems: "center",
                                justifyContent: "center" }}
                              onClick={() => patch(ex.expenseId, { status: "rejected" })}>
                              <Icon name="x" size={13} color="#C0263A" />
                            </button>
                          </div>
                        )}
                        {ex.status === "approved" && (
                          <button title="Mark reimbursed" onClick={e => { e.stopPropagation(); patch(ex.expenseId, { status: "reimbursed" }); }}
                            style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, border: "none", cursor: "pointer",
                              background: "#EFF6FF", color: "#2563B0", fontWeight: 600, whiteSpace: "nowrap" }}>
                            Reimburse
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--fg-3)" }}>
                <Icon name="receipt" size={28} color="var(--fg-3)" />
                <div style={{ marginTop: 10, fontWeight: 600 }}>No expenses match the filter</div>
              </div>
            )}
            {filtered.length > 0 && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderTop:"1px solid var(--border-subtle)", flexWrap:"wrap", gap:8 }}>
                <div style={{ fontSize:12.5, color:"var(--fg-3)" }}>
                  {exStart+1}–{Math.min(exStart+exPageSize, filtered.length)} of {filtered.length} expenses
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:12, color:"var(--fg-3)" }}>Rows</span>
                  <select value={exPageSize} onChange={e => { setExPageSize(Number(e.target.value)); setExPage(1); }}
                    style={{ height:28, fontSize:12, padding:"0 6px", borderRadius:6, border:"1px solid var(--border-subtle)", background:"var(--bg-surface)" }}>
                    {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <div style={{ display:"flex", gap:4 }}>
                    <button onClick={() => setExPage(1)} disabled={exSafePage===1} style={exNavBtn(exSafePage===1)}><span style={{fontSize:12}}>«</span></button>
                    <button onClick={() => setExPage(exSafePage-1)} disabled={exSafePage===1} style={exNavBtn(exSafePage===1)}><span style={{fontSize:12}}>‹</span></button>
                    {exPageButtons.map((b,i) => b==="..." ? (
                      <span key={"e"+i} style={{width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"var(--fg-3)"}}>…</span>
                    ) : (
                      <button key={b} onClick={() => setExPage(b)} style={{width:30,height:30,borderRadius:7,border:"1px solid var(--border-subtle)",cursor:"pointer",fontSize:12,fontWeight:b===exSafePage?700:400,background:b===exSafePage?"#2563B0":"var(--bg-surface)",color:b===exSafePage?"#fff":"var(--fg-1)"}}>
                        {b}
                      </button>
                    ))}
                    <button onClick={() => setExPage(exSafePage+1)} disabled={exSafePage===exTotalPages} style={exNavBtn(exSafePage===exTotalPages)}><span style={{fontSize:12}}>›</span></button>
                    <button onClick={() => setExPage(exTotalPages)} disabled={exSafePage===exTotalPages} style={exNavBtn(exSafePage===exTotalPages)}><span style={{fontSize:12}}>»</span></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: detail pane or category breakdown ─────────────── */}
        {selExp ? (
          // ── Detail pane ──────────────────────────────────────────────────
          <div className="card" style={{
            position: "sticky", top: 90, padding: "18px 20px",
            maxHeight: "calc(100vh - 110px)",
            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
              marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.3 }}>{selExp.desc}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <StatusChip status={selExp.status} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <IconButton icon="edit-2" title="Edit" onClick={() => setEditExp(selExp)} />
                <IconButton icon="trash-2" title="Delete" onClick={() => handleDelete(selExp.expenseId)} />
                <IconButton icon="x" title="Close" onClick={() => setSelected(null)} />
              </div>
            </div>

            {/* Amount */}
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--fg-1)", marginBottom: 14, textAlign: "center",
              padding: "14px 0", background: "var(--ink-50)", borderRadius: 10 }}>
              {selExp.currency} {selExp.amount.toLocaleString()}
            </div>

            {/* Employee */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
              padding: "10px 12px", background: "var(--ink-50)", borderRadius: 8 }}>
              <Avatar name={selExp.empName} color={selExp.avatar} size={30} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{selExp.empName}</div>
                <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{selExp.dept}</div>
              </div>
            </div>

            {/* Meta */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
              {[
                { label: "Expense ID",    value: selExp.expenseId },
                { label: "Category",      value: (EX_CATS[selExp.cat] || EX_CATS.other).label },
                { label: "Date",          value: selExp.date },
                selExp.party       ? { label: "Party",   value: selExp.party }       : null,
                selExp.projectName ? { label: "Project", value: selExp.projectName } : null,
                { label: "Payment Type",  value: (PAYMENT_TYPES[selExp.paymentType] || PAYMENT_TYPES.cash).label,
                  color: (PAYMENT_TYPES[selExp.paymentType] || PAYMENT_TYPES.cash).color },
                { label: "Attachments",   value: (selExp.attachments?.length || selExp.receipts || 0) + " file(s)" },
              ].filter(r => r !== null).map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                  <span style={{ color: "var(--fg-3)" }}>{r.label}</span>
                  <span style={{ fontWeight: 600, color: r.color || "var(--fg-1)",
                    display: "flex", alignItems: "center", gap: 5 }}>
                    {r.color && (
                      <span style={{ width: 8, height: 8, borderRadius: "50%",
                        background: r.color, display: "inline-block", flexShrink: 0 }} />
                    )}
                    {r.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Status actions */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {selExp.status === "pending" && (
                <>
                  <button className="btn btn-primary" style={{ flex: 1, fontSize: 12 }}
                    onClick={() => patch(selExp.expenseId, { status: "approved" })}>
                    <Icon name="check" size={13} /> Approve
                  </button>
                  <button className="btn" style={{ flex: 1, fontSize: 12, color: "#C0263A", borderColor: "#C0263A" }}
                    onClick={() => patch(selExp.expenseId, { status: "rejected" })}>
                    <Icon name="x" size={13} /> Reject
                  </button>
                </>
              )}
              {selExp.status === "approved" && (
                <button className="btn btn-primary" style={{ flex: 1, fontSize: 12 }}
                  onClick={() => patch(selExp.expenseId, { status: "reimbursed" })}>
                  <Icon name="banknote" size={13} /> Mark Reimbursed
                </button>
              )}
              {selExp.status === "rejected" && (
                <button className="btn" style={{ flex: 1, fontSize: 12 }}
                  onClick={() => patch(selExp.expenseId, { status: "pending" })}>
                  <Icon name="rotate-ccw" size={13} /> Reopen
                </button>
              )}
              {selExp.status === "reimbursed" && (
                <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: "#2563B0", fontWeight: 600, padding: "6px 0" }}>
                  <Icon name="check-circle-2" size={14} color="#2563B0" /> Fully reimbursed
                </div>
              )}
            </div>

            {/* Attachments */}
            <AttachmentsPanel
              expense={selExp}
              onAdd={handleAddAttachments}
              onDelete={handleDeleteAttachment}
            />

            {/* Notes */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.1em", color: "var(--fg-3)" }}>Notes</div>
                {!editingNote && (
                  <button style={{ fontSize: 11.5, color: "var(--brand-burgundy)", fontWeight: 600,
                    background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    onClick={() => { setEditingNote(true); setNoteDraft(selExp.notes || ""); }}>
                    {selExp.notes ? "Edit" : "Add"}
                  </button>
                )}
              </div>
              {editingNote ? (
                <div>
                  <textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)} rows={3} autoFocus
                    style={{ width: "100%", fontSize: 12.5, padding: "8px 10px", borderRadius: 8,
                      border: "1px solid var(--border-subtle)", resize: "vertical",
                      fontFamily: "inherit", color: "var(--fg-1)", background: "var(--surface)" }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button className="btn btn-primary" style={{ fontSize: 12, padding: "5px 14px" }}
                      onClick={handleNoteSave}>Save</button>
                    <button className="btn" style={{ fontSize: 12, padding: "5px 14px" }}
                      onClick={() => setEditingNote(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: selExp.notes ? "var(--fg-2)" : "var(--fg-3)",
                  lineHeight: 1.55, padding: "10px 12px", background: "var(--ink-50)", borderRadius: 8,
                  fontStyle: selExp.notes ? "normal" : "italic", minHeight: 36 }}>
                  {selExp.notes || "No notes."}
                </div>
              )}
            </div>
          </div>
        ) : (
          // ── Analytics sidebar ─────────────────────────────────────────────
          <div style={{
            position: "sticky", top: 90,
            maxHeight: "calc(100vh - 110px)",
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex", flexDirection: "column", gap: 14,
            paddingBottom: 4,
            scrollbarWidth: "none",       /* Firefox */
            msOverflowStyle: "none",      /* IE/Edge */
          }}>

            {/* Total spend card */}
            <div className="card" style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 12 }}>Total Spend</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "var(--fg-1)", letterSpacing: "-0.5px" }}>
                AED {expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 3 }}>
                {expenses.length} claim{expenses.length !== 1 ? "s" : ""} · {Object.keys(
                  expenses.reduce((m, e) => { m[e.empId] = 1; return m; }, {})
                ).length} employees
              </div>

              {/* Segmented bar */}
              {catBreakdown.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ height: 10, borderRadius: 6, overflow: "hidden", display: "flex", gap: 2 }}>
                    {catBreakdown.map(({ cat, pct }) => {
                      const c = EX_CATS[cat] || EX_CATS.other;
                      return pct > 0 ? (
                        <div key={cat} title={`${c.label}: ${pct}%`}
                          style={{ height: "100%", width: pct + "%", background: c.color,
                            borderRadius: 3, transition: "width 0.4s ease", flexShrink: 0 }} />
                      ) : null;
                    })}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 8 }}>
                    {catBreakdown.slice(0, 5).map(({ cat }) => {
                      const c = EX_CATS[cat] || EX_CATS.other;
                      return (
                        <span key={cat} style={{ display: "flex", alignItems: "center", gap: 4,
                          fontSize: 10.5, color: "var(--fg-3)" }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                          {c.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Spend by Category */}
            <div className="card" style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 14 }}>Spend by Category</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {catBreakdown.map(({ cat, amt, count, pct }) => {
                  const c        = EX_CATS[cat] || EX_CATS.other;
                  const isActive = catFilter === cat;
                  const dimmed   = catFilter !== "all" && !isActive;
                  return (
                    <div key={cat}
                      onClick={() => setCatFilter(isActive ? "all" : cat)}
                      style={{
                        padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                        background: isActive ? c.color + "10" : "var(--ink-50)",
                        border: `1.5px solid ${isActive ? c.color + "60" : "transparent"}`,
                        opacity: dimmed ? 0.4 : 1,
                        transition: "all 0.15s",
                      }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9,
                          background: c.color + "20", display: "flex", alignItems: "center",
                          justifyContent: "center", flexShrink: 0 }}>
                          <Icon name={c.icon} size={15} color={c.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--fg-1)" }}>{c.label}</span>
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: c.color }}>
                              {pct}%
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 1 }}>
                            <span style={{ fontSize: 11, color: "var(--fg-3)" }}>
                              {count} claim{count !== 1 ? "s" : ""}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-2)" }}>
                              AED {amt.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Bar */}
                      <div style={{ marginTop: 8, height: 4, borderRadius: 3,
                        background: "var(--ink-100)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: pct + "%", background: c.color,
                          borderRadius: 3, transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {catFilter !== "all" && (
                <button onClick={() => setCatFilter("all")}
                  style={{ marginTop: 12, width: "100%", padding: "6px 0", borderRadius: 8,
                    border: "1px solid var(--border-subtle)", background: "var(--ink-50)",
                    fontSize: 12, fontWeight: 600, color: "var(--fg-3)", cursor: "pointer",
                    fontFamily: "var(--font-sans)", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 5 }}>
                  <Icon name="x" size={12} color="var(--fg-3)" /> Clear filter
                </button>
              )}
            </div>

            {/* Payment Type breakdown */}
            {paymentBreakdown.length > 0 && (
              <div className="card" style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 14 }}>By Payment Type</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {paymentBreakdown.map(({ type, amt, pct }) => {
                    const pt = PAYMENT_TYPES[type] || PAYMENT_TYPES.other;
                    return (
                      <div key={type}>
                        <div style={{ display: "flex", justifyContent: "space-between",
                          alignItems: "center", marginBottom: 4 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 6,
                            fontSize: 12, fontWeight: 600, color: "var(--fg-2)" }}>
                            <span style={{ width: 20, height: 20, borderRadius: 5,
                              background: pt.color + "18", display: "inline-flex",
                              alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Icon name={pt.icon} size={11} color={pt.color} />
                            </span>
                            {pt.label}
                          </span>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: pt.color }}>{pct}%</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 3, background: "var(--ink-100)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: pct + "%", background: pt.color,
                            borderRadius: 3, transition: "width 0.4s ease" }} />
                        </div>
                        <div style={{ fontSize: 10.5, color: "var(--fg-4)", textAlign: "right", marginTop: 2 }}>
                          AED {amt.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showNew && (
        <NewClaimModal employees={employees} onClose={() => setShowNew(false)} onSave={handleNew} />
      )}

      {editExp && (
        <NewClaimModal
          employees={employees}
          initial={editExp}
          onClose={() => setEditExp(null)}
          onSave={handleEdit}
        />
      )}
    </div>
  );
}

Object.assign(window, { ExpensePage });

export default ExpensePage;
