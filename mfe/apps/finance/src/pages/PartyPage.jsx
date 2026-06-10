import React from "react";
import { Icon, Button, IconButton, Avatar, PartyAutocomplete, ProjectSelect } from "../legacy.jsx";
import "../setup.js";
const {
  useState:    useStatePY,
  useMemo:     useMemoPY,
  useEffect:   useEffectPY,
  useCallback: useCallbackPY,
} = React;

const PARTY_TYPES = {
  vendor:     { label: "Vendor",      icon: "truck",           color: "#C0263A" },
  client:     { label: "Client",      icon: "briefcase",       color: "#2563B0" },
  employee:   { label: "Employee",    icon: "user",            color: "#6F1947" },
  bank:       { label: "Bank",        icon: "landmark",        color: "#1F8A52" },
  government: { label: "Government",  icon: "building-2",      color: "#534AB7" },
  other:      { label: "Other",       icon: "more-horizontal", color: "#A89DA3" },
};

const BLANK_FORM = {
  name: "", type: "vendor", contactPerson: "", phone: "", email: "",
  address: "", bankName: "", bankAccount: "", bankIBAN: "",
  taxNumber: "", notes: "", status: "active",
};

// ── PartyFormModal ─────────────────────────────────────────────────────────────
function PartyFormModal({ initial, onClose, onSave }) {
  const [form, setForm] = useStatePY(initial || BLANK_FORM);
  const [saving, setSaving] = useStatePY(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const isEdit = !!initial;
  const valid = form.name.trim() && form.type;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const Section = ({ label }) => (
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
      color: "var(--fg-3)", margin: "14px 0 8px", paddingTop: 10,
      borderTop: "1px solid var(--border-subtle)" }}>
      {label}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontWeight: 700, fontSize: 15 }}>{isEdit ? "Edit Party" : "Add Party"}</div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div className="modal-body">

          {/* Basic info */}
          <div className="form-row">
            <label className="form-label">Party Name *</label>
            <input className="form-input" placeholder="e.g. Al Futtaim Trading LLC" value={form.name} onChange={set("name")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-row">
              <label className="form-label">Type *</label>
              <select className="form-input" value={form.type} onChange={set("type")}>
                {Object.entries(PARTY_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={set("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <Section label="Contact Details" />
          <div className="form-row">
            <label className="form-label">Contact Person</label>
            <input className="form-input" placeholder="Name of primary contact" value={form.contactPerson} onChange={set("contactPerson")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-row">
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="+971 50 000 0000" value={form.phone} onChange={set("phone")} />
            </div>
            <div className="form-row">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="email@example.com" value={form.email} onChange={set("email")} />
            </div>
          </div>
          <div className="form-row">
            <label className="form-label">Address</label>
            <textarea className="form-input" rows={2} placeholder="Office / registered address"
              value={form.address} onChange={set("address")}
              style={{ resize: "vertical", fontFamily: "inherit", fontSize: 13 }} />
          </div>

          <Section label="Bank Details" />
          <div className="form-row">
            <label className="form-label">Bank Name</label>
            <input className="form-input" placeholder="e.g. Emirates NBD" value={form.bankName} onChange={set("bankName")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-row">
              <label className="form-label">Account Number</label>
              <input className="form-input" placeholder="1234567890" value={form.bankAccount} onChange={set("bankAccount")} />
            </div>
            <div className="form-row">
              <label className="form-label">IBAN</label>
              <input className="form-input" placeholder="AE07 0331 2345 6789 0123 456" value={form.bankIBAN} onChange={set("bankIBAN")} />
            </div>
          </div>

          <Section label="Tax / Legal" />
          <div className="form-row">
            <label className="form-label">Tax / CR Number</label>
            <input className="form-input" placeholder="TRN or Commercial Registration No." value={form.taxNumber} onChange={set("taxNumber")} />
          </div>

          <Section label="Notes" />
          <div className="form-row">
            <textarea className="form-input" rows={2} placeholder="Any additional notes…"
              value={form.notes} onChange={set("notes")}
              style={{ resize: "vertical", fontFamily: "inherit", fontSize: 13 }} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!valid || saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Party"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PartyDetailPane ────────────────────────────────────────────────────────────
function PartyDetailPane({ party, onEdit, onDelete, onClose, onStatusToggle }) {
  const pt = PARTY_TYPES[party.type] || PARTY_TYPES.other;
  const isActive = party.status === "active";

  const Row = ({ label, value, mono }) => value ? (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      fontSize: 12.5, gap: 12, marginBottom: 6 }}>
      <span style={{ color: "var(--fg-3)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, color: "var(--fg-1)", textAlign: "right",
        fontFamily: mono ? "monospace" : "inherit", fontSize: mono ? 11.5 : 12.5,
        wordBreak: "break-all" }}>{value}</span>
    </div>
  ) : null;

  const SectionHead = ({ label }) => (
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
      color: "var(--fg-3)", marginBottom: 10, marginTop: 16, paddingTop: 12,
      borderTop: "1px solid var(--border-subtle)" }}>
      {label}
    </div>
  );

  const hasBankInfo = party.bankName || party.bankAccount || party.bankIBAN;
  const hasContact  = party.contactPerson || party.phone || party.email || party.address;

  return (
    <div className="card" style={{ position: "sticky", top: 90, padding: "18px 20px",
      maxHeight: "calc(100vh - 110px)", overflowY: "auto",
      scrollbarWidth: "none", msOverflowStyle: "none" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12,
        marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: pt.color + "18",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={pt.icon} size={20} color={pt.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--fg-1)", lineHeight: 1.3 }}>{party.name}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5,
              background: pt.color + "15", color: pt.color }}>{pt.label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5,
              background: isActive ? "#ECFDF5" : "var(--ink-100)",
              color: isActive ? "#1F8A52" : "var(--fg-3)" }}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <IconButton icon="edit-2" title="Edit" onClick={onEdit} />
          <IconButton icon="trash-2" title="Delete" onClick={() => onDelete(party.partyId)} />
          <IconButton icon="x" title="Close" onClick={onClose} />
        </div>
      </div>

      {/* Party ID */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 14,
        padding: "8px 12px", background: "var(--ink-50)", borderRadius: 8 }}>
        <span style={{ color: "var(--fg-3)" }}>Party ID</span>
        <span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 11.5 }}>{party.partyId}</span>
      </div>

      {/* Contact */}
      {hasContact && (
        <>
          <SectionHead label="Contact Details" />
          <Row label="Contact Person" value={party.contactPerson} />
          <Row label="Phone"          value={party.phone} />
          <Row label="Email"          value={party.email} />
          <Row label="Address"        value={party.address} />
        </>
      )}

      {/* Bank */}
      {hasBankInfo && (
        <>
          <SectionHead label="Bank Details" />
          <Row label="Bank"    value={party.bankName} />
          <Row label="Account" value={party.bankAccount} mono />
          <Row label="IBAN"    value={party.bankIBAN}    mono />
        </>
      )}

      {/* Tax */}
      {party.taxNumber && (
        <>
          <SectionHead label="Tax / Legal" />
          <Row label="Tax / CR No." value={party.taxNumber} mono />
        </>
      )}

      {/* Notes */}
      {party.notes && (
        <>
          <SectionHead label="Notes" />
          <div style={{ fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.6,
            padding: "10px 12px", background: "var(--ink-50)", borderRadius: 8 }}>
            {party.notes}
          </div>
        </>
      )}

      {/* Status toggle */}
      <div style={{ marginTop: 18 }}>
        <button onClick={() => onStatusToggle(party.partyId, isActive ? "inactive" : "active")}
          style={{ width: "100%", padding: "8px 0", borderRadius: 8, cursor: "pointer",
            fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600,
            border: "1px solid var(--border-subtle)",
            background: isActive ? "#FFF1F2" : "#ECFDF5",
            color: isActive ? "#C0263A" : "#1F8A52" }}>
          <Icon name={isActive ? "user-x" : "user-check"} size={13} color={isActive ? "#C0263A" : "#1F8A52"} />
          {" "}{isActive ? "Mark Inactive" : "Mark Active"}
        </button>
      </div>
    </div>
  );
}

// ── PartyPage ──────────────────────────────────────────────────────────────────
function PartyPage() {
  const [parties,    setParties]    = useStatePY([]);
  const [loading,    setLoading]    = useStatePY(true);
  const [selected,   setSelected]   = useStatePY(null);
  const [showAdd,    setShowAdd]    = useStatePY(false);
  const [showEdit,   setShowEdit]   = useStatePY(false);
  const [editParty,  setEditParty]  = useStatePY(null);
  const [search,     setSearch]     = useStatePY("");
  const [typeFilter, setTypeFilter] = useStatePY("all");
  const [statusFilter, setStatusFilter] = useStatePY("all");
  const [page,       setPage]       = useStatePY(1);
  const PAGE_SIZE = 15;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffectPY(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${window.API}/parties`);
        const data = await res.json();
        setParties(Array.isArray(data) ? data : []);
      } catch (e) { console.error(e); setParties([]); }
      setLoading(false);
    }
    load();
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = useMemoPY(() => parties.filter(p => {
    if (typeFilter   !== "all" && p.type   !== typeFilter)   return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q)
        || (p.contactPerson || "").toLowerCase().includes(q)
        || (p.email || "").toLowerCase().includes(q)
        || (p.taxNumber || "").toLowerCase().includes(q);
    }
    return true;
  }), [parties, typeFilter, statusFilter, search]);

  useEffectPY(() => { setPage(1); }, [typeFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageRows   = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const kpi = useMemoPY(() => {
    const total    = parties.length;
    const active   = parties.filter(p => p.status === "active").length;
    const vendors  = parties.filter(p => p.type === "vendor").length;
    const clients  = parties.filter(p => p.type === "client").length;
    return { total, active, vendors, clients };
  }, [parties]);

  const selParty = parties.find(p => p.partyId === selected);

  const navBtn = disabled => ({
    width: 28, height: 28, borderRadius: 7, border: "1px solid var(--border-subtle)",
    background: "var(--bg-surface)", cursor: disabled ? "default" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    opacity: disabled ? 0.4 : 1,
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAdd = useCallbackPY(async (form) => {
    try {
      const res = await fetch(`${window.API}/parties`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const doc = await res.json();
      setParties(prev => [...prev, doc].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e) { console.error(e); }
    setShowAdd(false);
  }, []);

  const handleEdit = useCallbackPY(async (form) => {
    if (!editParty) return;
    const id = editParty.partyId;
    setParties(prev => prev.map(p => p.partyId === id ? { ...p, ...form } : p));
    try {
      const res = await fetch(`${window.API}/parties/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const doc = await res.json();
      setParties(prev => prev.map(p => p.partyId === id ? doc : p));
    } catch (e) { console.error(e); }
    setShowEdit(false);
    setEditParty(null);
  }, [editParty]);

  const handleDelete = useCallbackPY(async (partyId) => {
    if (!window.confirm("Delete this party? This cannot be undone.")) return;
    setParties(prev => prev.filter(p => p.partyId !== partyId));
    setSelected(null);
    try {
      await fetch(`${window.API}/parties/${partyId}`, { method: "DELETE" });
    } catch (e) { console.error(e); }
  }, []);

  const handleStatusToggle = useCallbackPY(async (partyId, status) => {
    setParties(prev => prev.map(p => p.partyId === partyId ? { ...p, status } : p));
    try {
      await fetch(`${window.API}/parties/${partyId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (e) { console.error(e); }
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page">
      <div className="page-head">
        <div><div className="eyebrow">Finance</div><h1 className="page-title">Party</h1></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        {[1,2,3,4,5].map(i => <div key={i} className="card pulse" style={{ height: 54 }} />)}
      </div>
    </div>
  );

  return (
    <div className="page">

      {/* Page head */}
      <div className="page-head">
        <div>
          <div className="eyebrow">People & Culture</div>
          <h1 className="page-title">Party</h1>
          <div className="page-sub">
            {kpi.total} parties · {kpi.active} active
          </div>
        </div>
        <div className="row">
          <Button variant="primary" icon="plus" onClick={() => setShowAdd(true)}>Add Party</Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Parties",  value: kpi.total,   icon: "users",      color: "#2563B0" },
          { label: "Active",         value: kpi.active,  icon: "circle-check",color: "#1F8A52" },
          { label: "Vendors",        value: kpi.vendors, icon: "truck",       color: "#C0263A" },
          { label: "Clients",        value: kpi.clients, icon: "briefcase",   color: "#534AB7" },
        ].map(k => (
          <div key={k.label} className="card" style={{ display: "flex", alignItems: "center", gap: 14,
            padding: "18px 20px", borderTop: `3px solid ${k.color}` }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: k.color + "15",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={k.icon} size={20} color={k.color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--fg-1)" }}>{k.value}</div>
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
          <input className="search-input" placeholder="Search name, contact, email, tax no…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 32, width: 280 }} />
        </div>

        {/* Type pills */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <button className={"pill-btn" + (typeFilter === "all" ? " active" : "")}
            onClick={() => setTypeFilter("all")}>All Types</button>
          {Object.entries(PARTY_TYPES).map(([k, v]) => (
            <button key={k}
              className={"pill-btn" + (typeFilter === k ? " active" : "")}
              onClick={() => setTypeFilter(typeFilter === k ? "all" : k)}
              style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name={v.icon} size={11} color={typeFilter === k ? "#fff" : v.color} />
              {v.label}
            </button>
          ))}
        </div>

        {/* Status pills */}
        <div style={{ display: "flex", gap: 5 }}>
          {[
            { id: "all",      label: "All Status" },
            { id: "active",   label: "Active" },
            { id: "inactive", label: "Inactive" },
          ].map(s => (
            <button key={s.id}
              className={"pill-btn" + (statusFilter === s.id ? " active" : "")}
              onClick={() => setStatusFilter(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 340px" : "1fr", gap: 20, alignItems: "start" }}>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--ink-50)" }}>
                {["Party Name","Type","Contact Person","Phone / Email","Bank","Tax / CR No.","Status",""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11,
                    fontWeight: 700, textTransform: "uppercase", color: "var(--fg-3)",
                    whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map(party => {
                const pt    = PARTY_TYPES[party.type] || PARTY_TYPES.other;
                const isSel = selected === party.partyId;
                return (
                  <tr key={party.partyId}
                    style={{ borderBottom: "1px solid var(--border-subtle)", cursor: "pointer",
                      background: isSel ? "var(--plum-50)" : "transparent",
                      transition: "background 0.1s" }}
                    onClick={() => setSelected(isSel ? null : party.partyId)}>

                    {/* Name */}
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: pt.color + "18",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon name={pt.icon} size={14} color={pt.color} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>
                          {party.name}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, padding: "2px 8px",
                        borderRadius: 5, background: pt.color + "15", color: pt.color }}>
                        {pt.label}
                      </span>
                    </td>

                    {/* Contact person */}
                    <td style={{ padding: "11px 14px", fontSize: 12.5, color: "var(--fg-2)" }}>
                      {party.contactPerson || <span style={{ color: "var(--fg-4)", fontStyle: "italic" }}>—</span>}
                    </td>

                    {/* Phone / Email */}
                    <td style={{ padding: "11px 14px" }}>
                      {party.phone && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12,
                          color: "var(--fg-2)", marginBottom: party.email ? 3 : 0 }}>
                          <Icon name="phone" size={11} color="var(--fg-3)" />
                          {party.phone}
                        </div>
                      )}
                      {party.email && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--fg-2)" }}>
                          <Icon name="mail" size={11} color="var(--fg-3)" />
                          {party.email}
                        </div>
                      )}
                      {!party.phone && !party.email && (
                        <span style={{ color: "var(--fg-4)", fontStyle: "italic", fontSize: 12 }}>—</span>
                      )}
                    </td>

                    {/* Bank */}
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--fg-2)" }}>
                      {party.bankName || <span style={{ color: "var(--fg-4)", fontStyle: "italic" }}>—</span>}
                    </td>

                    {/* Tax number */}
                    <td style={{ padding: "11px 14px", fontSize: 11.5, color: "var(--fg-3)",
                      fontFamily: party.taxNumber ? "monospace" : "inherit" }}>
                      {party.taxNumber || <span style={{ fontFamily: "inherit", fontStyle: "italic" }}>—</span>}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 6,
                        background: party.status === "active" ? "#ECFDF5" : "var(--ink-100)",
                        color: party.status === "active" ? "#1F8A52" : "var(--fg-3)" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%",
                          background: party.status === "active" ? "#1F8A52" : "var(--fg-3)",
                          flexShrink: 0 }} />
                        {party.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "11px 14px" }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button title="Edit"
                          onClick={() => { setEditParty(party); setShowEdit(true); }}
                          style={{ width: 26, height: 26, borderRadius: 6,
                            border: "1px solid var(--border-subtle)", background: "var(--bg-surface)",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name="edit-2" size={13} color="var(--fg-2)" />
                        </button>
                        <button title="Delete"
                          onClick={() => handleDelete(party.partyId)}
                          style={{ width: 26, height: 26, borderRadius: 6,
                            border: "1px solid #FFF1F2", background: "#FFF1F2",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
              <Icon name="users" size={32} color="var(--fg-3)" />
              <div style={{ marginTop: 12, fontWeight: 600, fontSize: 14 }}>
                {parties.length === 0 ? "No parties added yet" : "No parties match your filter"}
              </div>
              {parties.length === 0 && (
                <div style={{ fontSize: 12.5, marginTop: 4, color: "var(--fg-4)" }}>
                  Click "Add Party" to create your first entry
                </div>
              )}
            </div>
          )}

          {filtered.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px", borderTop: "1px solid var(--border-subtle)",
              background: "var(--ink-50)", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 12.5, color: "var(--fg-3)" }}>
                {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length} parties
                {filtered.length < parties.length && (
                  <span style={{ color: "var(--fg-4)" }}> (filtered from {parties.length})</span>
                )}
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => setPage(1)} disabled={safePage === 1} style={navBtn(safePage === 1)}>
                  <span style={{ fontSize: 12 }}>«</span>
                </button>
                <button onClick={() => setPage(safePage - 1)} disabled={safePage === 1} style={navBtn(safePage === 1)}>
                  <span style={{ fontSize: 12 }}>‹</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(n => n === 1 || n === totalPages || (n >= safePage - 2 && n <= safePage + 2))
                  .map((n, i, arr) => [
                    i > 0 && arr[i - 1] !== n - 1 ? (
                      <span key={"e" + n} style={{ width: 28, height: 28, display: "flex",
                        alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--fg-3)" }}>…</span>
                    ) : null,
                    <button key={n} onClick={() => setPage(n)} style={{
                      width: 28, height: 28, borderRadius: 7, cursor: "pointer",
                      border: "1px solid var(--border-subtle)", fontSize: 12,
                      fontWeight: n === safePage ? 700 : 400,
                      background: n === safePage ? "#2563B0" : "var(--bg-surface)",
                      color: n === safePage ? "#fff" : "var(--fg-1)",
                    }}>{n}</button>,
                  ])}
                <button onClick={() => setPage(safePage + 1)} disabled={safePage === totalPages} style={navBtn(safePage === totalPages)}>
                  <span style={{ fontSize: 12 }}>›</span>
                </button>
                <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages} style={navBtn(safePage === totalPages)}>
                  <span style={{ fontSize: 12 }}>»</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail pane */}
        {selParty && (
          <PartyDetailPane
            party={selParty}
            onEdit={() => { setEditParty(selParty); setShowEdit(true); }}
            onDelete={handleDelete}
            onClose={() => setSelected(null)}
            onStatusToggle={handleStatusToggle}
          />
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <PartyFormModal onClose={() => setShowAdd(false)} onSave={handleAdd} />
      )}
      {showEdit && editParty && (
        <PartyFormModal
          initial={{
            name: editParty.name, type: editParty.type, contactPerson: editParty.contactPerson,
            phone: editParty.phone, email: editParty.email, address: editParty.address,
            bankName: editParty.bankName, bankAccount: editParty.bankAccount,
            bankIBAN: editParty.bankIBAN, taxNumber: editParty.taxNumber,
            notes: editParty.notes, status: editParty.status,
          }}
          onClose={() => { setShowEdit(false); setEditParty(null); }}
          onSave={handleEdit}
        />
      )}
    </div>
  );
}

Object.assign(window, { PartyPage });

export default PartyPage;
