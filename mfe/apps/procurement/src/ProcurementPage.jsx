import React from "react";
import { Icon, Button, IconButton, Meter } from "./legacy.jsx";
import "./setup.js";
const {
  useState:  useStatePR,
  useMemo:   useMemoPR,
  useEffect: useEffectPR,
  useCallback: useCallbackPR,
} = React;

// ── Canonical 11-stage lifecycle (mirrors backend/models/Procurement.js) ────────
const PROC_STAGES = [
  { key: "enquiry",             label: "Enquiry",             icon: "search",        department: "Project Manager",  action: "Study project scope & requirements",   responsible: "Project Manager", phase: "Initiation" },
  { key: "prepare_list",        label: "Prepare List",        icon: "list-checks",   department: "Project Engineer", action: "Material & Labour List Preparation",   responsible: "Procurement",     phase: "Initiation" },
  { key: "quotation",           label: "Quotation (RFQ)",     icon: "file-text",     department: "Procurement",      action: "Sourcing & Sending RFQ to Vendors",    responsible: "Procurement",     phase: "Sourcing" },
  { key: "comparison",          label: "Comparison",          icon: "scale",         department: "Procurement",      action: "Technical & Price Comparison (Min 3)", responsible: "Project Manager", phase: "Sourcing" },
  { key: "approval",            label: "Approval",            icon: "check-circle",  department: "Project Manager",  action: "Quote Review & Final Approval",        responsible: "Procurement",     phase: "Sourcing" },
  { key: "lpo",                 label: "LPO Issue",           icon: "file-output",   department: "Procurement",      action: "Create & Send Local Purchase Order",   responsible: "Vendor",          phase: "Ordering" },
  { key: "proforma",            label: "Proforma Invoice",    icon: "receipt",       department: "Procurement",      action: "Collect Invoice for Payment",          responsible: "Accounts",        phase: "Payment" },
  { key: "payment_application", label: "Payment Application", icon: "file-plus",     department: "Procurement",      action: "Generate Payment Application",         responsible: "Project Manager", phase: "Payment" },
  { key: "payment_appr",        label: "Payment Approval",    icon: "badge-check",   department: "Project Manager",  action: "Review & Approve Payment",             responsible: "Accountant",      phase: "Payment" },
  { key: "payment_release",     label: "Payment Release",     icon: "banknote",      department: "Accountant",       action: "Issue Cheque / Bank Transfer",         responsible: "Procurement",     phase: "Payment" },
  { key: "logistics",           label: "Logistics",           icon: "truck",         department: "Procurement",      action: "Arrange Loading & Site Delivery",      responsible: "Store / Site",    phase: "Delivery" },
];
const STAGE_KEYS  = PROC_STAGES.map(s => s.key);
const STAGE_BY_KEY = PROC_STAGES.reduce((m, s) => { m[s.key] = s; return m; }, {});
const PHASE_COLOR = {
  Initiation: "#2563B0", Sourcing: "#D78A14", Ordering: "#534AB7", Payment: "#1F8A52", Delivery: "#0F6E56",
};

const STATUS_META = {
  in_progress: { label: "In Progress", color: "#2563B0", bg: "#EFF6FF" },
  completed:   { label: "Completed",   color: "#1F8A52", bg: "#ECFDF5" },
  on_hold:     { label: "On Hold",     color: "#D78A14", bg: "#FEF8EC" },
  cancelled:   { label: "Cancelled",   color: "#C0263A", bg: "#FFF1F2" },
};
const PRIORITY_META = {
  low:    { label: "Low",    color: "#6B7280" },
  normal: { label: "Normal", color: "#2563B0" },
  high:   { label: "High",   color: "#D78A14" },
  urgent: { label: "Urgent", color: "#C0263A" },
};
const REQ_DEPARTMENTS = ["Operations", "Warehouse", "Fleet", "Finance", "Sales", "Technology", "Legal & PRO", "People & Culture"];

const procStageIndex = k => STAGE_KEYS.indexOf(k);
const AED = n => "AED " + (Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const fmtDatePR = d => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return dt.getDate() + " " + m[dt.getMonth()] + " " + dt.getFullYear();
};

// ── BOQ (Bill of Quantities) cost-code helpers — material & labour list ──────────
const BOQ_UNITS = ["LS", "Nos.", "M²", "M³", "LM", "RM", "Lot", "kg", "ton", "ltr", "bag", "set", "hrs", "days"];
const BOQ_CATEGORIES = [
  "Preliminaries", "Mobilization", "Demolition Works", "Civil Works",
  "Walls, Partition & Finishes", "Gypsum Work", "Glass Work", "Flooring & Tiling",
  "Electrical Work", "Plumbing", "HVAC", "Painting", "Joinery Works", "Signage", "Additional",
];
const VAT_RATE = 0.05;   // UAE VAT 5%

// Rate reader is backward-compatible with older rows that used `estPrice`/`type`.
const itemRate   = it => Number(it.unitPrice != null ? it.unitPrice : it.estPrice) || 0;
const lineAmount = it => (Number(it.qty) || 0) * itemRate(it);
const lineTarget = it => (Number(it.qty) || 0) * (Number(it.targetRate) || 0);

const itemsTotals = (items = []) => {
  const subtotal = items.reduce((s, it) => s + lineAmount(it), 0);
  const budget   = items.reduce((s, it) => s + lineTarget(it), 0);
  const vat = subtotal * VAT_RATE;
  return { subtotal, vat, grand: subtotal + vat, budget, variance: budget ? subtotal - budget : 0 };
};
const itemsByCategory = (items = []) => {
  const map = new Map();
  items.forEach(it => {
    const k = (it.category || "").trim() || "Uncategorised";
    map.set(k, (map.get(k) || 0) + lineAmount(it));
  });
  return Array.from(map, ([category, amount]) => ({ category, amount }));
};
const BLANK_ITEM = { category: "", description: "", unit: "Nos.", qty: 1, unitPrice: 0, targetRate: 0 };

// Derive one PO per awarded vendor: group awarded BOQ lines by their category's winner.
const buildVendorPOs = proc => {
  const items = proc.items || [];
  const awardByCat = {};
  (proc.categoryAwards || []).forEach(ca => { awardByCat[ca.category] = ca.vendor; });
  const byVendor = new Map();
  items.forEach(it => {
    const cat = (it.category || "").trim() || "Uncategorised";
    const vendor = awardByCat[cat];
    if (!vendor) return;                         // only lines awarded to a vendor
    if (!byVendor.has(vendor)) byVendor.set(vendor, []);
    byVendor.get(vendor).push(it);
  });
  return Array.from(byVendor, ([vendor, lines]) => {
    const subtotal = lines.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);
    const categories = [...new Set(lines.map(it => (it.category || "").trim() || "Uncategorised"))];
    return { vendor, lines, categories, subtotal, vat: subtotal * VAT_RATE, total: subtotal * (1 + VAT_RATE) };
  });
};

// ── Vendor quote comparison helpers (per-line rate matrix, min 3 vendors) ────────
const lineRateAmount = (it, j) => (Number(it.qty) || 0) * ((it.rates && Number(it.rates[j])) || 0);
// Per-vendor column totals across the BOQ items: subtotal → VAT → grand.
const vendorGrandTotals = (items = [], vendors = []) => vendors.map((v, j) => {
  const subtotal = items.reduce((s, it) => s + lineRateAmount(it, j), 0);
  return { vendor: v, subtotal, vat: subtotal * VAT_RATE, grand: subtotal * (1 + VAT_RATE) };
});
// Index of the cheapest vendor column that actually has figures (the suggested award).
const lowestVendorIdx = totals => {
  let idx = -1, min = Infinity;
  totals.forEach((t, j) => { if (t.subtotal > 0 && t.grand < min) { min = t.grand; idx = j; } });
  return idx;
};

const BLANK_PROC = {
  title: "", department: "Operations", vendor: "", projectId: "", projectName: "",
  raisedBy: "", priority: "normal", estValue: "", description: "",
};

// ── Vendor dropdown — sourced from Parties (type = vendor) ──────────────────────
function VendorSelect({ value, onChange }) {
  const [vendors, setVendors] = useStatePR(window._vendorCache || []);
  const [loading, setLoading] = useStatePR(!window._vendorCache);

  useEffectPR(() => {
    if (window._vendorCache) return;
    fetch(`${window.API}/parties?type=vendor&status=active`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        window._vendorCache = list;
        setVendors(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const known = vendors.some(v => v.name === value);

  return (
    <>
      <select className="form-input" value={value || ""} onChange={e => onChange(e.target.value)}>
        <option value="">{loading ? "Loading vendors…" : "— Select vendor —"}</option>
        {/* Preserve a previously-saved value even if it's not in the active list */}
        {value && !known && <option value={value}>{value}</option>}
        {vendors.map(v => (
          <option key={v.partyId} value={v.name}>{v.name}</option>
        ))}
      </select>
      {!loading && vendors.length === 0 && (
        <div style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 4 }}>
          No vendors yet — add them under Finance &amp; Accounting → Parties.
        </div>
      )}
    </>
  );
}

// ── Employee dropdown — sourced from the employee directory ─────────────────────
function EmployeeSelect({ value, onChange }) {
  const [emps, setEmps] = useStatePR(window._employeeCache || []);
  const [loading, setLoading] = useStatePR(!window._employeeCache);

  useEffectPR(() => {
    if (window._employeeCache) return;
    fetch(`${window.API}/employees`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        window._employeeCache = list;
        setEmps(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const known = emps.some(e => e.name === value);

  return (
    <select className="form-input" value={value || ""} onChange={e => onChange(e.target.value)}>
      <option value="">{loading ? "Loading employees…" : "— Select employee —"}</option>
      {value && !known && <option value={value}>{value}</option>}
      {emps.map(e => (
        <option key={e.empId || e._id} value={e.name}>
          {e.name}{e.title ? " — " + e.title : ""}
        </option>
      ))}
    </select>
  );
}

// ── Project dropdown — sourced from already-created Projects ────────────────────
// Named ProcProjectSelect to avoid clashing with the shared ProjectSelect in
// Primitives.jsx (party-filtered, used by Expenses) — all .jsx share one global scope.
function ProcProjectSelect({ value, name, onChange }) {
  const [projects, setProjects] = useStatePR(window._projectCache || []);
  const [loading, setLoading]   = useStatePR(!window._projectCache);

  useEffectPR(() => {
    if (window._projectCache) return;
    fetch(`${window.API}/projects`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        window._projectCache = list;
        setProjects(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Preserve a previously-linked project even if it's not in the fetched list.
  const known = projects.some(p => p.projectId === value);

  return (
    <>
      <select
        className="form-input"
        value={value || ""}
        onChange={e => {
          const p = projects.find(x => x.projectId === e.target.value);
          onChange({ projectId: e.target.value, projectName: p ? p.title : "" });
        }}
      >
        <option value="">{loading ? "Loading projects…" : "— No linked project —"}</option>
        {value && !known && <option value={value}>{name || value}</option>}
        {projects.map(p => (
          <option key={p.projectId} value={p.projectId}>
            {p.title}{p.partyName ? " — " + p.partyName : ""}
          </option>
        ))}
      </select>
      {!loading && projects.length === 0 && (
        <div style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 4 }}>
          No projects yet — add them under Projects.
        </div>
      )}
    </>
  );
}

// ── Create / Edit modal ─────────────────────────────────────────────────────────
function ProcurementFormModal({ initial, onClose, onSave }) {
  const [form, setForm]   = useStatePR(initial || BLANK_PROC);
  const [saving, setSaving] = useStatePR(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const isEdit = !!initial;
  const valid = form.title.trim() && form.department;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    await onSave({ ...form, estValue: Number(form.estValue) || 0 });
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontWeight: 700, fontSize: 15 }}>{isEdit ? "Edit Procurement Request" : "New Procurement Request"}</div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label className="form-label">Title / Requirement *</label>
            <input className="form-input" placeholder="e.g. Steel reinforcement — Tower B slab" value={form.title} onChange={set("title")} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-row">
              <label className="form-label">Requesting Department *</label>
              <select className="form-input" value={form.department} onChange={set("department")}>
                {REQ_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={set("priority")}>
                {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-row">
              <label className="form-label">Estimated Value (AED)</label>
              <input className="form-input" type="number" min="0" placeholder="0" value={form.estValue} onChange={set("estValue")} />
            </div>
            <div className="form-row">
              <label className="form-label">Raised By</label>
              <EmployeeSelect value={form.raisedBy} onChange={v => setForm(p => ({ ...p, raisedBy: v }))} />
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Preferred / Suggested Vendor</label>
            <VendorSelect value={form.vendor} onChange={v => setForm(p => ({ ...p, vendor: v }))} />
          </div>

          <div className="form-row">
            <label className="form-label">Linked Project (optional)</label>
            <ProcProjectSelect
              value={form.projectId}
              name={form.projectName}
              onChange={({ projectId, projectName }) => setForm(p => ({ ...p, projectId, projectName }))}
            />
          </div>

          <div className="form-row">
            <label className="form-label">Scope / Description</label>
            <textarea className="form-input" rows={3} placeholder="Describe the requirement, specifications, and justification…"
              value={form.description} onChange={set("description")}
              style={{ resize: "vertical", fontFamily: "inherit", fontSize: 13 }} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!valid || saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Advance / sign-off modal ────────────────────────────────────────────────────
function AdvanceModal({ proc, onClose, onConfirm, onUploaded }) {
  const stage = STAGE_BY_KEY[proc.currentStage];
  const isFinal = procStageIndex(proc.currentStage) === STAGE_KEYS.length - 1;
  const [by, setBy]     = useStatePR("");
  const [note, setNote] = useStatePR("");
  const [patch, setPatch] = useStatePR({});
  const [saving, setSaving] = useStatePR(false);
  const setP = k => e => setPatch(p => ({ ...p, [k]: e.target.value }));

  // Proforma invoice attachment (step 7) — uploaded immediately, kept in local state.
  const FILE_BASE = (window.API || "").replace(/\/api$/, "");
  const [proformaFile, setProformaFile] = useStatePR(proc.proformaFile || null);
  const [uploadingPF, setUploadingPF]   = useStatePR(false);

  const uploadProforma = async (file) => {
    if (!file) return;
    setUploadingPF(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${window.API}/procurement/${proc.procId}/proforma-file`, { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Upload failed");
      const doc = await res.json();
      setProformaFile(doc.proformaFile || null);
      if (onUploaded) onUploaded(doc);
    } catch (e) { window.alert(e.message || "Could not upload the proforma invoice."); }
    setUploadingPF(false);
  };

  const removeProforma = async () => {
    try {
      const res = await fetch(`${window.API}/procurement/${proc.procId}/proforma-file`, { method: "DELETE" });
      const doc = await res.json();
      setProformaFile(null);
      if (onUploaded) onUploaded(doc);
    } catch (e) { console.error(e); }
  };

  const handleConfirm = async () => {
    setSaving(true);
    const cleanPatch = { ...patch };
    ["poAmount", "invoiceAmount", "paymentAmount"].forEach(k => {
      if (cleanPatch[k] !== undefined) cleanPatch[k] = Number(cleanPatch[k]) || 0;
    });
    await onConfirm({ by, note, patch: cleanPatch });
    setSaving(false);
  };

  // Stage-specific capture fields
  const extra = (() => {
    if (proc.currentStage === "lpo") return (
      <div style={{ padding: "10px 12px", background: "#EFF6FF", border: "1px solid #BBD3F0", borderRadius: 8, fontSize: 12, color: "#2563B0", marginBottom: 2 }}>
        <Icon name="info" size={13} /> Issue the Local Purchase Orders (one per awarded vendor) from the
        <strong> Issue LPOs</strong> button before signing off this stage.
      </div>
    );
    if (proc.currentStage === "payment_application") return (
      <div style={{ padding: "10px 12px", background: "#EFF6FF", border: "1px solid #BBD3F0", borderRadius: 8, fontSize: 12, color: "#2563B0", marginBottom: 2 }}>
        <Icon name="info" size={13} /> Generate the payment application (per vendor / PO) from the
        <strong> Payment Application</strong> button before signing off this stage.
      </div>
    );
    if (proc.currentStage === "proforma") return (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-row"><label className="form-label">Invoice / Proforma No.</label>
            <input className="form-input" placeholder="INV-0001" onChange={setP("invoiceNumber")} /></div>
          <div className="form-row"><label className="form-label">Invoice Amount (AED)</label>
            <input className="form-input" type="number" min="0" placeholder="0" onChange={setP("invoiceAmount")} /></div>
        </div>
        <div className="form-row">
          <label className="form-label">Proforma Invoice Document</label>
          {proformaFile ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", borderRadius: 8,
              border: "1px solid #D6F0E0", background: "#F0FAF4" }}>
              <Icon name="paperclip" size={14} color="#1F8A52" />
              <a href={FILE_BASE + proformaFile.filePath} target="_blank" rel="noreferrer" title={proformaFile.fileName}
                style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: "#1F8A52", textDecoration: "none",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{proformaFile.fileName}</a>
              {proformaFile.fileSizeMB > 0 && <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{proformaFile.fileSizeMB} MB</span>}
              <button title="Remove" onClick={removeProforma}
                style={{ width: 22, height: 22, borderRadius: 5, border: "none", background: "transparent", cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="x" size={12} color="#C0263A" />
              </button>
            </div>
          ) : (
            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 11px",
              borderRadius: 8, border: "1px dashed var(--border-strong)", cursor: uploadingPF ? "default" : "pointer",
              fontSize: 12.5, fontWeight: 600, color: uploadingPF ? "var(--fg-4)" : "var(--brand-burgundy)", background: "var(--bg-surface)" }}>
              <Icon name={uploadingPF ? "loader" : "upload"} size={14} />
              <span>{uploadingPF ? "Uploading…" : "Attach proforma invoice (PDF, image, Excel…)"}</span>
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.heic,.webp" disabled={uploadingPF}
                style={{ display: "none" }}
                onChange={e => { const f = e.target.files[0]; e.target.value = ""; uploadProforma(f); }} />
            </label>
          )}
        </div>
      </>
    );
    if (proc.currentStage === "payment_release") return (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-row"><label className="form-label">Payment Method</label>
            <select className="form-input" onChange={setP("paymentMethod")} defaultValue="">
              <option value="">— Select —</option>
              <option value="Cheque">Cheque</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
            </select></div>
          <div className="form-row"><label className="form-label">Paid Amount (AED)</label>
            <input className="form-input" type="number" min="0" placeholder="0" onChange={setP("paymentAmount")} /></div>
        </div>
        <div className="form-row"><label className="form-label">Reference / Cheque No.</label>
          <input className="form-input" placeholder="Txn / cheque reference" onChange={setP("paymentRef")} /></div>
      </>
    );
    if (proc.currentStage === "logistics") return (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-row"><label className="form-label">Delivered To (Site / Store)</label>
            <input className="form-input" placeholder="Site / store name" onChange={setP("deliveredTo")} /></div>
          <div className="form-row"><label className="form-label">Delivery Note No.</label>
            <input className="form-input" placeholder="DN-0001" onChange={setP("deliveryNote")} /></div>
        </div>
      </>
    );
    return null;
  })();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontWeight: 700, fontSize: 15 }}>Sign off — {stage.label}</div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div className="modal-body">
          <div style={{ padding: "10px 12px", background: "var(--ink-50)", borderRadius: 8, marginBottom: 14, fontSize: 12.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "var(--fg-3)" }}>Department</span><span style={{ fontWeight: 600 }}>{stage.department}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "var(--fg-3)" }}>Action</span><span style={{ fontWeight: 600, textAlign: "right" }}>{stage.action}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--fg-3)" }}>Responsible</span><span style={{ fontWeight: 600 }}>{stage.responsible}</span>
            </div>
          </div>

          {extra}

          <div className="form-row">
            <label className="form-label">Signed off by</label>
            <EmployeeSelect value={by} onChange={setBy} />
          </div>
          <div className="form-row">
            <label className="form-label">Note</label>
            <textarea className="form-input" rows={2} placeholder="Optional remarks for this stage…"
              value={note} onChange={e => setNote(e.target.value)}
              style={{ resize: "vertical", fontFamily: "inherit", fontSize: 13 }} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={saving}>
            {saving ? "Saving…" : isFinal ? "Complete Procurement" : "Sign off & Advance"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Material & Labour list builder — full-page view ─────────────────────────────
function ItemsPage({ proc, onBack, onSave }) {
  const [rows, setRows] = useStatePR(() =>
    (proc.items && proc.items.length) ? proc.items.map(r => ({ ...r })) : [{ ...BLANK_ITEM }]);
  const [saving, setSaving] = useStatePR(false);
  const setRow = (i, k, v) => setRows(rs => rs.map((r, j) => j === i ? { ...r, [k]: v } : r));
  const addRow = () => setRows(rs => [...rs, { ...BLANK_ITEM }]);
  const delRow = i => setRows(rs => (rs.length > 1 ? rs.filter((_, j) => j !== i) : rs));
  const totals = itemsTotals(rows);
  const cats = itemsByCategory(rows);

  // Export the Material & Labour list as a PDF (jsPDF + autotable, loaded in index.html).
  const downloadPdf = () => {
    if (!(window.jspdf && window.jspdf.jsPDF)) { window.alert("PDF library not loaded — check your connection."); return; }
    const clean = rows.filter(r => (r.description || "").trim() || lineAmount(r) > 0);
    if (!clean.length) { window.alert("Add at least one line item before exporting."); return; }

    const doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth(); const M = 40;

    // Header
    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(111, 25, 71);
    doc.text("Meridian ERP", M, 52);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text("Meridian Logistics DMCC · Dubai, UAE", M, 66);
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(111, 25, 71);
    doc.text("MATERIAL & LABOUR LIST", W - M, 50, { align: "right" });
    doc.setFontSize(11); doc.setTextColor(35, 31, 32);
    doc.text(String(proc.procId || ""), W - M, 67, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text(new Date().toISOString().slice(0, 10), W - M, 81, { align: "right" });
    doc.setDrawColor(111, 25, 71); doc.setLineWidth(2); doc.line(M, 92, W - M, 92);

    doc.setFontSize(10); doc.setTextColor(35, 31, 32);
    doc.text(doc.splitTextToSize("Project: " + String(proc.title || "—"), W - 2 * M), M, 112);

    const body = clean.map((r, n) => [
      String(n + 1), r.category || "", r.description || "", r.unit || "", String(Number(r.qty) || 0),
      AED(Number(r.unitPrice != null ? r.unitPrice : r.estPrice) || 0), AED(lineAmount(r)),
      AED(Number(r.targetRate) || 0), AED(lineTarget(r)),
    ]);
    doc.autoTable({
      startY: 124,
      head: [["SL", "Category", "Description", "Unit", "Qty", "Rate", "Amount", "Budget Rate", "Budget Amt"]],
      body,
      styles: { fontSize: 8.5, cellPadding: 4, lineColor: [221, 221, 221], lineWidth: 0.5 },
      headStyles: { fillColor: [243, 238, 241], textColor: [85, 85, 85], fontStyle: "bold" },
      columnStyles: { 0: { halign: "center", cellWidth: 22 }, 4: { halign: "right", cellWidth: 34 },
        5: { halign: "right", cellWidth: 60 }, 6: { halign: "right", cellWidth: 66 },
        7: { halign: "right", cellWidth: 60 }, 8: { halign: "right", cellWidth: 66 } },
      margin: { left: M, right: M },
    });

    let fy = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 200) + 18;
    const lx = W - M - 230, vx = W - M;
    const line = (label, val, opts = {}) => {
      doc.setFont("helvetica", opts.bold ? "bold" : "normal"); doc.setFontSize(opts.bold ? 11 : 10);
      doc.setTextColor(opts.green ? 31 : 35, opts.green ? 138 : 31, opts.green ? 82 : 32);
      doc.text(label, lx, fy); doc.text(AED(val), vx, fy, { align: "right" }); fy += opts.gap || 15;
    };
    line("Subtotal (ex. VAT)", totals.subtotal);
    line("VAT (5%)", totals.vat);
    doc.setDrawColor(111, 25, 71); doc.setLineWidth(1); doc.line(lx, fy - 4, vx, fy - 4); fy += 6;
    line("Grand Total", totals.grand, { bold: true, green: true });
    if (totals.budget > 0) {
      line("Budget (target)", totals.budget);
      line("Variance vs budget", totals.variance);
    }

    doc.save(`Material_Labour_List_${String(proc.procId || "").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`);
  };

  const persist = async (applyTotal) => {
    const clean = rows
      .filter(r => (r.description || "").trim() || lineAmount(r) > 0)
      .map(r => ({
        category:    (r.category || "").trim(),
        description: (r.description || "").trim(),
        unit:        r.unit || "Nos.",
        qty:         Number(r.qty) || 0,
        unitPrice:   Number(r.unitPrice != null ? r.unitPrice : r.estPrice) || 0,
        targetRate:  Number(r.targetRate) || 0,
      }));
    setSaving(true);
    await onSave(clean, applyTotal ? totals.subtotal : null);
    setSaving(false);
  };

  const th   = { padding: "10px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "var(--fg-3)", whiteSpace: "nowrap" };
  const cell = { padding: "6px 8px", borderTop: "1px solid var(--border-subtle)", verticalAlign: "middle" };
  // Compact field: trim vertical padding so text (incl. the <select> value) sits
  // centred. Horizontal padding + the select arrow's padding-right stay from CSS.
  const inp  = { height: 34, paddingTop: 5, paddingBottom: 5 };

  return (
    <div className="page">
      {/* Page head with back navigation */}
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={onBack} style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
              color: "var(--brand-burgundy)", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600 }}>
              <Icon name="arrow-left" size={13} /> Procurement Lifecycle
            </button>
            <span style={{ color: "var(--fg-4)" }}>/</span>
            <span>Step 2 · Prepare List</span>
          </div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="list-checks" size={20} /> Material &amp; Labour List
          </h1>
          <div className="page-sub">
            <span style={{ fontFamily: "monospace" }}>{proc.procId}</span> · {proc.title}
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Button variant="secondary" icon="download" onClick={downloadPdf}>Download PDF</Button>
          <Button variant="ghost" icon="arrow-left" onClick={onBack}>Back to Lifecycle</Button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 940 }}>
            <thead>
              <tr style={{ background: "var(--ink-50)" }}>
                <th style={{ ...th, width: 32, textAlign: "center" }}>#</th>
                <th style={{ ...th, width: 170 }}>Category</th>
                <th style={th}>Description</th>
                <th style={{ ...th, width: 78 }}>Unit</th>
                <th style={{ ...th, width: 66 }}>Qty</th>
                <th style={{ ...th, width: 110 }}>Rate (AED)</th>
                <th style={{ ...th, width: 118, textAlign: "right" }}>Amount</th>
                <th style={{ ...th, width: 110 }}>Budget Rate</th>
                <th style={{ ...th, width: 118, textAlign: "right" }}>Budget Amt</th>
                <th style={{ ...th, width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ ...cell, color: "var(--fg-3)", textAlign: "center", fontSize: 12 }}>{i + 1}</td>
                  <td style={cell}>
                    <input className="form-input" list="boq-cats" style={inp} placeholder="Civil Works…"
                      value={r.category || ""} onChange={e => setRow(i, "category", e.target.value)} />
                  </td>
                  <td style={cell}>
                    <input className="form-input" style={inp} placeholder="e.g. Masonry work — supply & install"
                      value={r.description} onChange={e => setRow(i, "description", e.target.value)} />
                  </td>
                  <td style={cell}>
                    <input className="form-input" list="proc-units" style={inp}
                      value={r.unit} onChange={e => setRow(i, "unit", e.target.value)} />
                  </td>
                  <td style={cell}>
                    <input className="form-input" type="number" min="0" style={inp}
                      value={r.qty} onChange={e => setRow(i, "qty", e.target.value)} />
                  </td>
                  <td style={cell}>
                    <input className="form-input" type="number" min="0" style={inp}
                      value={r.unitPrice != null ? r.unitPrice : r.estPrice} onChange={e => setRow(i, "unitPrice", e.target.value)} />
                  </td>
                  <td style={{ ...cell, textAlign: "right", fontWeight: 600, whiteSpace: "nowrap", fontSize: 13 }}>{AED(lineAmount(r))}</td>
                  <td style={cell}>
                    <input className="form-input" type="number" min="0" style={inp} placeholder="0"
                      value={r.targetRate} onChange={e => setRow(i, "targetRate", e.target.value)} />
                  </td>
                  <td style={{ ...cell, textAlign: "right", fontWeight: 600, whiteSpace: "nowrap", fontSize: 12.5, color: "var(--fg-3)" }}>{AED(lineTarget(r))}</td>
                  <td style={{ ...cell, textAlign: "center" }}>
                    <button title="Remove row" onClick={() => delRow(i)}
                      style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #FFF1F2",
                        background: "#FFF1F2", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="trash-2" size={13} color="#C0263A" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <datalist id="proc-units">
            {BOQ_UNITS.map(u => <option key={u} value={u} />)}
          </datalist>
          <datalist id="boq-cats">
            {BOQ_CATEGORIES.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>

        <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border-subtle)" }}>
          <button className="btn btn-sm" onClick={addRow}>
            <Icon name="plus" size={12} /> Add line item
          </button>
        </div>
      </div>

      {/* Totals — category breakdown + money summary */}
      <div style={{ display: "flex", gap: 16, marginTop: 18, flexWrap: "wrap", alignItems: "stretch" }}>
        <div className="card card-pad" style={{ flex: "1 1 300px", minWidth: 260 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em",
            color: "var(--fg-3)", marginBottom: 8 }}>Category Breakdown</div>
          {cats.length ? cats.map(c => (
            <div key={c.category} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "7px 0", borderTop: "1px solid var(--border-subtle)", fontSize: 12.5 }}>
              <span style={{ color: "var(--fg-2)" }}>{c.category}</span>
              <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{AED(c.amount)}</span>
            </div>
          )) : <div style={{ fontSize: 12, color: "var(--fg-4)" }}>Add line items to see the breakdown.</div>}
        </div>

        <div className="card card-pad" style={{ flex: "1 1 300px", minWidth: 260 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13 }}>
            <span style={{ color: "var(--fg-2)" }}>Subtotal (ex. VAT)</span>
            <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{AED(totals.subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13 }}>
            <span style={{ color: "var(--fg-2)" }}>VAT (5%)</span>
            <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{AED(totals.vat)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", marginTop: 4,
            borderTop: "2px solid var(--border-subtle)", fontSize: 15 }}>
            <span style={{ fontWeight: 700 }}>Grand Total</span>
            <span style={{ fontWeight: 700, color: "#1F8A52", whiteSpace: "nowrap" }}>{AED(totals.grand)}</span>
          </div>
          {totals.budget > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12.5,
                color: "var(--fg-3)", borderTop: "1px solid var(--border-subtle)", marginTop: 6 }}>
                <span>Budget (target)</span>
                <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{AED(totals.budget)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12.5 }}>
                <span style={{ color: "var(--fg-3)" }}>Variance vs budget</span>
                <span style={{ fontWeight: 700, whiteSpace: "nowrap", color: totals.variance > 0 ? "#C0263A" : "#1F8A52" }}>
                  {totals.variance > 0 ? "+" : ""}{AED(totals.variance)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Save bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
        <Button variant="ghost" onClick={onBack}>Cancel</Button>
        <button className="btn" onClick={() => persist(true)} disabled={saving}
          title="Save and copy the grand total into the request's estimated value">
          Save &amp; set Est. Value
        </button>
        <button className="btn btn-primary" onClick={() => persist(false)} disabled={saving}>
          {saving ? "Saving…" : "Save List"}
        </button>
      </div>
    </div>
  );
}

// ── Vendor quote comparison — per-category vendor tables (step 4) ────────────────
// Each work category (trade) has its OWN vendor columns (min 3), its own per-line
// rates and its own award — like separate trade quotation sheets.
function QuotesPage({ proc, onBack, onSave, onUploaded, onManageItems }) {
  const baseItems = proc.items || [];

  // Attached vendor quote docs, read live from the (refreshed) proc prop.
  const FILE_BASE = (window.API || "").replace(/\/api$/, "");
  const quoteFiles = proc.quoteFiles || [];
  const quoteFileFor = (cat, vendor) =>
    quoteFiles.find(q => q.category === cat && q.vendor === vendor) || null;

  // Tracks which (category|vendor) cell is currently uploading, for spinner state.
  const [uploading, setUploading] = useStatePR("");

  const uploadQuoteFile = async (cat, vendor, file) => {
    if (!file || !(vendor || "").trim()) return;
    const key = cat + "|" + vendor;
    setUploading(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", cat);
      fd.append("vendor", vendor);
      const res = await fetch(`${window.API}/procurement/${proc.procId}/quote-file`, { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Upload failed");
      const doc = await res.json();
      if (onUploaded) onUploaded(doc);
    } catch (e) { window.alert(e.message || "Could not upload the quote file."); }
    setUploading("");
  };

  const removeQuoteFile = async (cat, vendor) => {
    if (!window.confirm(`Remove the attached quote for ${vendor}?`)) return;
    try {
      const res = await fetch(`${window.API}/procurement/${proc.procId}/quote-file?category=${encodeURIComponent(cat)}&vendor=${encodeURIComponent(vendor)}`, { method: "DELETE" });
      const doc = await res.json();
      if (onUploaded) onUploaded(doc);
    } catch (e) { console.error(e); }
  };

  // Group line indices by category (first-seen order).
  const groups = (() => {
    const order = [], map = new Map();
    baseItems.forEach((it, i) => {
      const k = (it.category || "").trim() || "Uncategorised";
      if (!map.has(k)) { map.set(k, []); order.push(k); }
      map.get(k).push(i);
    });
    return order.map(cat => ({ cat, idxs: map.get(cat) }));
  })();

  // Per-category vendor lists (min 3) + per-item rate rows aligned to them.
  const init = (() => {
    const cv = {}, rt = {}, aw = {};
    const storedAward = {};
    (proc.categoryAwards || []).forEach(ca => { storedAward[ca.category] = ca.vendor; });
    groups.forEach(g => {
      const stored = (proc.categoryVendors || []).find(x => x.category === g.cat);
      const vlist = (stored && stored.vendors && stored.vendors.length) ? stored.vendors.slice() : [];
      while (vlist.length < 3) vlist.push("");
      cv[g.cat] = vlist;
      g.idxs.forEach(i => {
        const it = baseItems[i];
        rt[i] = vlist.map((_, j) => (it.rates && it.rates[j]) ? it.rates[j] : "");
      });
      aw[g.cat] = storedAward[g.cat] ? vlist.indexOf(storedAward[g.cat]) : -1;
    });
    return { cv, rt, aw };
  })();

  const [catVendors, setCatVendors] = useStatePR(init.cv);
  const [rates, setRates]           = useStatePR(init.rt);
  const [catAward, setCatAward]     = useStatePR(init.aw);
  const [saving, setSaving]         = useStatePR(false);

  const qtyOf  = i => Number(baseItems[i].qty) || 0;
  const idxsOf = cat => (groups.find(g => g.cat === cat) || { idxs: [] }).idxs;

  const setVendor     = (cat, j, name) => setCatVendors(cv => ({ ...cv, [cat]: cv[cat].map((x, k) => k === j ? name : x) }));
  const setRate       = (i, j, val)    => setRates(r => ({ ...r, [i]: r[i].map((x, k) => k === j ? val : x) }));
  const awardCategory = (cat, j)       => setCatAward(a => ({ ...a, [cat]: a[cat] === j ? -1 : j }));
  const addVendor = cat => {
    setCatVendors(cv => ({ ...cv, [cat]: [...cv[cat], ""] }));
    setRates(r => { const next = { ...r }; idxsOf(cat).forEach(i => { next[i] = [...next[i], ""]; }); return next; });
  };
  const removeVendor = (cat, j) => {
    if ((catVendors[cat] || []).length <= 3) return;
    setCatVendors(cv => ({ ...cv, [cat]: cv[cat].filter((_, k) => k !== j) }));
    setRates(r => { const next = { ...r }; idxsOf(cat).forEach(i => { next[i] = next[i].filter((_, k) => k !== j); }); return next; });
    setCatAward(a => ({ ...a, [cat]: a[cat] === j ? -1 : a[cat] > j ? a[cat] - 1 : a[cat] }));
  };

  const namedCount = c => (catVendors[c] || []).filter(v => (v || "").trim()).length;
  const colSubCat  = (cat, j) => idxsOf(cat).reduce((s, i) => s + qtyOf(i) * (Number(rates[i][j]) || 0), 0);

  // Export the comparison as a PDF — one rate/amount table per category (landscape),
  // followed by the overall award summary. Pass a category name to export just that
  // one trade sheet. Uses jsPDF + autotable (loaded in index.html).
  const downloadPdf = (onlyCat) => {
    if (!(window.jspdf && window.jspdf.jsPDF)) { window.alert("PDF library not loaded — check your connection."); return; }
    if (!baseItems.length) { window.alert("Build the Material & Labour list first."); return; }
    const renderGroups = onlyCat ? groups.filter(g => g.cat === onlyCat) : groups;
    if (!renderGroups.length) return;

    const doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
    const W = doc.internal.pageSize.getWidth(); const PH = doc.internal.pageSize.getHeight(); const M = 30;

    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(111, 25, 71);
    doc.text("Meridian ERP", M, 46);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text("Meridian Logistics DMCC · Dubai, UAE", M, 59);
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(111, 25, 71);
    doc.text(onlyCat ? "VENDOR QUOTE — " + onlyCat.toUpperCase() : "VENDOR QUOTE COMPARISON", W - M, 44, { align: "right" });
    doc.setFontSize(10); doc.setTextColor(35, 31, 32);
    doc.text(String(proc.procId || ""), W - M, 59, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(120, 120, 120);
    doc.text(new Date().toISOString().slice(0, 10), W - M, 72, { align: "right" });
    doc.setDrawColor(111, 25, 71); doc.setLineWidth(1.5); doc.line(M, 82, W - M, 82);
    doc.setFontSize(9.5); doc.setTextColor(35, 31, 32);
    doc.text(doc.splitTextToSize("Project: " + String(proc.title || "—"), W - 2 * M), M, 98);

    let startY = 112;

    renderGroups.forEach(g => {
      const vIdx = (catVendors[g.cat] || []).map((v, j) => ({ v: (v || "").trim(), j })).filter(x => x.v);
      const award = catAward[g.cat];
      const budgetSub = g.idxs.reduce((s, i) => s + qtyOf(i) * (Number(baseItems[i].targetRate) || 0), 0);

      if (startY > PH - 120) { doc.addPage(); startY = 50; }

      doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(111, 25, 71);
      doc.text(g.cat.toUpperCase(), M, startY);
      if (award != null && award >= 0 && (catVendors[g.cat] || [])[award]) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(31, 138, 82);
        doc.text("AWARDED → " + catVendors[g.cat][award], M + 170, startY);
      }

      // Two-row header: fixed cols rowSpan 2, then Budget + each vendor span 2 (Rate, Amount).
      const headRow1 = [
        { content: "SL", rowSpan: 2 }, { content: "Description", rowSpan: 2 },
        { content: "Unit", rowSpan: 2 }, { content: "Qty", rowSpan: 2 },
        { content: "Budget", colSpan: 2, styles: { halign: "center" } },
      ];
      vIdx.forEach(x => headRow1.push({ content: x.v, colSpan: 2, styles: { halign: "center" } }));
      const headRow2 = ["Rate", "Amount"];
      vIdx.forEach(() => { headRow2.push("Rate", "Amount"); });

      const body = g.idxs.map((i, n) => {
        const qty = qtyOf(i); const it = baseItems[i];
        const row = [String(n + 1), it.description || "", it.unit || "", String(qty),
          AED(Number(it.targetRate) || 0), AED(qty * (Number(it.targetRate) || 0))];
        vIdx.forEach(x => { const rate = Number(rates[i][x.j]) || 0; row.push(AED(rate), AED(qty * rate)); });
        return row;
      });

      // Totals rows (label spans the 4 fixed columns).
      const mkTotal = (label, budgetVal, perVendor, opts = {}) => {
        const r = [{ content: label, colSpan: 4, styles: { halign: "right", fontStyle: opts.bold ? "bold" : "normal" } },
          { content: "", styles: {} }, { content: AED(budgetVal), styles: { halign: "right", fontStyle: opts.bold ? "bold" : "normal" } }];
        vIdx.forEach((x, k) => r.push({ content: "", styles: {} },
          { content: AED(perVendor[k]), styles: { halign: "right", fontStyle: opts.bold ? "bold" : "normal", textColor: (opts.bold && award === x.j) ? [31, 138, 82] : [35, 31, 32] } }));
        return r;
      };
      const subs  = vIdx.map(x => colSubCat(g.cat, x.j));
      body.push(mkTotal("Total (ex VAT)", budgetSub, subs));
      body.push(mkTotal("VAT (5%)", budgetSub * VAT_RATE, subs.map(s => s * VAT_RATE)));
      body.push(mkTotal("Grand Total", budgetSub * (1 + VAT_RATE), subs.map(s => s * (1 + VAT_RATE)), { bold: true }));

      doc.autoTable({
        startY: startY + 8,
        head: [headRow1, headRow2],
        body,
        styles: { fontSize: 8, cellPadding: 3, lineColor: [221, 221, 221], lineWidth: 0.5, overflow: "linebreak" },
        headStyles: { fillColor: [243, 238, 241], textColor: [85, 85, 85], fontStyle: "bold", halign: "center" },
        columnStyles: { 0: { halign: "center", cellWidth: 20 }, 1: { cellWidth: 150 }, 2: { halign: "center", cellWidth: 34 },
          3: { halign: "right", cellWidth: 30 }, 4: { halign: "right" }, 5: { halign: "right" } },
        margin: { left: M, right: M },
        tableWidth: "auto",
      });
      startY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : startY + 60) + 22;
    });

    // Award summary — only on the full export (per-category sheets show their own totals).
    if (!onlyCat) {
    const sumRows = groups.map(g => {
      const aj = catAward[g.cat]; const vlist = catVendors[g.cat] || []; const awarded = (aj != null && aj >= 0);
      return { cat: g.cat, vendor: awarded ? (vlist[aj] || "") : "",
        budget: g.idxs.reduce((s, i) => s + qtyOf(i) * (Number(baseItems[i].targetRate) || 0), 0),
        amount: awarded ? g.idxs.reduce((s, i) => s + qtyOf(i) * (Number(rates[i][aj]) || 0), 0) : 0 };
    });
    const awSub = sumRows.reduce((s, r) => s + r.amount, 0);
    const awBudget = sumRows.reduce((s, r) => s + r.budget, 0);
    if (startY > PH - 140) { doc.addPage(); startY = 50; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(111, 25, 71);
    doc.text("AWARD SUMMARY", M, startY);
    doc.autoTable({
      startY: startY + 8,
      head: [["Category", "Awarded Vendor", "Budget", "Awarded Amount"]],
      body: sumRows.map(r => [r.cat, r.vendor || "— not awarded —", AED(r.budget), r.vendor ? AED(r.amount) : "—"]),
      foot: [
        [{ content: "Subtotal (awarded)", colSpan: 2, styles: { halign: "right" } }, AED(awBudget), AED(awSub)],
        [{ content: "VAT (5%)", colSpan: 3, styles: { halign: "right" } }, AED(awSub * VAT_RATE)],
        [{ content: "Grand Total (incl. VAT)", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
          { content: AED(awSub * (1 + VAT_RATE)), styles: { fontStyle: "bold", textColor: [31, 138, 82] } }],
      ],
      styles: { fontSize: 9, cellPadding: 4, lineColor: [221, 221, 221], lineWidth: 0.5 },
      headStyles: { fillColor: [243, 238, 241], textColor: [85, 85, 85], fontStyle: "bold" },
      footStyles: { fillColor: [248, 246, 247], textColor: [35, 31, 32] },
      columnStyles: { 2: { halign: "right" }, 3: { halign: "right" } },
      margin: { left: M, right: M },
    });
    }

    const catTag = onlyCat ? "_" + onlyCat.replace(/[^a-zA-Z0-9_-]/g, "_") : "";
    doc.save(`Vendor_Comparison_${String(proc.procId || "").replace(/[^a-zA-Z0-9_-]/g, "_")}${catTag}.pdf`);
  };

  const persist = async () => {
    const categoryVendors = groups.map(g => ({ category: g.cat, vendors: (catVendors[g.cat] || []).map(v => (v || "").trim()) }));
    const newItems = baseItems.map((it, i) => {
      const cat = (it.category || "").trim() || "Uncategorised";
      const aj = catAward[cat];
      const r = rates[i] || [];
      const awardedRate = (aj != null && aj >= 0) ? (Number(r[aj]) || 0) : (Number(it.unitPrice) || 0);
      return {
        category: it.category, description: it.description, unit: it.unit, qty: Number(it.qty) || 0,
        targetRate: Number(it.targetRate) || 0, unitPrice: awardedRate, rates: r.map(x => Number(x) || 0),
      };
    });
    const categoryAwards = groups.map(g => {
      const aj = catAward[g.cat]; const vlist = catVendors[g.cat] || [];
      return (aj != null && aj >= 0 && vlist[aj] && vlist[aj].trim()) ? { category: g.cat, vendor: vlist[aj].trim() } : null;
    }).filter(Boolean);
    const awardedVendors = [...new Set(categoryAwards.map(c => c.vendor))];
    const estValue = groups.reduce((s, g) => {
      const aj = catAward[g.cat]; if (aj == null || aj < 0) return s;
      return s + g.idxs.reduce((ss, i) => ss + qtyOf(i) * (Number(rates[i][aj]) || 0), 0);
    }, 0);
    setSaving(true);
    await onSave({ items: newItems, categoryVendors, categoryAwards, vendor: awardedVendors.join(", "),
      estValue: categoryAwards.length ? estValue : undefined });
    setSaving(false);
  };

  const th    = { padding: "9px 8px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--fg-3)", whiteSpace: "nowrap", borderBottom: "1px solid var(--border-subtle)" };
  const vTh   = { padding: "7px 8px", borderBottom: "1px solid var(--border-subtle)", borderLeft: "2px solid var(--border-subtle)", verticalAlign: "top" };
  const cell  = { padding: "5px 8px", borderTop: "1px solid var(--border-subtle)", fontSize: 12, verticalAlign: "middle" };
  const num   = { ...cell, textAlign: "right", whiteSpace: "nowrap" };
  const inp   = { height: 32, paddingTop: 4, paddingBottom: 4, textAlign: "right" };

  const pageHead = (
    <div className="page-head">
      <div>
        <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
            color: "var(--brand-burgundy)", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600 }}>
            <Icon name="arrow-left" size={13} /> Procurement Lifecycle
          </button>
          <span style={{ color: "var(--fg-4)" }}>/</span>
          <span>Step 4 · Comparison</span>
        </div>
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="scale" size={20} /> Vendor Quote Comparison
        </h1>
        <div className="page-sub">
          <span style={{ fontFamily: "monospace" }}>{proc.procId}</span> · {proc.title}
        </div>
      </div>
      <div className="row" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, padding: "5px 11px", borderRadius: 6, background: "var(--ink-50)", color: "var(--fg-2)" }}>
          {groups.length} categor{groups.length === 1 ? "y" : "ies"}
        </div>
        <Button variant="secondary" icon="download" onClick={() => downloadPdf()}>Download PDF</Button>
        <Button variant="ghost" icon="arrow-left" onClick={onBack}>Back to Lifecycle</Button>
      </div>
    </div>
  );

  // The comparison is built on the BOQ — require items first.
  if (baseItems.length === 0) return (
    <div className="page">
      {pageHead}
      <div className="card card-pad" style={{ textAlign: "center", padding: "48px 24px" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--plum-50)", color: "var(--brand-burgundy)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
          <Icon name="list-checks" size={26} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Build the Material &amp; Labour list first</div>
        <div style={{ fontSize: 12.5, color: "var(--fg-3)", margin: "6px 0 16px", maxWidth: 380, marginInline: "auto" }}>
          The vendor comparison quotes a rate against each BOQ line item, grouped by category.
        </div>
        <Button variant="primary" icon="list-checks" onClick={() => onManageItems(proc)}>Go to Material &amp; Labour List</Button>
      </div>
    </div>
  );

  return (
    <div className="page">
      {pageHead}

      {groups.map(g => {
        const vends = catVendors[g.cat] || [];
        const totals = vends.map((v, j) => { const sub = colSubCat(g.cat, j); return { sub, vat: sub * VAT_RATE, grand: sub * (1 + VAT_RATE) }; });
        const budget = g.idxs.reduce((s, i) => s + qtyOf(i) * (Number(baseItems[i].targetRate) || 0), 0);
        // Rank the quoted vendor columns by grand total to flag the 1st and 2nd cheapest.
        const ranked = totals.map((t, j) => ({ j, grand: t.grand, sub: t.sub })).filter(t => t.sub > 0).sort((a, b) => a.grand - b.grand);
        const lowestIdx       = ranked.length     ? ranked[0].j : -1;
        const secondLowestIdx = ranked.length > 1 ? ranked[1].j : -1;
        const award = catAward[g.cat];
        const nm = namedCount(g.cat);
        const totalRow = (label, budgetVal, vendorVals, opts = {}) => (
          <tr style={{ background: opts.bg || "var(--ink-50)", fontWeight: opts.bold ? 700 : 600 }}>
            <td colSpan={4} style={{ ...num, fontSize: opts.bold ? 12.5 : 11.5, color: "var(--fg-2)" }}>{label}</td>
            <td style={cell} />
            <td style={{ ...num, fontSize: 12 }}>{AED(budgetVal)}</td>
            {vends.map((v, j) => {
              const over = budgetVal > 0 && vendorVals[j] > budgetVal;
              return (
                <React.Fragment key={j}>
                  <td style={{ ...cell, borderLeft: "2px solid var(--border-subtle)" }} />
                  <td style={{ ...num, fontSize: 12, color: over ? "#C0263A" : award === j ? "#1F8A52" : "var(--fg-1)" }}
                    title={over ? "Over budget" : undefined}>{AED(vendorVals[j])}</td>
                </React.Fragment>
              );
            })}
          </tr>
        );
        return (
          <div key={g.cat} className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 18 }}>
            {/* Category header bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "11px 14px",
              borderBottom: "1px solid var(--border-subtle)", background: "var(--plum-50)", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-burgundy)", textTransform: "uppercase", letterSpacing: ".04em" }}>{g.cat}</span>
                {award != null && award >= 0 && vends[award] && (
                  <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#6D28D918", color: "#6D28D9" }}>AWARDED → {vends[award]}</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                  background: nm >= 3 ? "#ECFDF5" : "#FEF8EC", color: nm >= 3 ? "#1F8A52" : "#9A6A11" }}>{nm >= 3 ? `${nm} vendors` : `${nm} of min. 3`}</span>
                <button className="btn btn-sm" onClick={() => downloadPdf(g.cat)} title={`Download the ${g.cat} comparison as PDF`}><Icon name="download" size={12} /> PDF</button>
                <button className="btn btn-sm" onClick={() => addVendor(g.cat)}><Icon name="plus" size={12} /> Add vendor</button>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 + vends.length * 200 }}>
                <thead>
                  <tr style={{ background: "var(--ink-50)" }}>
                    <th style={{ ...th, width: 36, textAlign: "center" }} rowSpan={2}>SL</th>
                    <th style={{ ...th, minWidth: 260 }} rowSpan={2}>Description</th>
                    <th style={{ ...th, width: 64 }} rowSpan={2}>Unit</th>
                    <th style={{ ...th, width: 56, textAlign: "right" }} rowSpan={2}>Qty</th>
                    <th style={{ ...th, textAlign: "center", borderLeft: "2px solid var(--border-subtle)" }} colSpan={2}>Budget</th>
                    {vends.map((v, j) => (
                      <th key={j} style={{ ...vTh, background: award === j ? "#F0FAF4" : "transparent" }} colSpan={2}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 180 }}>
                          <input type="radio" name={`award-${g.cat}`} checked={award === j} disabled={!(vends[j] || "").trim()}
                            onChange={() => awardCategory(g.cat, j)} title="Award this category to this vendor"
                            style={{ width: 15, height: 15, accentColor: "#1F8A52", cursor: (vends[j] || "").trim() ? "pointer" : "not-allowed", flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <VendorSelect value={vends[j]} onChange={name => setVendor(g.cat, j, name)} />
                          </div>
                          {vends.length > 3 && (
                            <button title="Remove vendor" onClick={() => removeVendor(g.cat, j)}
                              style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid #FFF1F2", background: "#FFF1F2", cursor: "pointer", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                              <Icon name="x" size={11} color="#C0263A" />
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: 9.5, fontWeight: 700, marginTop: 4, textTransform: "none", letterSpacing: 0,
                          color: lowestIdx === j ? "#1F8A52" : secondLowestIdx === j ? "#2563B0" : "var(--fg-3)" }}>
                          {totals[j].sub > 0 ? AED(totals[j].grand) + (lowestIdx === j ? " · LOWEST" : secondLowestIdx === j ? " · 2ND LOWEST" : "") : "—"}
                        </div>
                        {/* Attached vendor quote document */}
                        {(() => {
                          const vname = (vends[j] || "").trim();
                          if (!vname) return null;
                          const qf  = quoteFileFor(g.cat, vname);
                          const key = g.cat + "|" + vname;
                          const busy = uploading === key;
                          if (qf) return (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5, textTransform: "none", letterSpacing: 0 }}>
                              <a href={FILE_BASE + qf.filePath} target="_blank" rel="noreferrer" title={qf.fileName}
                                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, color: "#1F8A52",
                                  textDecoration: "none", maxWidth: 140, overflow: "hidden" }}>
                                <Icon name="paperclip" size={11} color="#1F8A52" />
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{qf.fileName}</span>
                              </a>
                              <button title="Remove quote" onClick={() => removeQuoteFile(g.cat, vname)}
                                style={{ width: 18, height: 18, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer",
                                  display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <Icon name="x" size={10} color="#C0263A" />
                              </button>
                            </div>
                          );
                          return (
                            <label title="Attach this vendor's quotation (PDF, image, Excel…)"
                              style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 5, fontSize: 10.5, fontWeight: 600,
                                color: busy ? "var(--fg-4)" : "var(--brand-burgundy)", cursor: busy ? "default" : "pointer",
                                textTransform: "none", letterSpacing: 0 }}>
                              <Icon name={busy ? "loader" : "paperclip"} size={11} />
                              <span>{busy ? "Uploading…" : "Attach quote"}</span>
                              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.heic,.webp" disabled={busy}
                                style={{ display: "none" }}
                                onChange={e => { const f = e.target.files[0]; e.target.value = ""; uploadQuoteFile(g.cat, vname, f); }} />
                            </label>
                          );
                        })()}
                      </th>
                    ))}
                  </tr>
                  <tr style={{ background: "var(--ink-50)" }}>
                    <th style={{ ...th, width: 90, textAlign: "right", borderLeft: "2px solid var(--border-subtle)" }}>Rate</th>
                    <th style={{ ...th, width: 100, textAlign: "right" }}>Amount</th>
                    {vends.map((v, j) => (
                      <React.Fragment key={j}>
                        <th style={{ ...th, width: 92, textAlign: "right", borderLeft: "2px solid var(--border-subtle)" }}>Rate</th>
                        <th style={{ ...th, width: 100, textAlign: "right" }}>Amount</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {g.idxs.map((i, n) => {
                    const it = baseItems[i];
                    const qty = qtyOf(i);
                    return (
                      <tr key={i}>
                        <td style={{ ...cell, textAlign: "center", color: "var(--fg-3)" }}>{n + 1}</td>
                        <td style={{ ...cell, whiteSpace: "normal", lineHeight: 1.35 }}>{it.description || <span style={{ color: "var(--fg-4)", fontStyle: "italic" }}>—</span>}</td>
                        <td style={cell}>{it.unit}</td>
                        <td style={num}>{qty}</td>
                        <td style={{ ...num, color: "var(--fg-3)", borderLeft: "2px solid var(--border-subtle)" }}>{it.targetRate ? AED(it.targetRate) : "—"}</td>
                        <td style={{ ...num, color: "var(--fg-3)" }}>{AED(qty * (Number(it.targetRate) || 0))}</td>
                        {vends.map((v, j) => {
                          const rate = Number(rates[i][j]) || 0;
                          const budgetLine = qty * (Number(it.targetRate) || 0);
                          const over = budgetLine > 0 && rate > 0 && (qty * rate) > budgetLine;
                          return (
                            <React.Fragment key={j}>
                              <td style={{ ...cell, borderLeft: "2px solid var(--border-subtle)" }}>
                                <input className="form-input" type="number" min="0" style={inp} value={rates[i][j]} onChange={e => setRate(i, j, e.target.value)} />
                              </td>
                              <td style={{ ...num, fontWeight: 600, background: award === j ? "#EAF7EF" : "transparent", color: over ? "#C0263A" : "var(--fg-1)" }}
                                title={over ? "Over budget rate" : undefined}>{AED(qty * rate)}</td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {totalRow("Total Amount", budget, totals.map(t => t.sub))}
                  {totalRow("VAT (5%)", budget * VAT_RATE, totals.map(t => t.vat))}
                  {totalRow("Grand Total", budget * (1 + VAT_RATE), totals.map(t => t.grand), { bold: true, bg: "#F0FAF4" })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Overall award summary — combined grand total across all categories */}
      {(() => {
        const rows = groups.map(g => {
          const aj = catAward[g.cat];
          const vlist = catVendors[g.cat] || [];
          const awarded = (aj != null && aj >= 0);
          return {
            cat: g.cat,
            vendor: awarded ? (vlist[aj] || "") : "",
            budget: g.idxs.reduce((s, i) => s + qtyOf(i) * (Number(baseItems[i].targetRate) || 0), 0),
            amount: awarded ? g.idxs.reduce((s, i) => s + qtyOf(i) * (Number(rates[i][aj]) || 0), 0) : 0,
          };
        });
        const sub = rows.reduce((s, r) => s + r.amount, 0);
        const budget = rows.reduce((s, r) => s + r.budget, 0);
        const vat = sub * VAT_RATE;
        const grand = sub + vat;
        const variance = budget ? sub - budget : 0;
        const awardedCount = rows.filter(r => r.vendor).length;
        const cellL = { padding: "7px 10px", fontSize: 12, color: "var(--fg-2)" };
        const cellR = { padding: "7px 10px", fontSize: 12, textAlign: "right", whiteSpace: "nowrap" };
        return (
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 18, border: "1.5px solid var(--brand-burgundy)" }}>
            <div style={{ padding: "11px 16px", background: "var(--plum-50)", borderBottom: "1px solid var(--border-subtle)",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-burgundy)", display: "flex", alignItems: "center", gap: 7 }}>
                <Icon name="receipt" size={16} /> Award Summary — Grand Total
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6,
                background: awardedCount === groups.length ? "#ECFDF5" : "#FEF8EC", color: awardedCount === groups.length ? "#1F8A52" : "#9A6A11" }}>
                {awardedCount} of {groups.length} categories awarded
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--ink-50)" }}>
                  <th style={{ ...cellL, fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--fg-3)" }}>Category</th>
                  <th style={{ ...cellL, fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--fg-3)" }}>Awarded Vendor</th>
                  <th style={{ ...cellR, fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--fg-3)" }}>Budget</th>
                  <th style={{ ...cellR, fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--fg-3)" }}>Awarded Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <td style={{ ...cellL, fontWeight: 600, color: "var(--fg-1)" }}>{r.cat}</td>
                    <td style={cellL}>{r.vendor || <span style={{ color: "#9A6A11", fontStyle: "italic" }}>not awarded</span>}</td>
                    <td style={{ ...cellR, color: "var(--fg-3)" }}>{AED(r.budget)}</td>
                    <td style={{ ...cellR, fontWeight: 600, color: r.vendor ? "#1F8A52" : "var(--fg-4)" }}>{r.vendor ? AED(r.amount) : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid var(--border-subtle)", background: "var(--ink-50)" }}>
                  <td style={cellL} colSpan={2}><span style={{ fontWeight: 600 }}>Subtotal (awarded)</span></td>
                  <td style={{ ...cellR, color: "var(--fg-3)" }}>{AED(budget)}</td>
                  <td style={{ ...cellR, fontWeight: 600 }}>{AED(sub)}</td>
                </tr>
                <tr style={{ background: "var(--ink-50)" }}>
                  <td style={cellL} colSpan={3}><span style={{ color: "var(--fg-2)" }}>VAT (5%)</span></td>
                  <td style={{ ...cellR, fontWeight: 600 }}>{AED(vat)}</td>
                </tr>
                <tr style={{ background: "#F0FAF4" }}>
                  <td style={{ ...cellL, fontSize: 13, fontWeight: 700 }} colSpan={3}>Grand Total (incl. VAT)</td>
                  <td style={{ ...cellR, fontSize: 14, fontWeight: 800, color: "#1F8A52" }}>{AED(grand)}</td>
                </tr>
                {budget > 0 && (
                  <tr style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <td style={cellL} colSpan={3}><span style={{ color: "var(--fg-3)" }}>Variance vs budget</span></td>
                    <td style={{ ...cellR, fontWeight: 700, color: variance > 0 ? "#C0263A" : "#1F8A52" }}>{variance > 0 ? "+" : ""}{AED(variance)}</td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        );
      })()}

      <div style={{ fontSize: 11.5, color: "var(--fg-4)", marginTop: 4 }}>
        Each category has its <strong>own vendors</strong>. Enter each vendor's Rate per line, then pick the <strong>Award</strong>
        radio for the winning vendor in that category — different categories can be awarded to different vendors.
      </div>

      {/* Save bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <Button variant="ghost" onClick={onBack}>Cancel</Button>
        <button className="btn btn-primary" onClick={persist} disabled={saving}>
          {saving ? "Saving…" : "Save Comparison"}
        </button>
      </div>
    </div>
  );
}

// ── LPO Issue — one Purchase Order per awarded vendor (step 6) ──────────────────
function POPage({ proc, onBack, onSave, onCompare }) {
  const pos = buildVendorPOs(proc);
  const existing = {};
  (proc.purchaseOrders || []).forEach(po => { existing[po.vendor] = po; });
  const procNo = (proc.procId || "").replace("PRC-", "");
  const today = new Date().toISOString().slice(0, 10);

  const [meta, setMeta] = useStatePR(() => {
    const m = {};
    pos.forEach((po, i) => {
      const ex = existing[po.vendor];
      m[po.vendor] = {
        poNumber: ex && ex.poNumber ? ex.poNumber : `LPO-${procNo}-${i + 1}`,
        date:     ex && ex.date ? ex.date : today,
        status:   ex && ex.status ? ex.status : "draft",
      };
    });
    return m;
  });
  const [saving, setSaving] = useStatePR(false);
  const setField = (vendor, k, v) => setMeta(m => ({ ...m, [vendor]: { ...m[vendor], [k]: v } }));
  const grand = pos.reduce((s, po) => s + po.total, 0);

  // Load vendor contact details (phone/email) for share links.
  useEffectPR(() => {
    if (window._vendorCache) return;
    fetch(`${window.API}/parties?type=vendor`).then(r => r.json())
      .then(d => { window._vendorCache = Array.isArray(d) ? d : []; }).catch(() => {});
  }, []);
  const contactFor = vendor => (window._vendorCache || []).find(v => v.name === vendor) || {};

  // ── Share / export helpers ──────────────────────────────────────────────────
  const poPlainText = po => {
    const mv = meta[po.vendor];
    const lines = po.lines.map((it, n) =>
      `${n + 1}. ${it.description} — ${Number(it.qty) || 0} ${it.unit} x ${AED(it.unitPrice)} = ${AED((Number(it.qty) || 0) * (Number(it.unitPrice) || 0))}`).join("\n");
    return `*LOCAL PURCHASE ORDER*\nPO No: ${mv.poNumber}\nDate: ${mv.date}\nVendor: ${po.vendor}\nProject: ${proc.title} (${proc.procId})\n\n${lines}\n\nSubtotal: ${AED(po.subtotal)}\nVAT 5%: ${AED(po.vat)}\nTotal: ${AED(po.total)}\n\n— Meridian ERP`;
  };

  const whatsappPO = po => {
    const phone = (contactFor(po.vendor).phone || "").replace(/[^0-9]/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(poPlainText(po))}`;
    window.open(url, "_blank");
  };

  const emailPO = po => {
    const mv = meta[po.vendor];
    const to = contactFor(po.vendor).email || "";
    const subject = `Local Purchase Order ${mv.poNumber} — ${proc.title}`;
    window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(poPlainText(po))}`);
  };

  const printPO = po => {
    const mv = meta[po.vendor];
    const ct = contactFor(po.vendor);
    const esc = s => String(s == null ? "" : s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const rows = po.lines.map((it, n) => `<tr>
      <td class="c">${n + 1}</td><td>${esc(it.category)}</td><td>${esc(it.description)}</td>
      <td>${esc(it.unit)}</td><td class="r">${Number(it.qty) || 0}</td>
      <td class="r">${AED(it.unitPrice)}</td><td class="r">${AED((Number(it.qty) || 0) * (Number(it.unitPrice) || 0))}</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(mv.poNumber)}</title>
      <style>
        *{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}
        body{margin:32px;color:#231f20;font-size:12px}
        .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #6F1947;padding-bottom:12px}
        .brand{font-size:22px;font-weight:800;color:#6F1947}
        h1{font-size:18px;margin:18px 0 4px}
        .meta{display:flex;gap:40px;margin:12px 0 18px}
        .meta div{font-size:12px}.meta b{display:block;color:#777;font-weight:600;font-size:10px;text-transform:uppercase}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        th,td{border:1px solid #ddd;padding:7px 9px;font-size:11px}
        th{background:#f3eef1;text-align:left;color:#555;text-transform:uppercase;font-size:10px}
        td.r,th.r{text-align:right}td.c{text-align:center}
        tfoot td{font-weight:700}
        .tot{margin-top:14px;float:right;width:240px}
        .tot div{display:flex;justify-content:space-between;padding:4px 0}
        .tot .g{border-top:2px solid #6F1947;font-size:14px;font-weight:800;color:#1F8A52;margin-top:4px;padding-top:8px}
        .sign{margin-top:80px;display:flex;justify-content:space-between;clear:both}
        .sign div{width:40%;border-top:1px solid #999;padding-top:6px;font-size:11px;color:#666}
      </style></head><body>
      <div class="top"><div><div class="brand">Meridian ERP</div><div style="color:#777">Meridian Logistics DMCC · Dubai, UAE</div></div>
        <div style="text-align:right"><h1 style="margin:0;color:#6F1947">LOCAL PURCHASE ORDER</h1>
        <div style="font-size:13px;font-weight:700">${esc(mv.poNumber)}</div><div style="color:#777">${esc(mv.date)}</div></div></div>
      <div class="meta">
        <div><b>Vendor</b>${esc(po.vendor)}${ct.contactPerson ? "<br>" + esc(ct.contactPerson) : ""}${ct.phone ? "<br>" + esc(ct.phone) : ""}${ct.email ? "<br>" + esc(ct.email) : ""}</div>
        <div><b>Project / Ref</b>${esc(proc.title)}<br>${esc(proc.procId)}</div>
        <div><b>Categories</b>${esc(po.categories.join(", "))}</div>
      </div>
      <table><thead><tr><th class="c">SL</th><th>Category</th><th>Description</th><th>Unit</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="tot"><div><span>Subtotal</span><span>${AED(po.subtotal)}</span></div>
        <div><span>VAT (5%)</span><span>${AED(po.vat)}</span></div>
        <div class="g"><span>Grand Total</span><span>${AED(po.total)}</span></div></div>
      <div class="sign"><div>Procurement Dept.</div><div>Authorised Signature</div></div>
      <script>window.onload=function(){window.print();}<\/script>
      </body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  // Render one Local Purchase Order onto an existing jsPDF doc (no save). Shared by
  // the single-PO download and the combined "all LPOs" export.
  const renderPO = (doc, po) => {
    const mv = meta[po.vendor];
    const ct = contactFor(po.vendor);
    const W = doc.internal.pageSize.getWidth();
    const M = 40;

    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(111, 25, 71);
    doc.text("Meridian ERP", M, 52);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text("Meridian Logistics DMCC · Dubai, UAE", M, 66);
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(111, 25, 71);
    doc.text("LOCAL PURCHASE ORDER", W - M, 50, { align: "right" });
    doc.setFontSize(11); doc.setTextColor(35, 31, 32);
    doc.text(String(mv.poNumber || ""), W - M, 67, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text(String(mv.date || ""), W - M, 81, { align: "right" });
    doc.setDrawColor(111, 25, 71); doc.setLineWidth(2); doc.line(M, 92, W - M, 92);

    const y = 116;
    doc.setFontSize(8); doc.setTextColor(120, 120, 120);
    doc.text("VENDOR", M, y); doc.text("PROJECT / REF", M + 210, y); doc.text("CATEGORIES", M + 380, y);
    doc.setFontSize(10); doc.setTextColor(35, 31, 32);
    [po.vendor, ct.contactPerson, ct.phone, ct.email].filter(Boolean).forEach((t, k) => doc.text(String(t), M, y + 14 + k * 12));
    doc.text(String(proc.title || ""), M + 210, y + 14);
    doc.text(String(proc.procId || ""), M + 210, y + 26);
    doc.text(doc.splitTextToSize(po.categories.join(", "), 150), M + 380, y + 14);

    const body = po.lines.map((it, n) => [String(n + 1), it.category || "", it.description || "", it.unit || "",
      String(Number(it.qty) || 0), AED(it.unitPrice), AED((Number(it.qty) || 0) * (Number(it.unitPrice) || 0))]);
    doc.autoTable({
      startY: y + 76,
      head: [["SL", "Category", "Description", "Unit", "Qty", "Rate", "Amount"]],
      body,
      styles: { fontSize: 9, cellPadding: 5, lineColor: [221, 221, 221], lineWidth: 0.5 },
      headStyles: { fillColor: [243, 238, 241], textColor: [85, 85, 85], fontStyle: "bold" },
      columnStyles: { 0: { halign: "center", cellWidth: 28 }, 3: { cellWidth: 42 }, 4: { halign: "right", cellWidth: 40 }, 5: { halign: "right", cellWidth: 72 }, 6: { halign: "right", cellWidth: 84 } },
      margin: { left: M, right: M },
    });

    const fy = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 200) + 18;
    const lx = W - M - 200, vx = W - M;
    doc.setFontSize(10); doc.setTextColor(35, 31, 32);
    doc.text("Subtotal", lx, fy); doc.text(AED(po.subtotal), vx, fy, { align: "right" });
    doc.text("VAT (5%)", lx, fy + 16); doc.text(AED(po.vat), vx, fy + 16, { align: "right" });
    doc.setDrawColor(111, 25, 71); doc.setLineWidth(1); doc.line(lx, fy + 25, vx, fy + 25);
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(31, 138, 82);
    doc.text("Grand Total", lx, fy + 42); doc.text(AED(po.total), vx, fy + 42, { align: "right" });

    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    const sy = fy + 110;
    doc.setDrawColor(150, 150, 150); doc.setLineWidth(0.5);
    doc.line(M, sy, M + 160, sy); doc.text("Procurement Dept.", M, sy + 13);
    doc.line(W - M - 160, sy, W - M, sy); doc.text("Authorised Signature", W - M - 160, sy + 13);
  };

  // Single PO download (falls back to printable HTML if the PDF lib is missing).
  const downloadPO = po => {
    if (!(window.jspdf && window.jspdf.jsPDF)) return printPO(po);
    const doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    renderPO(doc, po);
    doc.save(`${String((meta[po.vendor] || {}).poNumber || "PO").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`);
  };

  // Combined export — a single summary sheet listing every awarded vendor's LPO,
  // with a grand total across all POs (not the individual full POs).
  const downloadAllPOs = () => {
    if (!pos.length) { window.alert("No awarded vendors yet — award categories in the comparison first."); return; }
    if (!(window.jspdf && window.jspdf.jsPDF)) { window.alert("PDF library not loaded — check your connection."); return; }
    const doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth(); const M = 40;

    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(111, 25, 71);
    doc.text("Meridian ERP", M, 52);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text("Meridian Logistics DMCC · Dubai, UAE", M, 66);
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(111, 25, 71);
    doc.text("LPO SUMMARY", W - M, 50, { align: "right" });
    doc.setFontSize(10); doc.setTextColor(35, 31, 32);
    doc.text(String(proc.procId || ""), W - M, 67, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text(new Date().toISOString().slice(0, 10), W - M, 81, { align: "right" });
    doc.setDrawColor(111, 25, 71); doc.setLineWidth(2); doc.line(M, 92, W - M, 92);

    doc.setFontSize(10); doc.setTextColor(35, 31, 32);
    doc.text(doc.splitTextToSize("Project: " + String(proc.title || "—"), W - 2 * M), M, 112);

    const gSub = pos.reduce((s, po) => s + po.subtotal, 0);
    const gVat = pos.reduce((s, po) => s + po.vat, 0);
    const gTot = pos.reduce((s, po) => s + po.total, 0);

    const body = pos.map((po, i) => [
      String(i + 1), (meta[po.vendor] || {}).poNumber || "", po.vendor,
      po.categories.join(", "), AED(po.subtotal), AED(po.vat), AED(po.total),
    ]);
    doc.autoTable({
      startY: 126,
      head: [["SL", "LPO No.", "Vendor", "Categories", "Subtotal", "VAT (5%)", "Total"]],
      body,
      foot: [[{ content: "Grand Total (all LPOs)", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
        AED(gSub), AED(gVat), { content: AED(gTot), styles: { fontStyle: "bold", textColor: [31, 138, 82] } }]],
      styles: { fontSize: 9, cellPadding: 5, lineColor: [221, 221, 221], lineWidth: 0.5 },
      headStyles: { fillColor: [243, 238, 241], textColor: [85, 85, 85], fontStyle: "bold" },
      footStyles: { fillColor: [248, 246, 247], textColor: [35, 31, 32] },
      columnStyles: { 0: { halign: "center", cellWidth: 26 }, 4: { halign: "right", cellWidth: 72 },
        5: { halign: "right", cellWidth: 64 }, 6: { halign: "right", cellWidth: 80 } },
      margin: { left: M, right: M },
    });

    let fy = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 200) + 40;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.setDrawColor(150, 150, 150); doc.setLineWidth(0.5);
    doc.line(M, fy, M + 160, fy); doc.text("Procurement Dept.", M, fy + 13);
    doc.line(W - M - 160, fy, W - M, fy); doc.text("Authorised Signature", W - M - 160, fy + 13);

    doc.save(`LPO_Summary_${String(proc.procId || "").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`);
  };

  const persist = async () => {
    const purchaseOrders = pos.map(po => ({
      poNumber:   (meta[po.vendor].poNumber || "").trim(),
      vendor:     po.vendor,
      date:       meta[po.vendor].date || "",
      categories: po.categories,
      amount:     po.subtotal, vat: po.vat, total: po.total,
      status:     meta[po.vendor].status || "draft",
    }));
    setSaving(true);
    await onSave(purchaseOrders);
    setSaving(false);
  };

  const th   = { padding: "9px 8px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--fg-3)", whiteSpace: "nowrap" };
  const cell = { padding: "6px 8px", borderTop: "1px solid var(--border-subtle)", fontSize: 12, verticalAlign: "middle" };
  const num  = { ...cell, textAlign: "right", whiteSpace: "nowrap" };

  const pageHead = (
    <div className="page-head">
      <div>
        <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
            color: "var(--brand-burgundy)", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600 }}>
            <Icon name="arrow-left" size={13} /> Procurement Lifecycle
          </button>
          <span style={{ color: "var(--fg-4)" }}>/</span>
          <span>Step 6 · LPO Issue</span>
        </div>
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="file-output" size={20} /> Local Purchase Orders
        </h1>
        <div className="page-sub">
          <span style={{ fontFamily: "monospace" }}>{proc.procId}</span> · {proc.title}
        </div>
      </div>
      <div className="row" style={{ gap: 8 }}>
        {pos.length > 0 && (
          <Button variant="secondary" icon="download" onClick={downloadAllPOs}>
            Download Summary{pos.length > 1 ? ` (${pos.length} LPOs)` : ""}
          </Button>
        )}
        <Button variant="ghost" icon="arrow-left" onClick={onBack}>Back to Lifecycle</Button>
      </div>
    </div>
  );

  if (pos.length === 0) return (
    <div className="page">
      {pageHead}
      <div className="card card-pad" style={{ textAlign: "center", padding: "48px 24px" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--plum-50)", color: "var(--brand-burgundy)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
          <Icon name="scale" size={26} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>No awarded vendors yet</div>
        <div style={{ fontSize: 12.5, color: "var(--fg-3)", margin: "6px 0 16px", maxWidth: 400, marginInline: "auto" }}>
          POs are generated per awarded vendor. Award a vendor for each category in the comparison first.
        </div>
        <Button variant="primary" icon="scale" onClick={() => onCompare(proc)}>Go to Vendor Comparison</Button>
      </div>
    </div>
  );

  return (
    <div className="page">
      {pageHead}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 12.5, color: "var(--fg-3)" }}>
          {pos.length} purchase order{pos.length > 1 ? "s" : ""} — one per awarded vendor
        </div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Combined total: <span style={{ color: "#1F8A52" }}>{AED(grand)}</span></div>
      </div>

      {pos.map((po, i) => (
        <div key={po.vendor} className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 18 }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)", background: "var(--plum-50)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--fg-3)" }}>Purchase Order {i + 1} of {pos.length}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--brand-burgundy)", display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
                  <Icon name="truck" size={17} /> {po.vendor}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 3 }}>{po.lines.length} line{po.lines.length > 1 ? "s" : ""} · {po.categories.join(" · ")}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase" }}>PO Total (incl. VAT)</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#1F8A52" }}>{AED(po.total)}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
              <div className="form-row"><label className="form-label">PO Number</label>
                <input className="form-input" value={meta[po.vendor].poNumber} onChange={e => setField(po.vendor, "poNumber", e.target.value)} /></div>
              <div className="form-row"><label className="form-label">PO Date</label>
                <input className="form-input" type="date" value={meta[po.vendor].date} onChange={e => setField(po.vendor, "date", e.target.value)} /></div>
              <div className="form-row"><label className="form-label">Status</label>
                <select className="form-input" value={meta[po.vendor].status} onChange={e => setField(po.vendor, "status", e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="issued">Issued</option>
                </select></div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <button className="btn btn-sm" onClick={() => downloadPO(po)} title="Open a printable PO — save as PDF">
                <Icon name="download" size={12} /> Download PDF
              </button>
              <button className="btn btn-sm" onClick={() => whatsappPO(po)} title="Send PO details to vendor on WhatsApp"
                style={{ borderColor: "#25D36633", color: "#1FA855" }}>
                <Icon name="message-circle" size={12} color="#25D366" /> WhatsApp
              </button>
              <button className="btn btn-sm" onClick={() => emailPO(po)} title="Email PO details to vendor">
                <Icon name="mail" size={12} /> Email
              </button>
              {!contactFor(po.vendor).phone && !contactFor(po.vendor).email && (
                <span style={{ fontSize: 10.5, color: "var(--fg-4)", alignSelf: "center" }}>· add vendor phone/email under Parties to prefill</span>
              )}
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              <thead>
                <tr style={{ background: "var(--ink-50)" }}>
                  <th style={{ ...th, width: 34, textAlign: "center" }}>SL</th>
                  <th style={{ ...th, width: 150 }}>Category</th>
                  <th style={th}>Description</th>
                  <th style={{ ...th, width: 60 }}>Unit</th>
                  <th style={{ ...th, width: 56, textAlign: "right" }}>Qty</th>
                  <th style={{ ...th, width: 100, textAlign: "right" }}>Rate</th>
                  <th style={{ ...th, width: 120, textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {po.lines.map((it, n) => (
                  <tr key={n}>
                    <td style={{ ...cell, textAlign: "center", color: "var(--fg-3)" }}>{n + 1}</td>
                    <td style={cell}>{it.category}</td>
                    <td style={{ ...cell, whiteSpace: "normal", lineHeight: 1.35 }}>{it.description}</td>
                    <td style={cell}>{it.unit}</td>
                    <td style={num}>{Number(it.qty) || 0}</td>
                    <td style={num}>{AED(it.unitPrice)}</td>
                    <td style={{ ...num, fontWeight: 600 }}>{AED((Number(it.qty) || 0) * (Number(it.unitPrice) || 0))}</td>
                  </tr>
                ))}
                <tr style={{ background: "var(--ink-50)", fontWeight: 600 }}>
                  <td colSpan={6} style={{ ...num, fontSize: 11.5, color: "var(--fg-2)" }}>Subtotal</td>
                  <td style={{ ...num, fontSize: 12 }}>{AED(po.subtotal)}</td>
                </tr>
                <tr style={{ background: "var(--ink-50)", fontWeight: 600 }}>
                  <td colSpan={6} style={{ ...num, fontSize: 11.5, color: "var(--fg-2)" }}>VAT (5%)</td>
                  <td style={{ ...num, fontSize: 12 }}>{AED(po.vat)}</td>
                </tr>
                <tr style={{ background: "#F0FAF4", fontWeight: 700 }}>
                  <td colSpan={6} style={{ ...num, fontSize: 12.5 }}>Grand Total</td>
                  <td style={{ ...num, fontSize: 12.5, color: "#1F8A52" }}>{AED(po.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
        <Button variant="ghost" onClick={onBack}>Cancel</Button>
        <button className="btn btn-primary" onClick={persist} disabled={saving}>
          {saving ? "Saving…" : `Save ${pos.length} Purchase Order${pos.length > 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}

// ── Payment Application — progress / running bill per vendor (step 7) ───────────
function PaymentAppPage({ proc, onBack, onSave, onIssuePOs }) {
  const pos = buildVendorPOs(proc);
  const poByVendor = {};
  (proc.purchaseOrders || []).forEach(po => { poByVendor[po.vendor] = po; });
  const appByVendor = {};
  (proc.paymentApplications || []).forEach(a => { appByVendor[a.vendor] = a; });
  const procNo = (proc.procId || "").replace("PRC-", "");
  const today = new Date().toISOString().slice(0, 10);

  const [meta, setMeta] = useStatePR(() => {
    const m = {};
    pos.forEach((po, i) => {
      const ex = appByVendor[po.vendor] || {};
      const exPct = {};
      (ex.lines || []).forEach((l, k) => { exPct[k] = l.percentComplete; });
      m[po.vendor] = {
        appNumber:         ex.appNumber || `PA-${procNo}-${String(i + 1).padStart(2, "0")}`,
        periodEnding:      ex.periodEnding || today,
        dateOfApplication: ex.dateOfApplication || today,
        preparedBy:        ex.preparedBy || proc.raisedBy || "",
        netChanges:        ex.netChanges != null ? ex.netChanges : "",
        retainagePct:      ex.retainagePct != null ? ex.retainagePct : "",
        lessPrevious:      ex.lessPrevious != null ? ex.lessPrevious : "",
        status:            ex.status || "draft",
        percents:          po.lines.map((_, k) => (exPct[k] != null ? exPct[k] : "")),
      };
    });
    return m;
  });
  const [saving, setSaving] = useStatePR(false);
  const setField = (vendor, k, v) => setMeta(m => ({ ...m, [vendor]: { ...m[vendor], [k]: v } }));
  const setPct = (vendor, idx, v) => setMeta(m => ({ ...m, [vendor]: { ...m[vendor], percents: m[vendor].percents.map((x, k) => k === idx ? v : x) } }));

  // Per-vendor computed figures
  const compute = po => {
    const mv = meta[po.vendor];
    const lines = po.lines.map((it, k) => {
      const contractSum = (Number(it.qty) || 0) * (Number(it.unitPrice) || 0);
      const pct = Number(mv.percents[k]) || 0;
      return { ...it, contractSum, pct, amountValued: contractSum * pct / 100 };
    });
    const originalContract = lines.reduce((s, l) => s + l.contractSum, 0);
    const netChanges = Number(mv.netChanges) || 0;
    const totalContract = originalContract + netChanges;
    const completedToDate = lines.reduce((s, l) => s + l.amountValued, 0);
    const retainagePct = Number(mv.retainagePct) || 0;
    const retainage = completedToDate * retainagePct / 100;
    const lessRetainage = completedToDate - retainage;
    const lessPrevious = Number(mv.lessPrevious) || 0;
    const currentDue = lessRetainage - lessPrevious;
    const balanceToFinish = totalContract - lessRetainage;
    return { lines, originalContract, netChanges, totalContract, completedToDate, retainagePct, retainage, lessRetainage, lessPrevious, currentDue, balanceToFinish };
  };

  // Vendor contacts for share links
  useEffectPR(() => {
    if (window._vendorCache) return;
    fetch(`${window.API}/parties?type=vendor`).then(r => r.json())
      .then(d => { window._vendorCache = Array.isArray(d) ? d : []; }).catch(() => {});
  }, []);
  const contactFor = vendor => (window._vendorCache || []).find(v => v.name === vendor) || {};

  // ── Share / export helpers ──────────────────────────────────────────────────
  const payPlainText = po => {
    const mv = meta[po.vendor]; const c = compute(po);
    return `*APPLICATION FOR PAYMENT*\nApp No: ${mv.appNumber}\nDate: ${mv.dateOfApplication}\nVendor: ${po.vendor}\nPO/WO: ${poByVendor[po.vendor] ? poByVendor[po.vendor].poNumber : "—"}\nProject: ${proc.title} (${proc.procId})\n\nTotal Contract: ${AED(c.totalContract)}\nCompleted To Date: ${AED(c.completedToDate)}\nRetainage (${c.retainagePct || 0}%): ${AED(c.retainage)}\nLess Previous: ${AED(c.lessPrevious)}\n*Current Payment Due: ${AED(c.currentDue)}*\n\n— Meridian ERP`;
  };
  const whatsappPay = po => {
    const phone = (contactFor(po.vendor).phone || "").replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(payPlainText(po))}`, "_blank");
  };
  const emailPay = po => {
    const mv = meta[po.vendor];
    const to = contactFor(po.vendor).email || "";
    const subject = `Payment Application ${mv.appNumber} — ${proc.title}`;
    window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(payPlainText(po))}`);
  };
  const downloadPay = po => {
    const mv = meta[po.vendor]; const ct = contactFor(po.vendor); const c = compute(po);
    if (!(window.jspdf && window.jspdf.jsPDF)) { window.alert("PDF library not loaded — check your connection."); return; }
    const doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth(); const M = 40;

    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(111, 25, 71);
    doc.text("Meridian ERP", M, 52);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text("Meridian Logistics DMCC · Dubai, UAE", M, 66);
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(111, 25, 71);
    doc.text("APPLICATION FOR PAYMENT", W - M, 50, { align: "right" });
    doc.setFontSize(11); doc.setTextColor(35, 31, 32);
    doc.text(String(mv.appNumber || ""), W - M, 67, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text(String(mv.dateOfApplication || ""), W - M, 81, { align: "right" });
    doc.setDrawColor(111, 25, 71); doc.setLineWidth(2); doc.line(M, 92, W - M, 92);

    const y = 116;
    doc.setFontSize(8); doc.setTextColor(120, 120, 120);
    doc.text("SUB-CONTRACTOR", M, y); doc.text("PO / WO NO", M + 210, y); doc.text("PERIOD ENDING", M + 360, y);
    doc.setFontSize(10); doc.setTextColor(35, 31, 32);
    [po.vendor, ct.contactPerson, ct.phone].filter(Boolean).forEach((t, k) => doc.text(String(t), M, y + 14 + k * 12));
    doc.text(String(poByVendor[po.vendor] ? poByVendor[po.vendor].poNumber : "—"), M + 210, y + 14);
    doc.text(doc.splitTextToSize(String(proc.title || ""), 140), M + 210, y + 28);
    doc.text(String(mv.periodEnding || ""), M + 360, y + 14);
    doc.text("Prepared by: " + String(mv.preparedBy || "—"), M + 360, y + 28);

    const body = c.lines.map((l, n) => [String(n + 1), l.category || "", l.description || "",
      AED(l.contractSum), (Number(l.pct) || 0) + "%", AED(l.amountValued)]);
    doc.autoTable({
      startY: y + 78,
      head: [["SL", "Category", "Task Description", "Contract Sum", "% Comp.", "Amount Valued"]],
      body,
      styles: { fontSize: 9, cellPadding: 5, lineColor: [221, 221, 221], lineWidth: 0.5 },
      headStyles: { fillColor: [243, 238, 241], textColor: [85, 85, 85], fontStyle: "bold" },
      columnStyles: { 0: { halign: "center", cellWidth: 28 }, 3: { halign: "right", cellWidth: 78 }, 4: { halign: "right", cellWidth: 52 }, 5: { halign: "right", cellWidth: 86 } },
      margin: { left: M, right: M },
    });

    let fy = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 220) + 18;
    const lx = W - M - 230, vx = W - M;
    const line = (label, val, opts = {}) => {
      doc.setFont("helvetica", opts.bold ? "bold" : "normal"); doc.setFontSize(opts.bold ? 11 : 10);
      doc.setTextColor(opts.green ? 31 : 35, opts.green ? 138 : 31, opts.green ? 82 : 32);
      doc.text(label, lx, fy); doc.text(AED(val), vx, fy, { align: "right" }); fy += opts.gap || 15;
    };
    line("Original Contract Amount", c.originalContract);
    line("Net Changes", c.netChanges);
    line("Total Contract Amount", c.totalContract, { bold: true });
    line("Total Completed To Date", c.completedToDate);
    line(`Retainage (${c.retainagePct || 0}%)`, c.retainage);
    line("Completed Less Retainage", c.lessRetainage);
    line("Less Previous Applications", c.lessPrevious);
    doc.setDrawColor(111, 25, 71); doc.setLineWidth(1); doc.line(lx, fy - 4, vx, fy - 4); fy += 6;
    line("Current Payment Due", c.currentDue, { bold: true, green: true });
    line("Balance to Finish", c.balanceToFinish);

    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    const sy = fy + 70;
    doc.setDrawColor(150, 150, 150); doc.setLineWidth(0.5);
    doc.line(M, sy, M + 150, sy); doc.text("Procurement Dept.", M, sy + 13);
    doc.line(M + 200, sy, M + 350, sy); doc.text("Accounts Dept.", M + 200, sy + 13);
    doc.line(W - M - 150, sy, W - M, sy); doc.text("Engineer / PM", W - M - 150, sy + 13);

    doc.save(`${String(mv.appNumber || "PaymentApp").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`);
  };

  // Combined export — a single summary sheet across all vendors' payment applications,
  // with a grand total of the current payment due.
  const downloadAllPay = () => {
    if (!pos.length) { window.alert("No awarded vendors yet — issue the LPOs first."); return; }
    if (!(window.jspdf && window.jspdf.jsPDF)) { window.alert("PDF library not loaded — check your connection."); return; }
    const doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth(); const M = 40;

    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(111, 25, 71);
    doc.text("Meridian ERP", M, 52);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text("Meridian Logistics DMCC · Dubai, UAE", M, 66);
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(111, 25, 71);
    doc.text("PAYMENT APPLICATIONS — SUMMARY", W - M, 50, { align: "right" });
    doc.setFontSize(10); doc.setTextColor(35, 31, 32);
    doc.text(String(proc.procId || ""), W - M, 67, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text(new Date().toISOString().slice(0, 10), W - M, 81, { align: "right" });
    doc.setDrawColor(111, 25, 71); doc.setLineWidth(2); doc.line(M, 92, W - M, 92);

    doc.setFontSize(10); doc.setTextColor(35, 31, 32);
    doc.text(doc.splitTextToSize("Project: " + String(proc.title || "—"), W - 2 * M), M, 112);

    const computed = pos.map(po => ({ po, mv: meta[po.vendor], c: compute(po) }));
    const gContract  = computed.reduce((s, x) => s + x.c.totalContract, 0);
    const gCompleted = computed.reduce((s, x) => s + x.c.completedToDate, 0);
    const gPrev      = computed.reduce((s, x) => s + x.c.lessPrevious, 0);
    const gDue       = computed.reduce((s, x) => s + x.c.currentDue, 0);

    const body = computed.map((x, i) => [
      String(i + 1), x.mv.appNumber || "", x.po.vendor,
      poByVendor[x.po.vendor] ? poByVendor[x.po.vendor].poNumber : "—",
      AED(x.c.totalContract), AED(x.c.completedToDate), AED(x.c.lessPrevious), AED(x.c.currentDue),
    ]);
    doc.autoTable({
      startY: 126,
      head: [["SL", "App No.", "Vendor", "PO / WO", "Contract", "Completed", "Less Prev.", "Current Due"]],
      body,
      foot: [[{ content: "Grand Total", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
        AED(gContract), AED(gCompleted), AED(gPrev), { content: AED(gDue), styles: { fontStyle: "bold", textColor: [31, 138, 82] } }]],
      styles: { fontSize: 8.5, cellPadding: 5, lineColor: [221, 221, 221], lineWidth: 0.5 },
      headStyles: { fillColor: [243, 238, 241], textColor: [85, 85, 85], fontStyle: "bold" },
      footStyles: { fillColor: [248, 246, 247], textColor: [35, 31, 32] },
      columnStyles: { 0: { halign: "center", cellWidth: 24 }, 4: { halign: "right" }, 5: { halign: "right" },
        6: { halign: "right" }, 7: { halign: "right" } },
      margin: { left: M, right: M },
    });

    let fy = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 200) + 40;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.setDrawColor(150, 150, 150); doc.setLineWidth(0.5);
    doc.line(M, fy, M + 150, fy); doc.text("Procurement Dept.", M, fy + 13);
    doc.line(M + 200, fy, M + 350, fy); doc.text("Accounts Dept.", M + 200, fy + 13);
    doc.line(W - M - 150, fy, W - M, fy); doc.text("Engineer / PM", W - M - 150, fy + 13);

    doc.save(`Payment_Applications_Summary_${String(proc.procId || "").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`);
  };

  const persist = async () => {
    const paymentApplications = pos.map(po => {
      const mv = meta[po.vendor]; const c = compute(po);
      return {
        appNumber: (mv.appNumber || "").trim(), vendor: po.vendor,
        poNumber: poByVendor[po.vendor] ? poByVendor[po.vendor].poNumber : "",
        periodEnding: mv.periodEnding || "", dateOfApplication: mv.dateOfApplication || "",
        preparedBy: mv.preparedBy || "", workDetails: proc.title || "",
        originalContract: c.originalContract, netChanges: c.netChanges,
        completedToDate: c.completedToDate, retainagePct: c.retainagePct,
        lessPrevious: c.lessPrevious, currentDue: c.currentDue, status: mv.status || "draft",
        lines: c.lines.map(l => ({ category: l.category, description: l.description, contractSum: l.contractSum, percentComplete: l.pct, amountValued: l.amountValued })),
      };
    });
    setSaving(true);
    await onSave(paymentApplications);
    setSaving(false);
  };

  const th   = { padding: "9px 8px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--fg-3)", whiteSpace: "nowrap" };
  const cell = { padding: "6px 8px", borderTop: "1px solid var(--border-subtle)", fontSize: 12, verticalAlign: "middle" };
  const num  = { ...cell, textAlign: "right", whiteSpace: "nowrap" };
  const inp  = { height: 32, paddingTop: 4, paddingBottom: 4, textAlign: "right" };

  const pageHead = (
    <div className="page-head">
      <div>
        <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
            color: "var(--brand-burgundy)", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600 }}>
            <Icon name="arrow-left" size={13} /> Procurement Lifecycle
          </button>
          <span style={{ color: "var(--fg-4)" }}>/</span>
          <span>Step 8 · Payment Application</span>
        </div>
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="file-plus" size={20} /> Application for Payment
        </h1>
        <div className="page-sub">
          <span style={{ fontFamily: "monospace" }}>{proc.procId}</span> · {proc.title}
        </div>
      </div>
      <div className="row" style={{ gap: 8 }}>
        {pos.length > 0 && (
          <Button variant="secondary" icon="download" onClick={downloadAllPay}>
            Download Summary{pos.length > 1 ? ` (${pos.length} apps)` : ""}
          </Button>
        )}
        <Button variant="ghost" icon="arrow-left" onClick={onBack}>Back to Lifecycle</Button>
      </div>
    </div>
  );

  if (pos.length === 0) return (
    <div className="page">
      {pageHead}
      <div className="card card-pad" style={{ textAlign: "center", padding: "48px 24px" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--plum-50)", color: "var(--brand-burgundy)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
          <Icon name="file-output" size={26} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>No awarded vendors / POs yet</div>
        <div style={{ fontSize: 12.5, color: "var(--fg-3)", margin: "6px 0 16px", maxWidth: 400, marginInline: "auto" }}>
          A payment application bills progress against each awarded vendor's PO. Issue the LPOs first.
        </div>
        <Button variant="primary" icon="file-output" onClick={() => onIssuePOs(proc)}>Go to LPO Issue</Button>
      </div>
    </div>
  );

  // One application card per vendor — the numbered Contractor's Application summary.
  const sumRow = (n, label, value, opts = {}) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0",
      borderTop: n > 1 ? "1px solid var(--border-subtle)" : "none", background: opts.bg }}>
      <span style={{ fontSize: 12, color: "var(--fg-2)" }}><span style={{ color: "var(--fg-4)", marginRight: 6 }}>{n}.</span>{label}</span>
      {opts.input || <span style={{ fontSize: 12.5, fontWeight: opts.bold ? 700 : 600, color: opts.color || "var(--fg-1)", whiteSpace: "nowrap" }}>{AED(value)}</span>}
    </div>
  );

  return (
    <div className="page">
      {pageHead}

      <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginBottom: 16 }}>
        {pos.length} payment application{pos.length > 1 ? "s" : ""} — one per awarded vendor / PO
      </div>

      {pos.map((po, i) => {
        const mv = meta[po.vendor];
        const c = compute(po);
        const poRef = poByVendor[po.vendor];
        return (
          <div key={po.vendor} className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 18 }}>
            {/* Header */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)", background: "var(--plum-50)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--fg-3)" }}>Application {i + 1} of {pos.length}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--brand-burgundy)", display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
                    <Icon name="truck" size={17} /> {po.vendor}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 3 }}>
                    PO/WO: <strong>{poRef ? poRef.poNumber : "—"}</strong> · {po.categories.join(" · ")}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase" }}>Current Payment Due</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#1F8A52" }}>{AED(c.currentDue)}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
                <div className="form-row"><label className="form-label">Application No.</label>
                  <input className="form-input" value={mv.appNumber} onChange={e => setField(po.vendor, "appNumber", e.target.value)} /></div>
                <div className="form-row"><label className="form-label">Period Ending</label>
                  <input className="form-input" type="date" value={mv.periodEnding} onChange={e => setField(po.vendor, "periodEnding", e.target.value)} /></div>
                <div className="form-row"><label className="form-label">Date of Application</label>
                  <input className="form-input" type="date" value={mv.dateOfApplication} onChange={e => setField(po.vendor, "dateOfApplication", e.target.value)} /></div>
                <div className="form-row"><label className="form-label">Prepared By</label>
                  <EmployeeSelect value={mv.preparedBy} onChange={v => setField(po.vendor, "preparedBy", v)} /></div>
                <div className="form-row"><label className="form-label">Status</label>
                  <select className="form-input" value={mv.status} onChange={e => setField(po.vendor, "status", e.target.value)}>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="certified">Certified</option>
                  </select></div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <button className="btn btn-sm" onClick={() => downloadPay(po)} title="Download payment application as PDF">
                  <Icon name="download" size={12} /> Download PDF
                </button>
                <button className="btn btn-sm" onClick={() => whatsappPay(po)} title="Send to vendor on WhatsApp"
                  style={{ borderColor: "#25D36633", color: "#1FA855" }}>
                  <Icon name="message-circle" size={12} color="#25D366" /> WhatsApp
                </button>
                <button className="btn btn-sm" onClick={() => emailPay(po)} title="Email to vendor">
                  <Icon name="mail" size={12} /> Email
                </button>
              </div>
            </div>

            {/* Progress backup table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
                <thead>
                  <tr style={{ background: "var(--ink-50)" }}>
                    <th style={{ ...th, width: 34, textAlign: "center" }}>SL</th>
                    <th style={{ ...th, width: 140 }}>Category</th>
                    <th style={th}>Task Description</th>
                    <th style={{ ...th, width: 120, textAlign: "right" }}>Contract Sum</th>
                    <th style={{ ...th, width: 96, textAlign: "right" }}>% Complete</th>
                    <th style={{ ...th, width: 120, textAlign: "right" }}>Amount Valued</th>
                  </tr>
                </thead>
                <tbody>
                  {c.lines.map((l, n) => (
                    <tr key={n}>
                      <td style={{ ...cell, textAlign: "center", color: "var(--fg-3)" }}>{n + 1}</td>
                      <td style={cell}>{l.category}</td>
                      <td style={{ ...cell, whiteSpace: "normal", lineHeight: 1.35 }}>{l.description}</td>
                      <td style={num}>{AED(l.contractSum)}</td>
                      <td style={cell}>
                        <input className="form-input" type="number" min="0" max="100" style={inp}
                          value={mv.percents[n]} onChange={e => setPct(po.vendor, n, e.target.value)} placeholder="0" />
                      </td>
                      <td style={{ ...num, fontWeight: 600 }}>{AED(l.amountValued)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "var(--ink-50)", fontWeight: 700 }}>
                    <td colSpan={3} style={{ ...num, fontSize: 11.5, color: "var(--fg-2)" }}>Total Completed To Date</td>
                    <td style={num}>{AED(c.originalContract)}</td>
                    <td style={cell} />
                    <td style={{ ...num, color: "#1F8A52" }}>{AED(c.completedToDate)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Contractor's Application summary */}
            <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" }}>
              <div>
                {sumRow(1, "Original Contract Amount", c.originalContract)}
                {sumRow(2, "Net Changes to Contract", null, { input: (
                  <input className="form-input" type="number" style={{ ...inp, width: 120 }} placeholder="0"
                    value={mv.netChanges} onChange={e => setField(po.vendor, "netChanges", e.target.value)} /> ) })}
                {sumRow(3, "Total Contract Amount", c.totalContract, { bold: true })}
                {sumRow(4, "Total Completed To Date", c.completedToDate)}
              </div>
              <div>
                {sumRow(5, `Retainage (${c.retainagePct || 0}%)`, c.retainage, { input: (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input className="form-input" type="number" min="0" max="100" style={{ ...inp, width: 64 }} placeholder="0"
                      value={mv.retainagePct} onChange={e => setField(po.vendor, "retainagePct", e.target.value)} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap" }}>{AED(c.retainage)}</span>
                  </div> ) })}
                {sumRow(6, "Completed Less Retainage", c.lessRetainage)}
                {sumRow(7, "Less Previous Applications", null, { input: (
                  <input className="form-input" type="number" style={{ ...inp, width: 120 }} placeholder="0"
                    value={mv.lessPrevious} onChange={e => setField(po.vendor, "lessPrevious", e.target.value)} /> ) })}
                {sumRow(8, "Current Payment Due", c.currentDue, { bold: true, color: "#1F8A52", bg: "#F0FAF4" })}
                {sumRow(9, "Balance to Finish (incl. Retainage)", c.balanceToFinish)}
              </div>
            </div>
          </div>
        );
      })}

      {/* Combined summary — grand total payment due across all vendor applications */}
      {pos.length > 0 && (() => {
        const rows = pos.map(po => { const c = compute(po); return { vendor: po.vendor, appNumber: meta[po.vendor].appNumber, c }; });
        const totalContract = rows.reduce((s, r) => s + r.c.totalContract, 0);
        const completed = rows.reduce((s, r) => s + r.c.completedToDate, 0);
        const retainage = rows.reduce((s, r) => s + r.c.retainage, 0);
        const previous = rows.reduce((s, r) => s + r.c.lessPrevious, 0);
        const due = rows.reduce((s, r) => s + r.c.currentDue, 0);
        const cellL = { padding: "7px 10px", fontSize: 12, color: "var(--fg-2)" };
        const cellR = { padding: "7px 10px", fontSize: 12, textAlign: "right", whiteSpace: "nowrap" };
        const hd = { ...cellL, fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--fg-3)" };
        const hdR = { ...cellR, fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--fg-3)" };
        return (
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 18, border: "1.5px solid var(--brand-burgundy)" }}>
            <div style={{ padding: "11px 16px", background: "var(--plum-50)", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-burgundy)", display: "flex", alignItems: "center", gap: 7 }}>
                <Icon name="receipt" size={16} /> Payment Summary — Grand Total Due
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <thead>
                  <tr style={{ background: "var(--ink-50)" }}>
                    <th style={hd}>Vendor</th><th style={hd}>App No.</th>
                    <th style={hdR}>Total Contract</th><th style={hdR}>Completed</th><th style={hdR}>Current Due</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      <td style={{ ...cellL, fontWeight: 600, color: "var(--fg-1)" }}>{r.vendor}</td>
                      <td style={{ ...cellL, fontFamily: "monospace", fontSize: 11 }}>{r.appNumber}</td>
                      <td style={{ ...cellR, color: "var(--fg-3)" }}>{AED(r.c.totalContract)}</td>
                      <td style={cellR}>{AED(r.c.completedToDate)}</td>
                      <td style={{ ...cellR, fontWeight: 700, color: "#1F8A52" }}>{AED(r.c.currentDue)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid var(--border-subtle)", background: "var(--ink-50)" }}>
                    <td style={cellL} colSpan={2}><span style={{ fontWeight: 600 }}>Combined</span></td>
                    <td style={{ ...cellR, color: "var(--fg-3)" }}>{AED(totalContract)}</td>
                    <td style={{ ...cellR, fontWeight: 600 }}>{AED(completed)}</td>
                    <td style={cellR} />
                  </tr>
                  {retainage > 0 && (
                    <tr style={{ background: "var(--ink-50)" }}>
                      <td style={cellL} colSpan={4}><span style={{ color: "var(--fg-2)" }}>Total Retainage Held</span></td>
                      <td style={{ ...cellR, fontWeight: 600 }}>{AED(retainage)}</td>
                    </tr>
                  )}
                  {previous > 0 && (
                    <tr style={{ background: "var(--ink-50)" }}>
                      <td style={cellL} colSpan={4}><span style={{ color: "var(--fg-2)" }}>Less Previous Applications</span></td>
                      <td style={{ ...cellR, fontWeight: 600 }}>{AED(previous)}</td>
                    </tr>
                  )}
                  <tr style={{ background: "#F0FAF4" }}>
                    <td style={{ ...cellL, fontSize: 13, fontWeight: 700 }} colSpan={4}>Grand Total Payment Due</td>
                    <td style={{ ...cellR, fontSize: 14, fontWeight: 800, color: "#1F8A52" }}>{AED(due)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })()}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
        <Button variant="ghost" onClick={onBack}>Cancel</Button>
        <button className="btn btn-primary" onClick={persist} disabled={saving}>
          {saving ? "Saving…" : `Save ${pos.length} Application${pos.length > 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}

// ── Detail pane with the vertical 11-step lifecycle ─────────────────────────────
function ProcDetailPane({ proc, onClose, onEdit, onDelete, onAdvance, onSetStage, onManageItems, onCompareQuotes, onManagePOs, onManagePayApps, onSetStatus }) {
  const curIdx = procStageIndex(proc.currentStage);
  const st = STATUS_META[proc.status] || STATUS_META.in_progress;

  // Finance records booked against the same project (shown when linked):
  // expense claims, cash book entries and day book entries.
  const [expenses, setExpenses] = useStatePR([]);
  const [cashEntries, setCashEntries] = useStatePR([]);
  const [dayEntries, setDayEntries] = useStatePR([]);
  useEffectPR(() => {
    if (!proc.projectId) { setExpenses([]); setCashEntries([]); setDayEntries([]); return; }
    const pid = encodeURIComponent(proc.projectId);
    fetch(`${window.API}/expenses?projectId=${pid}`).then(r => r.json())
      .then(d => setExpenses(Array.isArray(d) ? d : [])).catch(() => setExpenses([]));
    fetch(`${window.API}/cashbook?projectId=${pid}`).then(r => r.json())
      .then(d => setCashEntries(Array.isArray(d) ? d : [])).catch(() => setCashEntries([]));
    fetch(`${window.API}/daybook?projectId=${pid}`).then(r => r.json())
      .then(d => setDayEntries(Array.isArray(d) ? d : [])).catch(() => setDayEntries([]));
  }, [proc.projectId]);
  const expenseTotal = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const EXP_STATUS_COLORS = { pending: "#D78A14", approved: "#2563B0", reimbursed: "#1F8A52", rejected: "#C0263A" };
  const cashReceipts = cashEntries.filter(e => e.entryType === "receipt").reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const cashPayments = cashEntries.filter(e => e.entryType === "payment").reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const dayDebit  = dayEntries.reduce((s, e) => s + (Number(e.debit) || 0), 0);
  const dayCredit = dayEntries.reduce((s, e) => s + (Number(e.credit) || 0), 0);
  const histByStage = (proc.history || []).reduce((m, h) => { m[h.stage] = h; return m; }, {});
  const isDone = proc.status === "completed";
  const items = proc.items || [];
  const t = itemsTotals(items);
  const categoryVendors = proc.categoryVendors || [];
  const categoryAwards = proc.categoryAwards || [];
  const awardByCat = {}; categoryAwards.forEach(ca => { awardByCat[ca.category] = ca.vendor; });
  const catAmount = {};
  items.forEach(it => { const k = (it.category || "").trim() || "Uncategorised"; catAmount[k] = (catAmount[k] || 0) + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0); });
  const compareCats = categoryVendors.length ? categoryVendors.map(cv => cv.category) : categoryAwards.map(ca => ca.category);

  return (
    <div className="card" style={{ position: "sticky", top: 90, padding: "18px 20px",
      maxHeight: "calc(100vh - 110px)", overflowY: "auto", scrollbarWidth: "none" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14,
        paddingBottom: 14, borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--fg-1)", lineHeight: 1.3 }}>{proc.title}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--fg-3)" }}>{proc.procId}</span>
            <select value={proc.status} onChange={e => onSetStatus(proc.procId, e.target.value)} title="Change request status"
              style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5, cursor: "pointer",
                border: "1px solid " + st.color + "55", background: st.bg, color: st.color }}>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <IconButton icon="edit-2" title="Edit" onClick={onEdit} />
          <IconButton icon="trash-2" title="Delete" onClick={() => onDelete(proc.procId)} />
          <IconButton icon="x" title="Close" onClick={onClose} />
        </div>
      </div>

      {/* Summary facts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          ["Department", proc.department],
          ["Vendor", proc.vendor || "—"],
          ["Est. Value", AED(proc.estValue)],
          ["Priority", (PRIORITY_META[proc.priority] || PRIORITY_META.normal).label],
        ].map(([l, v]) => (
          <div key={l} style={{ padding: "8px 10px", background: "var(--ink-50)", borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>{l}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)", marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Linked project & quotation (from the originating Project) */}
      {(proc.projectId || proc.quotationRef) && (
        <div style={{ marginBottom: 18, padding: "12px 14px", border: "1px solid var(--border-subtle)", borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em",
            color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Icon name="file-text" size={13} /> Linked Project &amp; Quotation
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              ["Project", proc.projectName || proc.projectId || "—"],
              ["Quotation Ref", proc.quotationRef || "—"],
              ["Quotation Amount", proc.quotationAmount ? AED(proc.quotationAmount) : "—"],
              ["Quotation Date", proc.quotationDate || "—"],
            ].map(([l, v]) => (
              <div key={l} style={{ padding: "8px 10px", background: "var(--ink-50)", borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>{l}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)", marginTop: 2, wordBreak: "break-word" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense claims booked against the linked project */}
      {proc.projectId && expenses.length > 0 && (
        <div style={{ marginBottom: 18, padding: "12px 14px", border: "1px solid var(--border-subtle)", borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em",
              color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="receipt" size={13} /> Expense Claims
              <span style={{ color: "var(--fg-4)" }}>· {expenses.length}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1F8A52" }}>{AED(expenseTotal)}</span>
          </div>
          {expenses.map(e => {
            const c = EXP_STATUS_COLORS[e.status] || "#A89DA3";
            return (
              <div key={e.expenseId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0",
                borderTop: "1px solid var(--border-subtle)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)", whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis" }}>
                    {e.desc || e.cat || "Expense"}
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 1 }}>
                    {e.date}{e.empName ? " · " + e.empName : ""}{e.cat ? " · " + e.cat : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--fg-1)", whiteSpace: "nowrap" }}>{AED(e.amount)}</div>
                  <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", color: c }}>{e.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cash Book entries booked against the linked project */}
      {proc.projectId && cashEntries.length > 0 && (
        <div style={{ marginBottom: 18, padding: "12px 14px", border: "1px solid var(--border-subtle)", borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em",
              color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="wallet" size={13} /> Cash Book
              <span style={{ color: "var(--fg-4)" }}>· {cashEntries.length}</span>
            </div>
            <div style={{ display: "flex", gap: 10, fontSize: 11, fontWeight: 700 }}>
              <span style={{ color: "#1F8A52" }} title="Receipts">▲ {AED(cashReceipts)}</span>
              <span style={{ color: "#C0263A" }} title="Payments">▼ {AED(cashPayments)}</span>
            </div>
          </div>
          {cashEntries.map(e => (
            <div key={e.entryId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0",
              borderTop: "1px solid var(--border-subtle)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)", whiteSpace: "nowrap",
                  overflow: "hidden", textOverflow: "ellipsis" }}>{e.description || e.category || "Entry"}</div>
                <div style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 1 }}>
                  {e.date}{e.category ? " · " + e.category : ""}{e.paymentMode ? " · " + e.paymentMode : ""}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap",
                  color: e.entryType === "receipt" ? "#1F8A52" : "#C0263A" }}>
                  {e.entryType === "receipt" ? "+" : "−"}{AED(e.amount)}
                </div>
                <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", color: "var(--fg-3)" }}>{e.entryType}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Day Book entries booked against the linked project */}
      {proc.projectId && dayEntries.length > 0 && (
        <div style={{ marginBottom: 18, padding: "12px 14px", border: "1px solid var(--border-subtle)", borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em",
              color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="book-open" size={13} /> Day Book
              <span style={{ color: "var(--fg-4)" }}>· {dayEntries.length}</span>
            </div>
            <div style={{ display: "flex", gap: 10, fontSize: 11, fontWeight: 700 }}>
              <span style={{ color: "#C0263A" }} title="Debit">Dr {AED(dayDebit)}</span>
              <span style={{ color: "#1F8A52" }} title="Credit">Cr {AED(dayCredit)}</span>
            </div>
          </div>
          {dayEntries.map(e => (
            <div key={e.entryId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0",
              borderTop: "1px solid var(--border-subtle)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)", whiteSpace: "nowrap",
                  overflow: "hidden", textOverflow: "ellipsis" }}>{e.description || e.account || "Entry"}</div>
                <div style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 1 }}>
                  {e.date}{e.account ? " · " + e.account : ""}{e.entryType ? " · " + e.entryType : ""}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {e.debit > 0 && <div style={{ fontSize: 12, fontWeight: 700, color: "#C0263A", whiteSpace: "nowrap" }}>Dr {AED(e.debit)}</div>}
                {e.credit > 0 && <div style={{ fontSize: 12, fontWeight: 700, color: "#1F8A52", whiteSpace: "nowrap" }}>Cr {AED(e.credit)}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Material & Labour list summary */}
      <div style={{ marginBottom: 18, padding: "12px 14px", border: "1px solid var(--border-subtle)", borderRadius: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em",
            color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="list-checks" size={13} /> Material &amp; Labour
            {items.length > 0 && <span style={{ color: "var(--fg-4)" }}>· {items.length} item{items.length > 1 ? "s" : ""}</span>}
          </div>
          <button className="btn btn-sm" onClick={() => onManageItems(proc)}>
            <Icon name={items.length ? "pencil" : "plus"} size={12} /> {items.length ? "Manage" : "Add items"}
          </button>
        </div>
        {items.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
            {[["Subtotal", t.subtotal, "#2563B0"], ["VAT 5%", t.vat, "#D78A14"], ["Grand Total", t.grand, "#1F8A52"]].map(([l, v, c]) => (
              <div key={l} style={{ padding: "7px 9px", borderRadius: 8, background: c + "10" }}>
                <div style={{ fontSize: 9.5, color: "var(--fg-3)", textTransform: "uppercase" }}>{l}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: c, marginTop: 1, whiteSpace: "nowrap" }}>{AED(v)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vendor quote comparison summary */}
      <div style={{ marginBottom: 18, padding: "12px 14px", border: "1px solid var(--border-subtle)", borderRadius: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em",
            color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="scale" size={13} /> Vendor Quotes
            {compareCats.length > 0 && <span style={{ color: "var(--fg-4)" }}>· {compareCats.length} cat.</span>}
          </div>
          <button className="btn btn-sm" onClick={() => onCompareQuotes(proc)}>
            <Icon name={compareCats.length ? "scale" : "plus"} size={12} /> {compareCats.length ? "Compare" : "Add quotes"}
          </button>
        </div>
        {compareCats.length > 0 ? (
          <div style={{ marginTop: 10 }}>
            {compareCats.map((cat, i) => {
              const vendor = awardByCat[cat];
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0",
                  borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-1)" }}>{cat}</div>
                    <div style={{ fontSize: 10.5, marginTop: 1, color: vendor ? "#1F8A52" : "var(--fg-4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {vendor ? "→ " + vendor : "not awarded"}
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: vendor ? "#1F8A52" : "var(--fg-1)", whiteSpace: "nowrap" }}>
                    {catAmount[cat] ? AED(catAmount[cat]) : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: "var(--fg-4)", marginTop: 8 }}>
            Compare vendor rates per category against the material &amp; labour list.
          </div>
        )}
      </div>

      {/* Purchase orders summary (one per awarded vendor) */}
      {(proc.purchaseOrders || []).length > 0 && (
        <div style={{ marginBottom: 18, padding: "12px 14px", border: "1px solid var(--border-subtle)", borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em",
              color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="file-output" size={13} /> Purchase Orders
              <span style={{ color: "var(--fg-4)" }}>· {proc.purchaseOrders.length}</span>
            </div>
            <button className="btn btn-sm" onClick={() => onManagePOs(proc)}>
              <Icon name="pencil" size={12} /> Manage
            </button>
          </div>
          <div style={{ marginTop: 10 }}>
            {proc.purchaseOrders.map((po, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0",
                borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--fg-2)" }}>{po.poNumber || "—"}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                      background: po.status === "issued" ? "#1F8A5218" : "var(--ink-100)",
                      color: po.status === "issued" ? "#1F8A52" : "var(--fg-3)" }}>{po.status === "issued" ? "ISSUED" : "DRAFT"}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--fg-1)", fontWeight: 600, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{po.vendor}</div>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>{AED(po.total)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment applications summary */}
      {(proc.paymentApplications || []).length > 0 && (
        <div style={{ marginBottom: 18, padding: "12px 14px", border: "1px solid var(--border-subtle)", borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em",
              color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="file-plus" size={13} /> Payment Applications
              <span style={{ color: "var(--fg-4)" }}>· {proc.paymentApplications.length}</span>
            </div>
            <button className="btn btn-sm" onClick={() => onManagePayApps(proc)}>
              <Icon name="pencil" size={12} /> Manage
            </button>
          </div>
          <div style={{ marginTop: 10 }}>
            {proc.paymentApplications.map((pa, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0",
                borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--fg-2)" }}>{pa.appNumber || "—"}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                      background: pa.status === "certified" ? "#1F8A5218" : pa.status === "submitted" ? "#EFF6FF" : "var(--ink-100)",
                      color: pa.status === "certified" ? "#1F8A52" : pa.status === "submitted" ? "#2563B0" : "var(--fg-3)" }}>{(pa.status || "draft").toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--fg-1)", fontWeight: 600, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pa.vendor}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: "var(--fg-3)", textTransform: "uppercase" }}>due</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1F8A52", whiteSpace: "nowrap" }}>{AED(pa.currentDue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
        color: "var(--fg-3)", marginBottom: 12 }}>
        Lifecycle · Stage {Math.min(curIdx + 1, STAGE_KEYS.length)} of {STAGE_KEYS.length}
      </div>

      {/* Vertical stepper */}
      <div style={{ position: "relative" }}>
        {PROC_STAGES.map((stage, i) => {
          const done    = i < curIdx || (isDone && i <= curIdx);
          const current = i === curIdx && !isDone;
          const pc      = PHASE_COLOR[stage.phase];
          const hist    = histByStage[stage.key];
          const dotColor = done ? "#1F8A52" : current ? pc : "var(--ink-200)";
          // Data-entry tool for this stage — openable from any stage (even locked).
          const toolBtn =
            stage.key === "prepare_list"        ? { label: "Prepare list",       icon: "list-checks", on: () => onManageItems(proc) } :
            (stage.key === "quotation" || stage.key === "comparison") ? { label: "Compare quotes", icon: "scale", on: () => onCompareQuotes(proc) } :
            stage.key === "lpo"                 ? { label: "Issue LPOs",         icon: "file-output", on: () => onManagePOs(proc) } :
            stage.key === "payment_application" ? { label: "Payment Application", icon: "file-plus",  on: () => onManagePayApps(proc) } : null;
          return (
            <div key={stage.key} style={{ display: "flex", gap: 12, paddingBottom: i < PROC_STAGES.length - 1 ? 14 : 0, position: "relative" }}>
              {/* Connector line */}
              {i < PROC_STAGES.length - 1 && <div style={{ position: "absolute", left: 13, top: 26, bottom: 0, width: 2,
                background: done ? "#1F8A52" : "var(--ink-100)" }} />}
              {/* Dot */}
              <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, zIndex: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? "#1F8A52" : current ? pc + "1A" : "var(--ink-50)",
                border: current ? `2px solid ${pc}` : done ? "none" : "1px solid var(--ink-200)" }}>
                {done
                  ? <Icon name="check" size={14} color="#fff" stroke={3} />
                  : current
                    ? <Icon name={stage.icon} size={13} color={pc} />
                    : <Icon name="lock" size={12} color="var(--fg-4)" />}
              </div>
              {/* Body */}
              <div style={{ flex: 1, minWidth: 0, opacity: (!done && !current && !toolBtn) ? 0.62 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--fg-1)" }}>{i + 1}. {stage.label}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                    background: pc + "15", color: pc, textTransform: "uppercase", letterSpacing: ".04em" }}>{stage.phase}</span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--fg-2)", marginTop: 3, lineHeight: 1.4 }}>{stage.action}</div>
                <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 10.5, color: "var(--fg-3)", flexWrap: "wrap" }}>
                  <span><Icon name="building-2" size={10} /> {stage.department}</span>
                  <span><Icon name="user-check" size={10} /> {stage.responsible}</span>
                </div>

                {/* Completed sign-off detail */}
                {hist && (
                  <div style={{ marginTop: 6, padding: "6px 9px", background: "#F0FAF4", borderRadius: 7,
                    border: "1px solid #D6F0E0" }}>
                    <div style={{ fontSize: 10.5, color: "#1F8A52", fontWeight: 600 }}>
                      ✓ Signed off{hist.by ? " by " + hist.by : ""} · {fmtDatePR(hist.at)}
                    </div>
                    {hist.note && <div style={{ fontSize: 11, color: "var(--fg-2)", marginTop: 2 }}>{hist.note}</div>}
                  </div>
                )}

                {/* Attached Proforma Invoice document */}
                {stage.key === "proforma" && proc.proformaFile && proc.proformaFile.filePath && (
                  <a href={((window.API || "").replace(/\/api$/, "")) + proc.proformaFile.filePath} target="_blank" rel="noreferrer"
                    title={proc.proformaFile.fileName}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6, padding: "4px 9px", borderRadius: 7,
                      border: "1px solid #D6F0E0", background: "#F0FAF4", fontSize: 11, fontWeight: 600, color: "#1F8A52",
                      textDecoration: "none", maxWidth: "100%", overflow: "hidden" }}>
                    <Icon name="paperclip" size={11} color="#1F8A52" />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{proc.proformaFile.fileName}</span>
                  </a>
                )}

                {/* Stage actions — tool opens from any stage; advance only on the active stage */}
                {(current || toolBtn) && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    {toolBtn && (
                      <button onClick={toolBtn.on} className="btn btn-sm">
                        <Icon name={toolBtn.icon} size={12} /> {toolBtn.label}
                      </button>
                    )}
                    {current && (
                      <button onClick={() => onAdvance(proc)} className="btn btn-primary btn-sm">
                        <Icon name="check" size={12} stroke={2.4} />
                        {i === STAGE_KEYS.length - 1 ? "Complete procurement" : "Sign off & advance"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Send back */}
      {curIdx > 0 && !isDone && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-subtle)" }}>
          <button onClick={() => onSetStage(proc.procId, STAGE_KEYS[curIdx - 1])}
            style={{ width: "100%", padding: "7px 0", borderRadius: 8, cursor: "pointer",
              fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600,
              border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", color: "var(--fg-2)" }}>
            <Icon name="corner-up-left" size={12} /> Send back to previous stage
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────────
function ProcurementPage() {
  const [items,   setItems]   = useStatePR([]);
  const [loading, setLoading] = useStatePR(true);
  const [selected, setSelected] = useStatePR(null);
  const [showForm, setShowForm] = useStatePR(false);
  const [editItem, setEditItem] = useStatePR(null);
  const [advItem,  setAdvItem]  = useStatePR(null);
  const [itemsItem, setItemsItem] = useStatePR(null);
  const [quotesItem, setQuotesItem] = useStatePR(null);
  const [poItem, setPoItem] = useStatePR(null);
  const [payItem, setPayItem] = useStatePR(null);
  const [search,  setSearch]  = useStatePR("");
  const [stageFilter,  setStageFilter]  = useStatePR("all");
  const [statusFilter, setStatusFilter] = useStatePR("all");

  useEffectPR(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${window.API}/procurement`);
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (e) { console.error(e); setItems([]); }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemoPR(() => items.filter(p => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (stageFilter  !== "all" && p.currentStage !== stageFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (p.title || "").toLowerCase().includes(q)
        || (p.procId || "").toLowerCase().includes(q)
        || (p.vendor || "").toLowerCase().includes(q)
        || (p.department || "").toLowerCase().includes(q);
    }
    return true;
  }), [items, statusFilter, stageFilter, search]);

  const kpi = useMemoPR(() => ({
    total:      items.length,
    inProgress: items.filter(p => p.status === "in_progress").length,
    completed:  items.filter(p => p.status === "completed").length,
    value:      items.reduce((s, p) => s + (p.estValue || 0), 0),
  }), [items]);

  const sel = items.find(p => p.procId === selected);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleCreate = useCallbackPR(async (form) => {
    try {
      const res = await fetch(`${window.API}/procurement`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const doc = await res.json();
      setItems(prev => [doc, ...prev]);
      setSelected(doc.procId);
    } catch (e) { console.error(e); }
    setShowForm(false);
  }, []);

  const handleUpdate = useCallbackPR(async (form) => {
    if (!editItem) return;
    const id = editItem.procId;
    try {
      const res = await fetch(`${window.API}/procurement/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const doc = await res.json();
      setItems(prev => prev.map(p => p.procId === id ? doc : p));
    } catch (e) { console.error(e); }
    setEditItem(null);
  }, [editItem]);

  const handleAdvance = useCallbackPR(async ({ by, note, patch }) => {
    if (!advItem) return;
    const id = advItem.procId;
    try {
      const res = await fetch(`${window.API}/procurement/${id}/advance`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ by, note, patch }),
      });
      const doc = await res.json();
      setItems(prev => prev.map(p => p.procId === id ? doc : p));
    } catch (e) { console.error(e); }
    setAdvItem(null);
  }, [advItem]);

  const handleSetStage = useCallbackPR(async (id, stage) => {
    try {
      const res = await fetch(`${window.API}/procurement/${id}/stage`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }),
      });
      const doc = await res.json();
      setItems(prev => prev.map(p => p.procId === id ? doc : p));
    } catch (e) { console.error(e); }
  }, []);

  const handleSetStatus = useCallbackPR(async (id, status) => {
    setItems(prev => prev.map(p => p.procId === id ? { ...p, status } : p));   // optimistic
    try {
      const res = await fetch(`${window.API}/procurement/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      });
      const doc = await res.json();
      setItems(prev => prev.map(p => p.procId === id ? doc : p));
    } catch (e) { console.error(e); }
  }, []);

  const handleSaveItems = useCallbackPR(async (id, items, applyTotal) => {
    const body = applyTotal != null ? { items, estValue: applyTotal } : { items };
    try {
      const res = await fetch(`${window.API}/procurement/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const doc = await res.json();
      setItems(prev => prev.map(p => p.procId === id ? doc : p));
    } catch (e) { console.error(e); }
    setItemsItem(null);
    setSelected(id);   // return to the lifecycle with this request open
  }, []);

  const handleSaveQuotes = useCallbackPR(async (id, payload) => {
    const body = { vendor: payload.vendor || "" };
    if (payload.items)           body.items           = payload.items;
    if (payload.categoryVendors) body.categoryVendors = payload.categoryVendors;
    if (payload.categoryAwards)  body.categoryAwards  = payload.categoryAwards;
    if (payload.estValue != null) body.estValue = payload.estValue;
    try {
      const res = await fetch(`${window.API}/procurement/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const doc = await res.json();
      setItems(prev => prev.map(p => p.procId === id ? doc : p));
    } catch (e) { console.error(e); }
    setQuotesItem(null);
    setSelected(id);   // return to the lifecycle with this request open
  }, []);

  // Vendor quote file attached/removed — refresh that request in place (stay on the page).
  const handleQuoteFileUpdate = useCallbackPR((doc) => {
    setItems(prev => prev.map(p => p.procId === doc.procId ? doc : p));
  }, []);

  const handleSavePOs = useCallbackPR(async (id, purchaseOrders) => {
    const poAmount = purchaseOrders.reduce((s, p) => s + (p.total || 0), 0);
    try {
      const res = await fetch(`${window.API}/procurement/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purchaseOrders, poAmount }),
      });
      const doc = await res.json();
      setItems(prev => prev.map(p => p.procId === id ? doc : p));
    } catch (e) { console.error(e); }
    setPoItem(null);
    setSelected(id);
  }, []);

  const handleSavePayApps = useCallbackPR(async (id, paymentApplications) => {
    try {
      const res = await fetch(`${window.API}/procurement/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentApplications }),
      });
      const doc = await res.json();
      setItems(prev => prev.map(p => p.procId === id ? doc : p));
    } catch (e) { console.error(e); }
    setPayItem(null);
    setSelected(id);
  }, []);

  const handleDelete = useCallbackPR(async (id) => {
    if (!window.confirm("Delete this procurement request? This cannot be undone.")) return;
    setItems(prev => prev.filter(p => p.procId !== id));
    setSelected(null);
    try { await fetch(`${window.API}/procurement/${id}`, { method: "DELETE" }); }
    catch (e) { console.error(e); }
  }, []);

  if (loading) return (
    <div className="page">
      <div className="page-head"><div><div className="eyebrow">Procurement</div><h1 className="page-title">Procurement Lifecycle</h1></div></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        {[1,2,3,4,5].map(i => <div key={i} className="card pulse" style={{ height: 54 }} />)}
      </div>
    </div>
  );

  // Full-page Material & Labour builder — replaces the list while active
  if (itemsItem) return (
    <ItemsPage
      proc={items.find(p => p.procId === itemsItem.procId) || itemsItem}
      onBack={() => { const id = itemsItem.procId; setItemsItem(null); setSelected(id); }}
      onSave={(list, applyTotal) => handleSaveItems(itemsItem.procId, list, applyTotal)}
    />
  );

  // Full-page Vendor Quote comparison — replaces the list while active
  if (quotesItem) return (
    <QuotesPage
      proc={items.find(p => p.procId === quotesItem.procId) || quotesItem}
      onBack={() => { const id = quotesItem.procId; setQuotesItem(null); setSelected(id); }}
      onSave={(payload) => handleSaveQuotes(quotesItem.procId, payload)}
      onUploaded={handleQuoteFileUpdate}
      onManageItems={(p) => { setQuotesItem(null); setItemsItem(p); }}
    />
  );

  // Full-page LPO Issue — one PO per awarded vendor
  if (poItem) return (
    <POPage
      proc={items.find(p => p.procId === poItem.procId) || poItem}
      onBack={() => { const id = poItem.procId; setPoItem(null); setSelected(id); }}
      onSave={(purchaseOrders) => handleSavePOs(poItem.procId, purchaseOrders)}
      onCompare={(p) => { setPoItem(null); setQuotesItem(p); }}
    />
  );

  // Full-page Payment Application — one per awarded vendor / PO
  if (payItem) return (
    <PaymentAppPage
      proc={items.find(p => p.procId === payItem.procId) || payItem}
      onBack={() => { const id = payItem.procId; setPayItem(null); setSelected(id); }}
      onSave={(paymentApplications) => handleSavePayApps(payItem.procId, paymentApplications)}
      onIssuePOs={(p) => { setPayItem(null); setPoItem(p); }}
    />
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Procurement</div>
          <h1 className="page-title">Procurement Lifecycle</h1>
          <div className="page-sub">{kpi.total} requests · {kpi.inProgress} in progress · {kpi.completed} completed</div>
        </div>
        <div className="row">
          <Button variant="primary" icon="plus" onClick={() => setShowForm(true)}>New Request</Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Requests", value: kpi.total,      icon: "clipboard-list", color: "#2563B0" },
          { label: "In Progress",    value: kpi.inProgress, icon: "loader",         color: "#D78A14" },
          { label: "Completed",      value: kpi.completed,  icon: "circle-check",   color: "#1F8A52" },
          { label: "Pipeline Value", value: AED(kpi.value), icon: "wallet",         color: "#534AB7" },
        ].map(k => (
          <div key={k.label} className="card" style={{ display: "flex", alignItems: "center", gap: 14,
            padding: "18px 20px", borderTop: `3px solid ${k.color}` }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: k.color + "15",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={k.icon} size={20} color={k.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--fg-1)", whiteSpace: "nowrap" }}>{k.value}</div>
              <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={14} color="var(--fg-3)" />
          </span>
          <input className="search-input" placeholder="Search title, ID, vendor, department…"
            value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32, width: 290 }} />
        </div>
        <select className="form-input" style={{ width: "auto" }} value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
          <option value="all">All Stages</option>
          {PROC_STAGES.map((s, i) => <option key={s.key} value={s.key}>{i + 1}. {s.label}</option>)}
        </select>
        <div style={{ display: "flex", gap: 5 }}>
          {[["all","All"],["in_progress","In Progress"],["completed","Completed"],["on_hold","On Hold"],["cancelled","Cancelled"]].map(([id, label]) => (
            <button key={id} className={"pill-btn" + (statusFilter === id ? " active" : "")} onClick={() => setStatusFilter(id)}>{label}</button>
          ))}
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 400px" : "1fr", gap: 20, alignItems: "start" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--ink-50)" }}>
                {["Request","Department","Vendor","Stage","Est. Value","Status",""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11,
                    fontWeight: 700, textTransform: "uppercase", color: "var(--fg-3)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const cur = STAGE_BY_KEY[p.currentStage] || PROC_STAGES[0];
                const idx = procStageIndex(p.currentStage);
                const st  = STATUS_META[p.status] || STATUS_META.in_progress;
                const pr  = PRIORITY_META[p.priority] || PRIORITY_META.normal;
                const isSel = selected === p.procId;
                const done = p.status === "completed";
                return (
                  <tr key={p.procId}
                    style={{ borderBottom: "1px solid var(--border-subtle)", cursor: "pointer",
                      background: isSel ? "var(--plum-50)" : "transparent" }}
                    onClick={() => setSelected(isSel ? null : p.procId)}>
                    <td style={{ padding: "11px 14px", maxWidth: 280 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>{p.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 10.5, color: "var(--fg-3)" }}>{p.procId}</span>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: pr.color }} />
                        <span style={{ fontSize: 10.5, color: pr.color, fontWeight: 600 }}>{pr.label}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 12.5, color: "var(--fg-2)" }}>{p.department || "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12.5, color: "var(--fg-2)" }}>
                      {p.vendor || <span style={{ color: "var(--fg-4)", fontStyle: "italic" }}>—</span>}
                    </td>
                    <td style={{ padding: "11px 14px", minWidth: 170 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: done ? "#1F8A52" : PHASE_COLOR[cur.phase] }}>
                          {done ? "Completed" : `${idx + 1}. ${cur.label}`}
                        </span>
                      </div>
                      <Meter value={done ? 12 : idx + (p.status === "in_progress" ? 0 : 1)} max={12} />
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)", whiteSpace: "nowrap" }}>{AED(p.estValue)}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5,
                        fontWeight: 600, padding: "3px 9px", borderRadius: 6, background: st.bg, color: st.color }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.color }} />{st.label}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px" }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button title="Edit" onClick={() => setEditItem(p)}
                          style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid var(--border-subtle)",
                            background: "var(--bg-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name="edit-2" size={13} color="var(--fg-2)" />
                        </button>
                        <button title="Delete" onClick={() => handleDelete(p.procId)}
                          style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #FFF1F2",
                            background: "#FFF1F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name="trash-2" size={13} color="#C0263A" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ padding: "52px 0", textAlign: "center", color: "var(--fg-3)" }}>
              <Icon name="clipboard-list" size={32} color="var(--fg-3)" />
              <div style={{ marginTop: 12, fontWeight: 600, fontSize: 14 }}>
                {items.length === 0 ? "No procurement requests yet" : "No requests match your filter"}
              </div>
              {items.length === 0 && (
                <div style={{ fontSize: 12.5, marginTop: 4, color: "var(--fg-4)" }}>
                  Click "New Request" to start the procurement lifecycle
                </div>
              )}
            </div>
          )}
        </div>

        {sel && (
          <ProcDetailPane
            proc={sel}
            onClose={() => setSelected(null)}
            onEdit={() => setEditItem(sel)}
            onDelete={handleDelete}
            onAdvance={setAdvItem}
            onSetStage={handleSetStage}
            onManageItems={setItemsItem}
            onCompareQuotes={setQuotesItem}
            onManagePOs={setPoItem}
            onManagePayApps={setPayItem}
            onSetStatus={handleSetStatus}
          />
        )}
      </div>

      {showForm && <ProcurementFormModal onClose={() => setShowForm(false)} onSave={handleCreate} />}
      {editItem && <ProcurementFormModal initial={editItem} onClose={() => setEditItem(null)} onSave={handleUpdate} />}
      {advItem  && <AdvanceModal proc={items.find(p => p.procId === advItem.procId) || advItem} onClose={() => setAdvItem(null)} onConfirm={handleAdvance} onUploaded={handleQuoteFileUpdate} />}
    </div>
  );
}

Object.assign(window, { ProcurementPage });

export default ProcurementPage;
