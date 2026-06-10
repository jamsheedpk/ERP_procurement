import React from "react";
import { Icon, Button, IconButton, Avatar, PartyAutocomplete, ProjectSelect } from "../legacy.jsx";
import "../setup.js";
const {
  useState:    useStateProj,
  useMemo:     useMemoProj,
  useEffect:   useEffectProj,
  useCallback: useCallbackProj,
  useRef:      useRefProj,
} = React;

const GMAPS_KEY = "AIzaSyBwq37HvnCUs22Lpm2etp3X8LIr3QVZtdM";

// ── LocationPicker ─────────────────────────────────────────────────────────────
function LocationPicker(props) {
  var value    = props.value   || "";
  var lat      = props.lat     || null;
  var lng      = props.lng     || null;
  var onChange = props.onChange;

  var inputRef  = useRefProj(null);
  var acRef     = useRefProj(null);
  var mapDivRef = useRefProj(null);   // DOM node for the map
  var mapObjRef = useRefProj(null);   // google.maps.Map instance
  var markerRef = useRefProj(null);   // google.maps.Marker instance

  var readyArr  = useStateProj(false);
  var ready     = readyArr[0];
  var setReady  = readyArr[1];

  var coordsArr = useStateProj(lat && lng ? { lat: lat, lng: lng } : null);
  var coords    = coordsArr[0];
  var setCoords = coordsArr[1];

  // Poll until google.maps.places is available
  useEffectProj(function() {
    if (window.google && window.google.maps && window.google.maps.places) {
      setReady(true); return;
    }
    var iv = setInterval(function() {
      if (window.google && window.google.maps && window.google.maps.places) {
        setReady(true);
        clearInterval(iv);
      }
    }, 300);
    return function() { clearInterval(iv); };
  }, []);

  // Attach Places Autocomplete
  useEffectProj(function() {
    if (!ready || !inputRef.current || acRef.current) return;
    var ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry", "name"],
    });
    ac.addListener("place_changed", function() {
      var place = ac.getPlace();
      if (!place.geometry || !place.geometry.location) return;
      var newLat  = place.geometry.location.lat();
      var newLng  = place.geometry.location.lng();
      var address = place.formatted_address || place.name || "";
      setCoords({ lat: newLat, lng: newLng });
      onChange({ location: address, lat: newLat, lng: newLng });
    });
    acRef.current = ac;
  }, [ready]);

  // Create / update interactive map whenever coords change
  useEffectProj(function() {
    if (!coords || !ready || !mapDivRef.current) return;
    var center = { lat: coords.lat, lng: coords.lng };

    if (!mapObjRef.current) {
      mapObjRef.current = new window.google.maps.Map(mapDivRef.current, {
        center: center,
        zoom: 15,
        mapTypeId: "roadmap",
        disableDefaultUI: true,
        zoomControl: true,
        fullscreenControl: true,
        gestureHandling: "cooperative",
      });
    } else {
      mapObjRef.current.setCenter(center);
      mapObjRef.current.setZoom(15);
    }

    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = new window.google.maps.Marker({
      position: center,
      map: mapObjRef.current,
      animation: window.google.maps.Animation.DROP,
      title: value || "Selected location",
    });

    // Force resize in case container was hidden during initialization
    window.google.maps.event.trigger(mapObjRef.current, "resize");
    mapObjRef.current.setCenter(center);
  }, [coords, ready]);

  function handleClear(e) {
    e.preventDefault();
    setCoords(null);
    if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null; }
    mapObjRef.current = null;
    if (inputRef.current) inputRef.current.value = "";
    onChange({ location: "", lat: null, lng: null });
  }

  return (
    <div>
      {/* Search input */}
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
          pointerEvents: "none", zIndex: 1 }}>
          <Icon name="map-pin" size={14} color={ready ? "#C0263A" : "var(--fg-4)"} />
        </span>
        <input
          ref={inputRef}
          className="form-input"
          style={{ paddingLeft: 32, paddingRight: coords ? 32 : 10 }}
          placeholder={ready ? "Search for a location…" : "Loading maps…"}
          defaultValue={value}
          disabled={!ready}
          onChange={function(e) {
            if (!e.target.value) {
              setCoords(null);
              onChange({ location: "", lat: null, lng: null });
            }
          }}
        />
        {coords && (
          <button onMouseDown={handleClear}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", padding: 2,
              display: "flex", alignItems: "center" }}>
            <Icon name="x" size={13} color="var(--fg-3)" />
          </button>
        )}
      </div>

      {/* Coordinates + map — always in DOM so map has dimensions, hidden when no selection */}
      <div style={{
        marginTop: 8,
        maxHeight: coords ? 220 : 0,
        overflow: "hidden",
        transition: "max-height 0.25s ease",
      }}>
        {/* Lat / Lng badge */}
        {coords && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
            background: "var(--ink-50)", borderRadius: 7, marginBottom: 8,
            border: "1px solid var(--border-subtle)" }}>
            <Icon name="crosshair" size={13} color="#1F8A52" />
            <span style={{ fontSize: 11.5, fontFamily: "monospace", color: "var(--fg-2)", fontWeight: 600 }}>
              {coords.lat.toFixed(6)},&nbsp;{coords.lng.toFixed(6)}
            </span>
            <span style={{ fontSize: 10, color: "var(--fg-4)", marginLeft: 2 }}>Lat / Lng</span>
          </div>
        )}
        {/* Interactive map */}
        <div
          ref={mapDivRef}
          style={{
            width: "100%",
            height: 160,
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid var(--border-subtle)",
            background: "var(--ink-100)",
          }}
        />
      </div>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PROJ_TYPES = {
  house:          { label: "House",          icon: "home",            color: "#6F1947" },
  villa:          { label: "Villa",          icon: "house",           color: "#B61B54" },
  office:         { label: "Office",         icon: "building-2",      color: "#2563B0" },
  tower:          { label: "Tower",          icon: "building",        color: "#534AB7" },
  museum:         { label: "Museum",         icon: "landmark",        color: "#854F0B" },
  mall:           { label: "Mall",           icon: "shopping-bag",    color: "#D78A14" },
  hotel:          { label: "Hotel",          icon: "bed-double",      color: "#0F6E56" },
  infrastructure: { label: "Infrastructure", icon: "cable",           color: "#1F8A52" },
  renovation:     { label: "Renovation",     icon: "hammer",          color: "#C0263A" },
  other:          { label: "Other",          icon: "more-horizontal", color: "#A89DA3" },
};

const PROJ_STAGES = [
  { id: "quotation",         label: "Quotation",         icon: "file-text",      color: "#2563B0" },
  { id: "discussion",        label: "Discussion",        icon: "message-circle", color: "#D78A14" },
  { id: "approved",          label: "Approved",          icon: "check-circle-2", color: "#1F8A52" },
  { id: "advance_collected", label: "Advance Collected", icon: "banknote",       color: "#534AB7" },
  { id: "work_started",      label: "Work Started",      icon: "hard-hat",       color: "#6F1947" },
  { id: "completed",         label: "Completed",         icon: "flag",           color: "#0F6E56" },
];

const STAGE_ORDER = ["quotation","discussion","approved","advance_collected","work_started","completed","on_hold","cancelled"];

const PROJ_PRIORITY = {
  low:    { label: "Low",    color: "#A89DA3" },
  medium: { label: "Medium", color: "#D78A14" },
  high:   { label: "High",   color: "#C0263A" },
  urgent: { label: "Urgent", color: "#B61B54" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtAmount(n) {
  return "AED " + (n || 0).toLocaleString();
}

function todayStrProj() {
  var d = new Date();
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var dd = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + dd;
}

function stageIndex(stageId) {
  var idx = STAGE_ORDER.indexOf(stageId);
  return idx === -1 ? 0 : idx;
}

function getDisplayAmount(project) {
  if (project.stage === "completed" && project.finalAmount > 0) return project.finalAmount;
  if (stageIndex(project.stage) >= stageIndex("approved") && project.approvedAmount > 0) return project.approvedAmount;
  return project.quotationAmount || 0;
}

function getDisplayAmountLabel(project) {
  if (project.stage === "completed" && project.finalAmount > 0) return "Final";
  if (stageIndex(project.stage) >= stageIndex("approved") && project.approvedAmount > 0) return "Approved";
  return "Quotation";
}

function getStageMeta(stageId) {
  var found = null;
  PROJ_STAGES.forEach(function(s) { if (s.id === stageId) found = s; });
  return found || { id: stageId, label: stageId, icon: "circle", color: "#A89DA3" };
}

// ── NewProjectModal ────────────────────────────────────────────────────────────

function NewProjectModal(props) {
  var onClose   = props.onClose;
  var onSave    = props.onSave;
  var employees = props.employees || [];
  var initial   = props.initial   || null;
  var isEdit    = !!initial;

  // Fetch quotation list for the Ref dropdown
  var quotationsArr = useStateProj([]);
  var quotations    = quotationsArr[0];
  var setQuotations = quotationsArr[1];

  useEffectProj(function() {
    fetch(window.API + "/quotations")
      .then(function(r) { return r.json(); })
      .then(function(data) { setQuotations(Array.isArray(data) ? data : []); })
      .catch(function() {});
  }, []);

  var defaultForm = {
    title: "", type: "house", partyId: "", partyName: "",
    location: "", lat: null, lng: null,
    priority: "medium", assignedTo: "",
    description: "", quotationDate: "", quotationRef: "",
    quotationAmount: "", notes: "",
  };

  var stateArr = useStateProj(isEdit ? Object.assign({}, defaultForm, initial) : defaultForm);
  var form     = stateArr[0];
  var setForm  = stateArr[1];

  function set(k) {
    return function(e) {
      var val = e.target.value;
      setForm(function(p) { return Object.assign({}, p, { [k]: val }); });
    };
  }

  var valid = form.title.trim() && form.type;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={function(e) { e.stopPropagation(); }}>
        <div className="modal-head">
          <div style={{ fontWeight: 700, fontSize: 15 }}>{isEdit ? "Edit Project" : "New Project"}</div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div className="modal-body">

          <div className="form-row">
            <label className="form-label">Project Title *</label>
            <input className="form-input" placeholder="e.g. Al Noor Villa — Jumeirah" value={form.title} onChange={set("title")} />
          </div>

          <div className="form-row">
            <label className="form-label">Project Type *</label>
            <select className="form-input" value={form.type} onChange={set("type")}>
              {Object.entries(PROJ_TYPES).map(function(pair) {
                return <option key={pair[0]} value={pair[0]}>{pair[1].label}</option>;
              })}
            </select>
          </div>

          <div className="form-row">
            <label className="form-label">Client / Party</label>
            <PartyAutocomplete
              value={form.partyName}
              onChange={function(name, id) {
                setForm(function(p) { return Object.assign({}, p, { partyName: name || "", partyId: id || "" }); });
              }}
              placeholder="Search client…"
            />
          </div>

          <div className="form-row">
            <label className="form-label">Location</label>
            <LocationPicker
              value={form.location}
              lat={form.lat}
              lng={form.lng}
              onChange={function(loc) {
                setForm(function(p) { return Object.assign({}, p, { location: loc.location, lat: loc.lat, lng: loc.lng }); });
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-row">
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={set("priority")}>
                {Object.entries(PROJ_PRIORITY).map(function(pair) {
                  return <option key={pair[0]} value={pair[0]}>{pair[1].label}</option>;
                })}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">Assigned To</label>
              <select className="form-input" value={form.assignedTo} onChange={set("assignedTo")}>
                <option value="">— Select employee —</option>
                {employees.map(function(e) {
                  return (
                    <option key={e.empId} value={e.name}>
                      {e.name} · {e.title || e.dept}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={2} placeholder="Brief project description…" value={form.description} onChange={set("description")}
              style={{ resize: "vertical", fontFamily: "inherit", fontSize: 13 }} />
          </div>

          <div style={{ marginTop: 16, marginBottom: 10, paddingTop: 14, borderTop: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--fg-3)" }}>Quotation Details</div>
          </div>

          {(function() {
            // Filter quotations by the selected party name
            var partyFiltered = quotations.filter(function(q) {
              if (!form.partyName) return true; // show all if no party selected
              var qParty = (q.partyName || q.clientName || "").toLowerCase();
              return qParty === form.partyName.toLowerCase();
            });

            // Find the currently selected quotation
            var selQuo = null;
            for (var i = 0; i < quotations.length; i++) {
              if (quotations[i].quotationId === form.quotationRef) { selQuo = quotations[i]; break; }
            }

            var QUO_STATUS_COLORS = {
              draft: "#A89DA3", sent: "#2563B0", approved: "#1F8A52", rejected: "#C0263A", expired: "#D78A14"
            };

            return (
              <div>
                <div className="form-row">
                  <label className="form-label">
                    Quotation Ref
                    {form.partyName && (
                      <span style={{ marginLeft: 6, fontSize: 10.5, fontWeight: 600, padding: "1px 7px",
                        borderRadius: 8, background: "var(--ink-100)", color: "var(--fg-3)" }}>
                        {partyFiltered.length} for {form.partyName}
                      </span>
                    )}
                  </label>
                  <select className="form-input" value={form.quotationRef}
                    onChange={function(e) {
                      var ref = e.target.value;
                      var quo = null;
                      for (var j = 0; j < quotations.length; j++) {
                        if (quotations[j].quotationId === ref) { quo = quotations[j]; break; }
                      }
                      setForm(function(p) {
                        var patch = { quotationRef: ref };
                        if (quo) {
                          if (quo.grandTotal)   patch.quotationAmount = quo.grandTotal;
                          if (quo.date)         patch.quotationDate   = quo.date;
                          if (!p.title && quo.projectTitle) patch.title = quo.projectTitle;
                        }
                        return Object.assign({}, p, patch);
                      });
                    }}>
                    <option value="">— Select quotation —</option>
                    {partyFiltered.map(function(q) {
                      var status = q.status ? q.status.charAt(0).toUpperCase() + q.status.slice(1) : "";
                      var label  = q.quotationId + (q.projectTitle ? " · " + q.projectTitle : "") + (status ? " [" + status + "]" : "");
                      return <option key={q.quotationId} value={q.quotationId}>{label}</option>;
                    })}
                  </select>
                </div>

                {/* Quotation detail card — shown when a quotation is selected */}
                {selQuo && (
                  <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 10,
                    background: "var(--ink-50)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Icon name="file-text" size={15} color="#2563B0" />
                        <span style={{ fontWeight: 700, fontSize: 13, color: "var(--fg-1)" }}>{selQuo.quotationId}</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
                        background: (QUO_STATUS_COLORS[selQuo.status] || "#A89DA3") + "18",
                        color: QUO_STATUS_COLORS[selQuo.status] || "#A89DA3" }}>
                        {selQuo.status ? selQuo.status.charAt(0).toUpperCase() + selQuo.status.slice(1) : "Draft"}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Grand Total</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#1F8A52" }}>
                          AED {(selQuo.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Date</div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)" }}>{selQuo.date || "—"}</div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Subtotal</div>
                        <div style={{ fontSize: 12, color: "var(--fg-2)" }}>
                          AED {(selQuo.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Tax ({selQuo.taxPct || 5}%)</div>
                        <div style={{ fontSize: 12, color: "var(--fg-2)" }}>
                          AED {(selQuo.taxAmt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {selQuo.items && selQuo.items.length > 0 && (
                      <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 8 }}>
                        <div style={{ fontSize: 10, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                          {selQuo.items.length} Line Item{selQuo.items.length !== 1 ? "s" : ""}
                        </div>
                        {selQuo.items.slice(0, 4).map(function(item, idx) {
                          return (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between",
                              fontSize: 11.5, color: "var(--fg-2)", marginBottom: 3, gap: 8 }}>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                                {item.description}
                              </span>
                              <span style={{ fontWeight: 600, flexShrink: 0, color: "var(--fg-1)" }}>
                                AED {(item.total || 0).toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                        {selQuo.items.length > 4 && (
                          <div style={{ fontSize: 11, color: "var(--fg-4)", fontStyle: "italic" }}>
                            +{selQuo.items.length - 4} more items…
                          </div>
                        )}
                      </div>
                    )}

                    {selQuo.validUntil && (
                      <div style={{ marginTop: 8, fontSize: 11, color: "#D78A14", display: "flex", alignItems: "center", gap: 4 }}>
                        <Icon name="clock" size={11} color="#D78A14" />
                        Valid until {selQuo.validUntil}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-row">
                    <label className="form-label">Quotation Date</label>
                    <input className="form-input" type="date" value={form.quotationDate} onChange={set("quotationDate")} />
                  </div>
                  <div className="form-row">
                    <label className="form-label">Quotation Amount AED</label>
                    <input className="form-input" type="number" min="0" placeholder="0" value={form.quotationAmount} onChange={set("quotationAmount")} />
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid} onClick={function() { onSave(form); }}>
            {isEdit ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AddDiscussionModal ─────────────────────────────────────────────────────────

function AddDiscussionModal(props) {
  var projectId = props.projectId;
  var onClose   = props.onClose;
  var onSave    = props.onSave;

  var stateArr = useStateProj({ date: todayStrProj(), notes: "", outcome: "", by: "" });
  var form     = stateArr[0];
  var setForm  = stateArr[1];

  function set(k) {
    return function(e) {
      var val = e.target.value;
      setForm(function(p) { return Object.assign({}, p, { [k]: val }); });
    };
  }

  var valid = form.notes.trim();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={function(e) { e.stopPropagation(); }}>
        <div className="modal-head">
          <div style={{ fontWeight: 700, fontSize: 15 }}>Add Discussion Note</div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div className="modal-body">

          <div className="form-row">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date} onChange={set("date")} />
          </div>

          <div className="form-row">
            <label className="form-label">Notes *</label>
            <textarea className="form-input" rows={3} placeholder="What was discussed…" value={form.notes} onChange={set("notes")}
              style={{ resize: "vertical", fontFamily: "inherit", fontSize: 13 }} />
          </div>

          <div className="form-row">
            <label className="form-label">Outcome / Next Steps</label>
            <textarea className="form-input" rows={2} placeholder="Agreed actions or follow-ups…" value={form.outcome} onChange={set("outcome")}
              style={{ resize: "vertical", fontFamily: "inherit", fontSize: 13 }} />
          </div>

          <div className="form-row">
            <label className="form-label">By (Attendees)</label>
            <input className="form-input" placeholder="Who attended this discussion" value={form.by} onChange={set("by")} />
          </div>

        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid} onClick={function() { onSave(projectId, form); }}>
            Add Discussion
          </button>
        </div>
      </div>
    </div>
  );
}

// ── StageAdvanceModal ──────────────────────────────────────────────────────────

function StageAdvanceModal(props) {
  var project    = props.project;
  var onClose    = props.onClose;
  var onAdvance  = props.onAdvance;
  var employees  = props.employees || [];

  var stateArr = useStateProj({
    approvedDate: todayStrProj(), approvedAmount: "", approvedBy: "", contractRef: "",
    advanceAmount: "", advanceDate: todayStrProj(), advanceMode: "cash", advanceRef: "",
    workStartDate: todayStrProj(), siteEngineer: "", expectedCompletion: "",
    completionDate: todayStrProj(), finalAmount: "", finalNotes: "",
    discussionDate: todayStrProj(), discussionNotes: "",
  });
  var form    = stateArr[0];
  var setForm = stateArr[1];

  function set(k) {
    return function(e) {
      var val = e.target.value;
      setForm(function(p) { return Object.assign({}, p, { [k]: val }); });
    };
  }

  function handleOnHold() {
    if (window.confirm("Mark this project as On Hold?")) {
      onAdvance(project, { stage: "on_hold" });
    }
  }

  function handleCancel() {
    if (window.confirm("Cancel this project? This action cannot be undone.")) {
      onAdvance(project, { stage: "cancelled" });
    }
  }

  var stage = project.stage;

  var body = null;
  var btnLabel = "Advance Stage";
  var advanceData = null;
  var canAdvance = false;

  if (stage === "quotation") {
    btnLabel = "Move to Discussion";
    canAdvance = true;
    advanceData = {
      stage: "discussion",
    };
    body = (
      <div>
        <div style={{ fontSize: 13, color: "var(--fg-2)", marginBottom: 14 }}>
          Move this project from Quotation into the Discussion stage. No required fields.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-row">
            <label className="form-label">First Discussion Date</label>
            <input className="form-input" type="date" value={form.discussionDate} onChange={set("discussionDate")} />
          </div>
        </div>
        <div className="form-row">
          <label className="form-label">Notes</label>
          <textarea className="form-input" rows={2} value={form.discussionNotes} onChange={set("discussionNotes")}
            style={{ resize: "vertical", fontFamily: "inherit", fontSize: 13 }} />
        </div>
      </div>
    );
  } else if (stage === "discussion") {
    btnLabel = "Mark Approved";
    canAdvance = form.approvedDate && form.approvedAmount && form.approvedBy.trim();
    advanceData = {
      stage: "approved",
      approvedDate: form.approvedDate,
      approvedAmount: parseFloat(form.approvedAmount) || 0,
      approvedBy: form.approvedBy,
      contractRef: form.contractRef,
    };
    body = (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-row">
            <label className="form-label">Approved Date *</label>
            <input className="form-input" type="date" value={form.approvedDate} onChange={set("approvedDate")} />
          </div>
          <div className="form-row">
            <label className="form-label">Approved By *</label>
            <input className="form-input" placeholder="Client / authority name" value={form.approvedBy} onChange={set("approvedBy")} />
          </div>
        </div>
        <div className="form-row">
          <label className="form-label">Approved Amount AED *</label>
          <input className="form-input" type="number" min="0" placeholder="0" value={form.approvedAmount} onChange={set("approvedAmount")} />
        </div>
        <div className="form-row">
          <label className="form-label">Contract Ref</label>
          <input className="form-input" placeholder="Contract / agreement reference" value={form.contractRef} onChange={set("contractRef")} />
        </div>
      </div>
    );
  } else if (stage === "approved") {
    btnLabel = "Record Advance";
    canAdvance = form.advanceAmount && form.advanceDate;
    advanceData = {
      stage: "advance_collected",
      advanceAmount: parseFloat(form.advanceAmount) || 0,
      advanceDate: form.advanceDate,
      advanceMode: form.advanceMode,
      advanceRef: form.advanceRef,
    };
    body = (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-row">
            <label className="form-label">Advance Amount AED *</label>
            <input className="form-input" type="number" min="0" placeholder="0" value={form.advanceAmount} onChange={set("advanceAmount")} />
          </div>
          <div className="form-row">
            <label className="form-label">Advance Date *</label>
            <input className="form-input" type="date" value={form.advanceDate} onChange={set("advanceDate")} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-row">
            <label className="form-label">Payment Mode</label>
            <select className="form-input" value={form.advanceMode} onChange={set("advanceMode")}>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="mobile_pay">Mobile Pay</option>
            </select>
          </div>
          <div className="form-row">
            <label className="form-label">Advance Ref</label>
            <input className="form-input" placeholder="Receipt / cheque number" value={form.advanceRef} onChange={set("advanceRef")} />
          </div>
        </div>
      </div>
    );
  } else if (stage === "advance_collected") {
    btnLabel = "Start Work";
    canAdvance = form.workStartDate;
    advanceData = {
      stage: "work_started",
      workStartDate: form.workStartDate,
      siteEngineer: form.siteEngineer,
      expectedCompletion: form.expectedCompletion,
    };
    body = (
      <div>
        <div className="form-row">
          <label className="form-label">Work Start Date *</label>
          <input className="form-input" type="date" value={form.workStartDate} onChange={set("workStartDate")} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-row">
            <label className="form-label">Site Engineer</label>
            <select className="form-input" value={form.siteEngineer} onChange={set("siteEngineer")}>
              <option value="">— Select employee —</option>
              {employees.map(function(e) {
                return (
                  <option key={e.empId} value={e.name}>
                    {e.name} · {e.title || e.dept}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="form-row">
            <label className="form-label">Expected Completion</label>
            <input className="form-input" type="date" value={form.expectedCompletion} onChange={set("expectedCompletion")} />
          </div>
        </div>
      </div>
    );
  } else if (stage === "work_started") {
    btnLabel = "Mark Completed";
    canAdvance = form.completionDate;
    advanceData = {
      stage: "completed",
      completionDate: form.completionDate,
      finalAmount: parseFloat(form.finalAmount) || 0,
      notes: form.finalNotes,
    };
    body = (
      <div>
        <div className="form-row">
          <label className="form-label">Completion Date *</label>
          <input className="form-input" type="date" value={form.completionDate} onChange={set("completionDate")} />
        </div>
        <div className="form-row">
          <label className="form-label">Final Amount AED</label>
          <input className="form-input" type="number" min="0" placeholder="0" value={form.finalAmount} onChange={set("finalAmount")} />
        </div>
        <div className="form-row">
          <label className="form-label">Final Notes</label>
          <textarea className="form-input" rows={2} placeholder="Completion notes, handover details…" value={form.finalNotes} onChange={set("finalNotes")}
            style={{ resize: "vertical", fontFamily: "inherit", fontSize: 13 }} />
        </div>
      </div>
    );
  } else {
    body = (
      <div style={{ fontSize: 13, color: "var(--fg-3)", padding: "16px 0" }}>
        Stage cannot be advanced further.
      </div>
    );
  }

  var stageMeta = getStageMeta(stage);
  var nextStageMap = {
    quotation: "Discussion", discussion: "Approved",
    approved: "Advance Collected", advance_collected: "Work Started",
    work_started: "Completed",
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={function(e) { e.stopPropagation(); }}>
        <div className="modal-head">
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Advance Stage</div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>
              {project.title}
            </div>
          </div>
          <IconButton icon="x" onClick={onClose} />
        </div>
        <div className="modal-body">

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 9, background: stageMeta.color + "14", marginBottom: 16 }}>
            <Icon name={stageMeta.icon} size={16} color={stageMeta.color} />
            <span style={{ fontSize: 13, fontWeight: 600, color: stageMeta.color }}>
              Currently: {stageMeta.label}
            </span>
            {nextStageMap[stage] && (
              <span style={{ fontSize: 12, color: "var(--fg-3)", marginLeft: 4 }}>
                → {nextStageMap[stage]}
              </span>
            )}
          </div>

          {body}

        </div>
        <div className="modal-foot" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
          {advanceData !== null && (
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" disabled={!canAdvance}
                onClick={function() { onAdvance(project, advanceData); }}>
                {btnLabel}
              </button>
            </div>
          )}
          {project.stage !== "on_hold" && project.stage !== "cancelled" && (
            <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: "1px solid var(--border-subtle)" }}>
              <button className="btn" style={{ flex: 1, fontSize: 12, color: "#D78A14", borderColor: "#D78A14" }}
                onClick={handleOnHold}>
                <Icon name="pause-circle" size={13} color="#D78A14" />
                Mark On Hold
              </button>
              <button className="btn" style={{ flex: 1, fontSize: 12, color: "#C0263A", borderColor: "#C0263A" }}
                onClick={handleCancel}>
                <Icon name="x-circle" size={13} color="#C0263A" />
                Cancel Project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ProjectCard ────────────────────────────────────────────────────────────────

function ProjectCard(props) {
  var project    = props.project;
  var isSelected = props.isSelected;
  var onClick    = props.onClick;

  var typeMeta  = PROJ_TYPES[project.type]  || PROJ_TYPES.other;
  var stageMeta = getStageMeta(project.stage);
  var priMeta   = PROJ_PRIORITY[project.priority] || PROJ_PRIORITY.medium;
  var amount    = getDisplayAmount(project);
  var displayDate = project.workStartDate || project.quotationDate || "";

  return (
    <div
      onClick={onClick}
      style={{
        padding: 12, borderRadius: 10, background: "var(--bg-surface)",
        cursor: "pointer", marginBottom: 10,
        border: "2px solid " + (isSelected ? stageMeta.color : "transparent"),
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        transition: "border-color 0.15s",
      }}
    >
      {/* Row 1: type icon + title + priority dot */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: typeMeta.color + "18",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={typeMeta.icon} size={12} color={typeMeta.color} />
        </div>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis",
          whiteSpace: "nowrap", color: "var(--fg-1)" }}>
          {project.title}
        </div>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: priMeta.color, flexShrink: 0 }} />
      </div>

      {/* Row 2: party name */}
      {project.partyName && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <Icon name="contact-round" size={10} color="var(--fg-3)" />
          <span style={{ fontSize: 11, color: "var(--fg-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {project.partyName}
          </span>
        </div>
      )}

      {/* Row 3: amount */}
      {amount > 0 && (
        <div style={{ fontSize: 12, fontWeight: 700, color: stageMeta.color, marginBottom: 4 }}>
          {fmtAmount(amount)}
        </div>
      )}

      {/* Row 4: discussion count + date */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {project.discussions && project.discussions.length > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: 600,
            padding: "1px 6px", borderRadius: 4, background: "#FEF3C7", color: "#D78A14" }}>
            <Icon name="message-circle" size={10} color="#D78A14" />
            {project.discussions.length}
          </span>
        )}
        {displayDate && (
          <span style={{ fontSize: 11, color: "var(--fg-4)", marginLeft: "auto" }}>
            {displayDate}
          </span>
        )}
      </div>
    </div>
  );
}

// ── DetailMapView — interactive map shown in detail pane ──────────────────────
function DetailMapView(props) {
  var lat   = props.lat;
  var lng   = props.lng;
  var label = props.label || "Project location";

  var divRef    = useRefProj(null);
  var mapRef    = useRefProj(null);
  var markerRef = useRefProj(null);

  useEffectProj(function() {
    function init() {
      if (!divRef.current || !window.google) return;
      var center = { lat: lat, lng: lng };
      mapRef.current = new window.google.maps.Map(divRef.current, {
        center: center,
        zoom: 15,
        mapTypeId: "roadmap",
        disableDefaultUI: true,
        zoomControl: true,
        fullscreenControl: true,
        gestureHandling: "cooperative",
      });
      markerRef.current = new window.google.maps.Marker({
        position: center,
        map: mapRef.current,
        title: label,
        animation: window.google.maps.Animation.DROP,
      });
    }

    if (window.google && window.google.maps) {
      init();
    } else {
      var iv = setInterval(function() {
        if (window.google && window.google.maps) { clearInterval(iv); init(); }
      }, 300);
      return function() { clearInterval(iv); };
    }
  }, [lat, lng]);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <Icon name="crosshair" size={12} color="#1F8A52" />
        <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--fg-3)" }}>
          {lat.toFixed(6)},&nbsp;{lng.toFixed(6)}
        </span>
        <span style={{ fontSize: 10, color: "var(--fg-4)" }}>Lat / Lng</span>
      </div>
      <div
        ref={divRef}
        style={{
          width: "100%", height: 160, borderRadius: 8,
          overflow: "hidden", border: "1px solid var(--border-subtle)",
          background: "var(--ink-100)",
        }}
      />
    </div>
  );
}

// ── ReactivatePanel ────────────────────────────────────────────────────────────
function ReactivatePanel(props) {
  var project    = props.project;
  var onActivate = props.onActivate;
  var isOnHold   = project.stage === "on_hold";

  var stageArr      = useStateProj("quotation");
  var resumeStage   = stageArr[0];
  var setResumeStage = stageArr[1];

  var resumeOptions = PROJ_STAGES.map(function(s) { return { id: s.id, label: s.label }; });

  function handleActivate() {
    var msg = isOnHold
      ? "Resume this project at the \"" + (PROJ_STAGES.find(function(s) { return s.id === resumeStage; }) || {}).label + "\" stage?"
      : "Reopen this cancelled project at the \"" + (PROJ_STAGES.find(function(s) { return s.id === resumeStage; }) || {}).label + "\" stage?";
    if (!window.confirm(msg)) return;
    onActivate(project, { stage: resumeStage });
  }

  var color = isOnHold ? "#D78A14" : "#C0263A";

  return (
    <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 10,
      background: isOnHold ? "#FEF9EE" : "#FFF5F5",
      border: "1.5px solid " + color + "40" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <Icon name={isOnHold ? "pause-circle" : "x-circle"} size={15} color={color} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: color }}>
          {isOnHold ? "Project is On Hold" : "Project is Cancelled"}
        </span>
      </div>

      <div className="form-row" style={{ marginBottom: 10 }}>
        <label className="form-label" style={{ fontSize: 11 }}>Resume at stage</label>
        <select className="form-input" value={resumeStage} onChange={function(e) { setResumeStage(e.target.value); }}>
          {resumeOptions.map(function(opt) {
            return <option key={opt.id} value={opt.id}>{opt.label}</option>;
          })}
        </select>
      </div>

      <button
        onClick={handleActivate}
        style={{ width: "100%", padding: "8px 0", borderRadius: 8, cursor: "pointer",
          fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700, border: "none",
          background: isOnHold ? "#D78A14" : "#1F8A52", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Icon name="play-circle" size={14} color="#fff" />
        {isOnHold ? "Resume Project" : "Reopen Project"}
      </button>
    </div>
  );
}

// ── DetailPane ─────────────────────────────────────────────────────────────────

function DetailPane(props) {
  var project        = props.project;
  var onClose        = props.onClose;
  var onDelete       = props.onDelete;
  var onEdit          = props.onEdit;
  var onAddDiscussion = props.onAddDiscussion;
  var onAdvanceStage  = props.onAdvanceStage;
  var onActivate      = props.onActivate;
  var onNoteSave      = props.onNoteSave;

  var editStateArr = useStateProj(false);
  var editingNote  = editStateArr[0];
  var setEditingNote = editStateArr[1];

  var draftStateArr = useStateProj(project.notes || "");
  var noteDraft     = draftStateArr[0];
  var setNoteDraft  = draftStateArr[1];

  var typeMeta  = PROJ_TYPES[project.type]  || PROJ_TYPES.other;
  var stageMeta = getStageMeta(project.stage);
  var priMeta   = PROJ_PRIORITY[project.priority] || PROJ_PRIORITY.medium;

  var stageIdx = stageIndex(project.stage);
  var mainStageIds = ["quotation","discussion","approved","advance_collected","work_started","completed"];
  var currentMainIdx = mainStageIds.indexOf(project.stage);

  var nextStageLabels = {
    quotation: "Move to Discussion",
    discussion: "Mark Approved",
    approved: "Record Advance",
    advance_collected: "Start Work",
    work_started: "Mark Completed",
  };

  var showAdvanceBtn = nextStageLabels[project.stage];

  // Stage progress bar
  function renderStageBar() {
    return (
      <div style={{ padding: "16px 0", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "flex-start", position: "relative" }}>
          {PROJ_STAGES.map(function(s, i) {
            var isPast    = currentMainIdx > i;
            var isCurrent = currentMainIdx === i;
            var isFuture  = currentMainIdx < i;
            var isLast    = i === PROJ_STAGES.length - 1;

            return (
              <div key={s.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                {/* Connector line */}
                {!isLast && (
                  <div style={{
                    position: "absolute", top: 11, left: "50%", width: "100%", height: 2,
                    background: isPast ? s.color : "var(--border-subtle)",
                    zIndex: 0,
                  }} />
                )}
                {/* Dot */}
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", zIndex: 1, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isPast ? s.color : isCurrent ? "transparent" : "var(--ink-50)",
                  border: isCurrent ? "2px solid " + s.color : isPast ? "2px solid " + s.color : "2px solid var(--border-subtle)",
                  transition: "all 0.2s",
                }}>
                  {isPast && <Icon name="check" size={11} color="#fff" />}
                  {isCurrent && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                  )}
                </div>
                {/* Label */}
                <div style={{ fontSize: 9.5, textAlign: "center", marginTop: 5, fontWeight: isCurrent ? 700 : 400,
                  color: isCurrent ? s.color : isPast ? "var(--fg-2)" : "var(--fg-4)", lineHeight: 1.3, maxWidth: 50 }}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
        {(project.stage === "on_hold" || project.stage === "cancelled") && (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
              background: project.stage === "on_hold" ? "#FEF3C7" : "#FFF1F2",
              color: project.stage === "on_hold" ? "#D78A14" : "#C0263A" }}>
              {project.stage === "on_hold" ? "On Hold" : "Cancelled"}
            </span>
          </div>
        )}
      </div>
    );
  }

  function InfoRow(rowProps) {
    var label = rowProps.label;
    var value = rowProps.value;
    var color = rowProps.color || "var(--fg-1)";
    if (!value) return null;
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: 12.5, marginBottom: 6, gap: 8 }}>
        <span style={{ color: "var(--fg-3)", flexShrink: 0 }}>{label}</span>
        <span style={{ fontWeight: 600, color: color, textAlign: "right" }}>{value}</span>
      </div>
    );
  }

  function SectionHead(secProps) {
    var label = secProps.label;
    var badge = secProps.badge;
    var action = secProps.action;
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--fg-3)" }}>{label}</div>
          {badge != null && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "var(--plum-50)", color: "var(--brand-burgundy)" }}>
              {badge}
            </span>
          )}
        </div>
        {action}
      </div>
    );
  }

  // Amount display
  function renderAmounts() {
    var items = [];
    if (project.quotationAmount > 0) {
      items.push({ label: "Quotation", amount: project.quotationAmount, color: "#2563B0" });
    }
    if (project.approvedAmount > 0) {
      items.push({ label: "Approved", amount: project.approvedAmount, color: "#1F8A52" });
    }
    if (project.finalAmount > 0) {
      items.push({ label: "Final", amount: project.finalAmount, color: "#0F6E56" });
    }
    if (items.length === 0) return null;
    return (
      <div style={{ background: "var(--ink-50)", borderRadius: 10, padding: "14px 18px", textAlign: "center", marginBottom: 4, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
        {items.map(function(item) {
          return (
            <div key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{fmtAmount(item.amount)}</div>
              <div style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 2 }}>{item.label}</div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "18px 20px", position: "sticky", top: 90,
      maxHeight: "calc(100vh - 110px)", overflowY: "auto", scrollbarWidth: "none",
      msOverflowStyle: "none", minWidth: 0 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: typeMeta.color + "18",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={typeMeta.icon} size={22} color={typeMeta.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, color: "var(--fg-1)" }}>{project.title}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700,
              padding: "2px 8px", borderRadius: 5, background: stageMeta.color + "18", color: stageMeta.color }}>
              <Icon name={stageMeta.icon} size={10} color={stageMeta.color} />
              {stageMeta.label}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700,
              padding: "2px 8px", borderRadius: 5, background: priMeta.color + "18", color: priMeta.color }}>
              {priMeta.label}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <IconButton icon="edit-2" title="Edit project" onClick={function() { onEdit(project); }} />
          <IconButton icon="trash-2" title="Delete" onClick={function() { onDelete(project.projectId); }} />
          <IconButton icon="x" title="Close" onClick={onClose} />
        </div>
      </div>

      {/* Stage progress bar */}
      {renderStageBar()}

      {/* Amounts */}
      {renderAmounts()}

      {/* Project Details */}
      <SectionHead label="Project Details" />
      <InfoRow label="Type"        value={typeMeta.label} />
      <InfoRow label="Location" value={project.location} />
      {project.lat && project.lng && (
        <DetailMapView lat={project.lat} lng={project.lng} label={project.location} />
      )}
      <InfoRow label="Assigned To" value={project.assignedTo} />
      <InfoRow label="Client"      value={project.partyName} />
      {project.description && (
        <div style={{ fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.55, marginTop: 4, marginBottom: 4 }}>
          {project.description}
        </div>
      )}

      {/* Quotation */}
      <SectionHead label="Quotation" />
      <InfoRow label="Date"   value={project.quotationDate} />
      <InfoRow label="Ref"    value={project.quotationRef} />
      <InfoRow label="Amount" value={project.quotationAmount > 0 ? fmtAmount(project.quotationAmount) : ""} color="#2563B0" />

      {/* Discussions */}
      <SectionHead
        label="Discussions"
        badge={(project.discussions || []).length}
        action={
          <button style={{ fontSize: 11.5, color: "var(--brand-burgundy)", fontWeight: 600, background: "none",
            border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4 }}
            onClick={function() { onAddDiscussion(project.projectId); }}>
            <Icon name="plus" size={13} color="var(--brand-burgundy)" />
            Add
          </button>
        }
      />
      {(project.discussions || []).length === 0 ? (
        <div style={{ fontSize: 12.5, color: "var(--fg-4)", fontStyle: "italic", padding: "10px 0" }}>
          No discussions logged yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {project.discussions.map(function(disc, i) {
            return (
              <div key={i} style={{ padding: "10px 12px", borderRadius: 8, background: "var(--ink-50)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--fg-2)" }}>{disc.date || "—"}</span>
                  {disc.by && <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{disc.by}</span>}
                </div>
                {disc.notes && <div style={{ fontSize: 12.5, color: "var(--fg-1)", lineHeight: 1.5, marginBottom: 4 }}>{disc.notes}</div>}
                {disc.outcome && (
                  <div style={{ fontSize: 11.5, color: "#D78A14", fontStyle: "italic" }}>
                    {disc.outcome}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Approval */}
      {(["approved","advance_collected","work_started","completed"].indexOf(project.stage) >= 0) && (
        <div>
          <SectionHead label="Approval" />
          <InfoRow label="Date"         value={project.approvedDate} />
          <InfoRow label="By"           value={project.approvedBy} />
          <InfoRow label="Amount"       value={project.approvedAmount > 0 ? fmtAmount(project.approvedAmount) : ""} color="#1F8A52" />
          <InfoRow label="Contract Ref" value={project.contractRef} />
        </div>
      )}

      {/* Advance */}
      {(["advance_collected","work_started","completed"].indexOf(project.stage) >= 0) && (
        <div>
          <SectionHead label="Advance Collected" />
          <InfoRow label="Amount" value={project.advanceAmount > 0 ? fmtAmount(project.advanceAmount) : ""} color="#534AB7" />
          <InfoRow label="Date"   value={project.advanceDate} />
          <InfoRow label="Mode"   value={project.advanceMode} />
          <InfoRow label="Ref"    value={project.advanceRef} />
        </div>
      )}

      {/* Work */}
      {(["work_started","completed"].indexOf(project.stage) >= 0) && (
        <div>
          <SectionHead label="Work In Progress" />
          <InfoRow label="Start Date"          value={project.workStartDate} />
          <InfoRow label="Site Engineer"        value={project.siteEngineer} />
          <InfoRow label="Expected Completion" value={project.expectedCompletion} />
        </div>
      )}

      {/* Completion */}
      {project.stage === "completed" && (
        <div>
          <SectionHead label="Completion" />
          <InfoRow label="Date"         value={project.completionDate} />
          <InfoRow label="Final Amount" value={project.finalAmount > 0 ? fmtAmount(project.finalAmount) : ""} color="#0F6E56" />
        </div>
      )}

      {/* Notes */}
      <SectionHead
        label="Notes"
        action={
          !editingNote ? (
            <button style={{ fontSize: 11.5, color: "var(--brand-burgundy)", fontWeight: 600, background: "none",
              border: "none", cursor: "pointer", padding: 0 }}
              onClick={function() { setEditingNote(true); setNoteDraft(project.notes || ""); }}>
              {project.notes ? "Edit" : "Add"}
            </button>
          ) : null
        }
      />
      {editingNote ? (
        <div>
          <textarea value={noteDraft} onChange={function(e) { setNoteDraft(e.target.value); }} rows={3} autoFocus
            style={{ width: "100%", fontSize: 12.5, padding: "8px 10px", borderRadius: 8,
              border: "1px solid var(--border-subtle)", resize: "vertical", fontFamily: "inherit",
              color: "var(--fg-1)", background: "var(--bg-surface)", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary" style={{ fontSize: 12, padding: "5px 14px" }}
              onClick={function() { onNoteSave(project.projectId, noteDraft); setEditingNote(false); }}>Save</button>
            <button className="btn" style={{ fontSize: 12, padding: "5px 14px" }}
              onClick={function() { setEditingNote(false); }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: project.notes ? "var(--fg-2)" : "var(--fg-3)", lineHeight: 1.55,
          padding: "10px 12px", background: "var(--ink-50)", borderRadius: 8,
          fontStyle: project.notes ? "normal" : "italic", minHeight: 36 }}>
          {project.notes || "No notes."}
        </div>
      )}

      {/* Advance Stage button */}
      {showAdvanceBtn && (
        <div style={{ marginTop: 20 }}>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", gap: 6 }}
            onClick={function() { onAdvanceStage(project); }}>
            <Icon name="arrow-right" size={14} color="#fff" />
            {showAdvanceBtn}
          </button>
        </div>
      )}

      {/* Reactivate — shown only for on_hold / cancelled */}
      {(project.stage === "on_hold" || project.stage === "cancelled") && (
        <ReactivatePanel project={project} onActivate={onActivate} />
      )}
    </div>
  );
}

// ── KanbanColumn ───────────────────────────────────────────────────────────────

function KanbanColumn(props) {
  var stage      = props.stage;
  var projects   = props.projects;
  var selectedId = props.selectedId;
  var onSelect   = props.onSelect;

  var totalAmt = 0;
  projects.forEach(function(p) { totalAmt += getDisplayAmount(p); });

  return (
    <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 220px)" }}>
      {/* Column header */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 12px", borderRadius: "10px 10px 0 0",
        background: "var(--ink-50)", borderBottom: "2px solid " + stage.color, marginBottom: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: stage.color + "20",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={stage.icon} size={14} color={stage.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--fg-1)" }}>{stage.label}</div>
          {totalAmt > 0 && (
            <div style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{fmtAmount(totalAmt)}</div>
          )}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
          background: stage.color + "18", color: stage.color }}>
          {projects.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ overflowY: "auto", flex: 1, padding: "10px 8px", background: "var(--ink-50)",
        borderRadius: "0 0 10px 10px", paddingRight: 4 }}>
        {projects.length === 0 ? (
          <div style={{ border: "2px dashed var(--border-subtle)", borderRadius: 8, padding: "24px 12px",
            textAlign: "center", color: "var(--fg-4)", fontSize: 12 }}>
            No projects
          </div>
        ) : (
          projects.map(function(p) {
            return (
              <ProjectCard
                key={p.projectId}
                project={p}
                isSelected={selectedId === p.projectId}
                onClick={function() { onSelect(p.projectId); }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

// ── ProjectPage ────────────────────────────────────────────────────────────────

function ProjectPage() {
  var projectsStateArr = useStateProj([]);
  var projects     = projectsStateArr[0];
  var setProjects  = projectsStateArr[1];

  var employeesStateArr = useStateProj([]);
  var employees     = employeesStateArr[0];
  var setEmployees  = employeesStateArr[1];

  var loadingStateArr = useStateProj(true);
  var loading      = loadingStateArr[0];
  var setLoading   = loadingStateArr[1];

  var selectedStateArr = useStateProj(null);
  var selected     = selectedStateArr[0];
  var setSelected  = selectedStateArr[1];

  var showNewStateArr = useStateProj(false);
  var showNew      = showNewStateArr[0];
  var setShowNew   = showNewStateArr[1];

  var showEditStateArr = useStateProj(null); // holds the project being edited
  var showEdit     = showEditStateArr[0];
  var setShowEdit  = showEditStateArr[1];

  var showAdvanceStateArr = useStateProj(null);
  var showAdvance  = showAdvanceStateArr[0];
  var setShowAdvance = showAdvanceStateArr[1];

  var showDiscussionStateArr = useStateProj(null);
  var showDiscussion  = showDiscussionStateArr[0];
  var setShowDiscussion = showDiscussionStateArr[1];

  var searchStateArr = useStateProj("");
  var search     = searchStateArr[0];
  var setSearch  = searchStateArr[1];

  var typeFilterStateArr = useStateProj("all");
  var typeFilter    = typeFilterStateArr[0];
  var setTypeFilter = typeFilterStateArr[1];

  var priorityFilterStateArr = useStateProj("all");
  var priorityFilter    = priorityFilterStateArr[0];
  var setPriorityFilter = priorityFilterStateArr[1];

  var stageFilterStateArr = useStateProj("all");
  var stageFilter    = stageFilterStateArr[0];
  var setStageFilter = stageFilterStateArr[1];

  var viewStateArr = useStateProj("pipeline");
  var view     = viewStateArr[0];
  var setView  = viewStateArr[1];

  var editingNoteStateArr = useStateProj(false);
  var editingNote    = editingNoteStateArr[0];
  var setEditingNote = editingNoteStateArr[1];

  var noteDraftStateArr = useStateProj("");
  var noteDraft    = noteDraftStateArr[0];
  var setNoteDraft = noteDraftStateArr[1];

  var pageStateArr = useStateProj(1);
  var page     = pageStateArr[0];
  var setPage  = pageStateArr[1];
  var PAGE_SIZE = 15;

  // ── Fetch ────────────────────────────────────────────────────────────────────
  useEffectProj(function() {
    async function load() {
      setLoading(true);
      try {
        var results = await Promise.all([
          fetch(window.API + "/projects").then(function(r) { return r.json(); }),
          fetch(window.API + "/employees").then(function(r) { return r.json(); }),
        ]);
        setProjects(Array.isArray(results[0]) ? results[0] : []);
        setEmployees(Array.isArray(results[1]) ? results[1] : []);
      } catch(e) {
        console.error(e);
        setProjects([]);
        setEmployees([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  // ── Computed ─────────────────────────────────────────────────────────────────
  var filtered = useMemoProj(function() {
    return projects.filter(function(p) {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (priorityFilter !== "all" && p.priority !== priorityFilter) return false;
      if (stageFilter !== "all" && p.stage !== stageFilter) return false;
      if (search) {
        var q = search.toLowerCase();
        var hit = (p.title || "").toLowerCase().indexOf(q) >= 0
          || (p.partyName || "").toLowerCase().indexOf(q) >= 0
          || (p.location || "").toLowerCase().indexOf(q) >= 0;
        if (!hit) return false;
      }
      return true;
    });
  }, [projects, typeFilter, priorityFilter, stageFilter, search]);

  var kpi = useMemoProj(function() {
    var total = projects.length;
    var active = 0;
    var pipelineValue = 0;
    var completed = 0;
    projects.forEach(function(p) {
      var isActive = ["completed","cancelled","on_hold"].indexOf(p.stage) < 0;
      if (isActive) {
        active++;
        pipelineValue += p.quotationAmount || 0;
      }
      if (p.stage === "completed") completed++;
    });
    return { total: total, active: active, pipelineValue: pipelineValue, completed: completed };
  }, [projects]);

  var stageGroups = useMemoProj(function() {
    var groups = {};
    PROJ_STAGES.forEach(function(s) { groups[s.id] = []; });
    filtered.forEach(function(p) {
      if (groups[p.stage]) {
        groups[p.stage].push(p);
      }
    });
    return groups;
  }, [filtered]);

  var onHoldProjects     = useMemoProj(function() { return projects.filter(function(p) { return p.stage === "on_hold"; }); }, [projects]);
  var cancelledProjects  = useMemoProj(function() { return projects.filter(function(p) { return p.stage === "cancelled"; }); }, [projects]);

  var selectedProject = useMemoProj(function() {
    if (!selected) return null;
    return projects.find(function(p) { return p.projectId === selected; }) || null;
  }, [projects, selected]);

  // ── Pagination for list view ─────────────────────────────────────────────────
  useEffectProj(function() { setPage(1); }, [typeFilter, priorityFilter, stageFilter, search]);

  var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  var safePage   = Math.min(page, totalPages);
  var pageStart  = (safePage - 1) * PAGE_SIZE;
  var pageRows   = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  var handleNew = useCallbackProj(async function(form) {
    try {
      var body = Object.assign({}, form, {
        quotationAmount: parseFloat(form.quotationAmount) || 0,
        lat: form.lat || null,
        lng: form.lng || null,
      });
      var r   = await fetch(window.API + "/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      var doc = await r.json();
      setProjects(function(prev) { return [doc, ...prev]; });
    } catch(err) { console.error(err); }
    setShowNew(false);
  }, []);

  var handleEditProject = useCallbackProj(async function(form) {
    if (!showEdit) return;
    var id = showEdit.projectId;
    var body = Object.assign({}, form, {
      quotationAmount: parseFloat(form.quotationAmount) || 0,
      lat: form.lat || null,
      lng: form.lng || null,
    });
    // Optimistic update
    setProjects(function(prev) { return prev.map(function(p) { return p.projectId === id ? Object.assign({}, p, body) : p; }); });
    try {
      var r   = await fetch(window.API + "/projects/" + id, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      var doc = await r.json();
      setProjects(function(prev) { return prev.map(function(p) { return p.projectId === id ? doc : p; }); });
    } catch(err) { console.error(err); }
    setShowEdit(null);
  }, [showEdit]);

  var handleDelete = useCallbackProj(async function(projectId) {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    setProjects(function(prev) { return prev.filter(function(p) { return p.projectId !== projectId; }); });
    setSelected(null);
    try {
      await fetch(window.API + "/projects/" + projectId, { method: "DELETE" });
    } catch(err) { console.error(err); }
  }, []);

  var handleAdvance = useCallbackProj(async function(project, data) {
    setShowAdvance(null);
    try {
      var r   = await fetch(window.API + "/projects/" + project.projectId, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      var doc = await r.json();
      setProjects(function(prev) { return prev.map(function(p) { return p.projectId === doc.projectId ? doc : p; }); });
    } catch(err) { console.error(err); }
  }, []);

  var handleActivate = useCallbackProj(async function(project, data) {
    // Optimistic update
    setProjects(function(prev) { return prev.map(function(p) { return p.projectId === project.projectId ? Object.assign({}, p, data) : p; }); });
    try {
      var r   = await fetch(window.API + "/projects/" + project.projectId, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      var doc = await r.json();
      setProjects(function(prev) { return prev.map(function(p) { return p.projectId === doc.projectId ? doc : p; }); });
    } catch(err) { console.error(err); }
  }, []);

  var handleAddDiscussion = useCallbackProj(async function(projectId, form) {
    setShowDiscussion(null);
    try {
      var r   = await fetch(window.API + "/projects/" + projectId + "/discussions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      var doc = await r.json();
      setProjects(function(prev) { return prev.map(function(p) { return p.projectId === doc.projectId ? doc : p; }); });
    } catch(err) { console.error(err); }
  }, []);

  var handleNoteSave = useCallbackProj(async function(projectId, notes) {
    try {
      var r   = await fetch(window.API + "/projects/" + projectId, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes }),
      });
      var doc = await r.json();
      setProjects(function(prev) { return prev.map(function(p) { return p.projectId === doc.projectId ? doc : p; }); });
    } catch(err) { console.error(err); }
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Projects</div>
          <h1 className="page-title">Project Pipeline</h1>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        {[1,2,3,4,5].map(function(i) { return <div key={i} className="card pulse" style={{ height: 52 }} />; })}
      </div>
    </div>
  );

  var navBtnStyle = function(dis) {
    return { width: 28, height: 28, borderRadius: 7, border: "1px solid var(--border-subtle)",
      background: "var(--bg-surface)", cursor: dis ? "default" : "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", opacity: dis ? 0.4 : 1 };
  };

  return (
    <div className="page">
      {/* Page head */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Projects</div>
          <h1 className="page-title">Project Pipeline</h1>
          <div className="page-sub">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
            {" · "}
            <span style={{ fontWeight: 700, color: "#534AB7" }}>{fmtAmount(kpi.pipelineValue)}</span>
            {" pipeline value"}
          </div>
        </div>
        <div className="row" style={{ gap: 8, alignItems: "center" }}>
          {/* View toggle */}
          <div style={{ display: "flex", gap: 2, padding: "3px", background: "var(--ink-50)", borderRadius: 9, border: "1px solid var(--border-subtle)" }}>
            <button onClick={function() { setView("pipeline"); }}
              style={{ padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                background: view === "pipeline" ? "var(--bg-surface)" : "transparent",
                boxShadow: view === "pipeline" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                fontSize: 12, fontWeight: 600, color: view === "pipeline" ? "var(--fg-1)" : "var(--fg-3)" }}>
              <Icon name="layout-dashboard" size={14} color={view === "pipeline" ? "var(--brand-burgundy)" : "var(--fg-3)"} />
              Pipeline
            </button>
            <button onClick={function() { setView("list"); }}
              style={{ padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                background: view === "list" ? "var(--bg-surface)" : "transparent",
                boxShadow: view === "list" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                fontSize: 12, fontWeight: 600, color: view === "list" ? "var(--fg-1)" : "var(--fg-3)" }}>
              <Icon name="list" size={14} color={view === "list" ? "var(--brand-burgundy)" : "var(--fg-3)"} />
              List
            </button>
          </div>
          <Button variant="primary" icon="plus" onClick={function() { setShowNew(true); }}>New Project</Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderTop: "3px solid #2563B0" }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#2563B015", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="building-2" size={20} color="#2563B0" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#2563B0" }}>{kpi.total}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>Total Projects</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderTop: "3px solid #1F8A52" }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#1F8A5215", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="activity" size={20} color="#1F8A52" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1F8A52" }}>{kpi.active}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>Active</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderTop: "3px solid #534AB7" }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#534AB715", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="trending-up" size={20} color="#534AB7" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#534AB7" }}>{fmtAmount(kpi.pipelineValue)}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>Pipeline Value</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderTop: "3px solid #0F6E56" }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#0F6E5615", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="flag" size={20} color="#0F6E56" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0F6E56" }}>{kpi.completed}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>Completed</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={14} color="var(--fg-3)" />
          </span>
          <input className="search-input" placeholder="Search projects…" value={search}
            onChange={function(e) { setSearch(e.target.value); }}
            style={{ paddingLeft: 32, width: 210 }} />
        </div>

        {/* Type pills */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <button className={"pill-btn" + (typeFilter === "all" ? " active" : "")}
            onClick={function() { setTypeFilter("all"); }}>All Types</button>
          {Object.entries(PROJ_TYPES).map(function(pair) {
            return (
              <button key={pair[0]} className={"pill-btn" + (typeFilter === pair[0] ? " active" : "")}
                onClick={function() { setTypeFilter(pair[0]); }}
                style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name={pair[1].icon} size={11} color={typeFilter === pair[0] ? "#fff" : pair[1].color} />
                {pair[1].label}
              </button>
            );
          })}
        </div>

        {/* Priority pills */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <button className={"pill-btn" + (priorityFilter === "all" ? " active" : "")}
            onClick={function() { setPriorityFilter("all"); }}>All Priority</button>
          {Object.entries(PROJ_PRIORITY).map(function(pair) {
            return (
              <button key={pair[0]} className={"pill-btn" + (priorityFilter === pair[0] ? " active" : "")}
                onClick={function() { setPriorityFilter(pair[0]); }}
                style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: priorityFilter === pair[0] ? "#fff" : pair[1].color, display: "inline-block" }} />
                {pair[1].label}
              </button>
            );
          })}
        </div>

        {/* Stage pills — list view only */}
        {view === "list" && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            <button className={"pill-btn" + (stageFilter === "all" ? " active" : "")}
              onClick={function() { setStageFilter("all"); }}>All Stages</button>
            {PROJ_STAGES.map(function(s) {
              return (
                <button key={s.id} className={"pill-btn" + (stageFilter === s.id ? " active" : "")}
                  onClick={function() { setStageFilter(s.id); }}
                  style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name={s.icon} size={11} color={stageFilter === s.id ? "#fff" : s.color} />
                  {s.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* On Hold / Cancelled chips */}
      {(onHoldProjects.length > 0 || cancelledProjects.length > 0) && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {onHoldProjects.length > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700,
              padding: "4px 10px", borderRadius: 6, background: "#FEF3C7", color: "#D78A14", cursor: "pointer" }}
              onClick={function() { setStageFilter(stageFilter === "on_hold" ? "all" : "on_hold"); setView("list"); }}>
              <Icon name="pause-circle" size={12} color="#D78A14" />
              {onHoldProjects.length} On Hold
            </span>
          )}
          {cancelledProjects.length > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700,
              padding: "4px 10px", borderRadius: 6, background: "#FFF1F2", color: "#C0263A", cursor: "pointer" }}
              onClick={function() { setStageFilter(stageFilter === "cancelled" ? "all" : "cancelled"); setView("list"); }}>
              <Icon name="x-circle" size={12} color="#C0263A" />
              {cancelledProjects.length} Cancelled
            </span>
          )}
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 && !loading && (
        <div style={{ padding: "80px 0", textAlign: "center", color: "var(--fg-3)" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--plum-50)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Icon name="building-2" size={32} color="var(--brand-burgundy)" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: "var(--fg-1)" }}>No projects yet</div>
          <div style={{ fontSize: 13, color: "var(--fg-3)" }}>Click <strong>New Project</strong> to add your first</div>
        </div>
      )}

      {/* Pipeline view */}
      {view === "pipeline" && projects.length > 0 && (
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          {/* Kanban scroll area */}
          <div style={{ flex: 1, overflowX: "auto", paddingBottom: 16 }}>
            <div style={{ display: "flex", gap: 16, minWidth: "max-content" }}>
              {PROJ_STAGES.map(function(s) {
                return (
                  <KanbanColumn
                    key={s.id}
                    stage={s}
                    projects={stageGroups[s.id] || []}
                    selectedId={selected}
                    onSelect={function(id) { setSelected(selected === id ? null : id); }}
                  />
                );
              })}
            </div>
          </div>

          {/* Detail pane */}
          {selectedProject && (
            <div style={{ width: 340, flexShrink: 0 }}>
              <DetailPane
                project={selectedProject}
                onClose={function() { setSelected(null); }}
                onEdit={function(proj) { setShowEdit(proj); }}
                onDelete={handleDelete}
                onAddDiscussion={function(pid) { setShowDiscussion(pid); }}
                onAdvanceStage={function(proj) { setShowAdvance(proj); }}
                onActivate={handleActivate}
                onNoteSave={handleNoteSave}
              />
            </div>
          )}
        </div>
      )}

      {/* List view */}
      {view === "list" && projects.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: selectedProject ? "1fr 340px" : "1fr", gap: 20, alignItems: "start" }}>
          <div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--ink-50)" }}>
                    {["Title","Type","Client","Location","Stage","Priority","Quotation","Assigned",""].map(function(h) {
                      return (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700,
                          textTransform: "uppercase", color: "var(--fg-3)", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(function(p) {
                    var isSel     = selected === p.projectId;
                    var pTypeMeta = PROJ_TYPES[p.type] || PROJ_TYPES.other;
                    var pStage    = getStageMeta(p.stage);
                    var pPri      = PROJ_PRIORITY[p.priority] || PROJ_PRIORITY.medium;
                    return (
                      <tr key={p.projectId}
                        style={{ borderBottom: "1px solid var(--border-subtle)", cursor: "pointer",
                          background: isSel ? "var(--plum-50)" : "transparent" }}
                        onClick={function() { setSelected(isSel ? null : p.projectId); }}>

                        <td style={{ padding: "10px 14px", maxWidth: 200 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg-1)", overflow: "hidden",
                            textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                          <div style={{ fontSize: 11, color: "var(--fg-4)" }}>{p.projectId}</div>
                        </td>

                        <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600,
                            padding: "2px 7px", borderRadius: 5, background: pTypeMeta.color + "15", color: pTypeMeta.color }}>
                            <Icon name={pTypeMeta.icon} size={10} color={pTypeMeta.color} />
                            {pTypeMeta.label}
                          </span>
                        </td>

                        <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--fg-2)", whiteSpace: "nowrap" }}>
                          {p.partyName || "—"}
                        </td>

                        <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--fg-3)", whiteSpace: "nowrap" }}>
                          {p.location || "—"}
                        </td>

                        <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700,
                            padding: "2px 8px", borderRadius: 5, background: pStage.color + "18", color: pStage.color }}>
                            <Icon name={pStage.icon} size={10} color={pStage.color} />
                            {pStage.label}
                          </span>
                        </td>

                        <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700,
                            padding: "2px 7px", borderRadius: 5, background: pPri.color + "18", color: pPri.color }}>
                            {pPri.label}
                          </span>
                        </td>

                        <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: "#2563B0", whiteSpace: "nowrap" }}>
                          {p.quotationAmount > 0 ? fmtAmount(p.quotationAmount) : "—"}
                        </td>

                        <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--fg-2)", whiteSpace: "nowrap" }}>
                          {p.assignedTo || "—"}
                        </td>

                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 5,
                              color: "var(--fg-3)", display: "flex", alignItems: "center" }}
                              onClick={function(e) { e.stopPropagation(); setShowDiscussion(p.projectId); }}
                              title="Add discussion">
                              <Icon name="message-circle" size={14} color="var(--fg-3)" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div style={{ padding: "48px 0", textAlign: "center", color: "var(--fg-3)" }}>
                  <Icon name="building-2" size={28} color="var(--fg-3)" />
                  <div style={{ marginTop: 10, fontWeight: 600, fontSize: 14 }}>No projects match filters</div>
                  <div style={{ fontSize: 12, marginTop: 4, color: "var(--fg-4)" }}>Adjust filters or search terms</div>
                </div>
              )}

              {filtered.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px",
                  borderTop: "1px solid var(--border-subtle)", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontSize: 12.5, color: "var(--fg-3)" }}>
                    {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length} projects
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={function() { setPage(1); }} disabled={safePage === 1} style={navBtnStyle(safePage === 1)}>
                      <span style={{ fontSize: 12 }}>«</span>
                    </button>
                    <button onClick={function() { setPage(safePage - 1); }} disabled={safePage === 1} style={navBtnStyle(safePage === 1)}>
                      <span style={{ fontSize: 12 }}>‹</span>
                    </button>
                    {Array.from({ length: totalPages }, function(_, i) { return i + 1; }).filter(function(n) {
                      return n === 1 || n === totalPages || (n >= safePage - 2 && n <= safePage + 2);
                    }).map(function(n, i, arr) {
                      return [
                        i > 0 && arr[i-1] !== n - 1 ? (
                          <span key={"e" + n} style={{ width: 28, height: 28, display: "flex", alignItems: "center",
                            justifyContent: "center", fontSize: 12, color: "var(--fg-3)" }}>…</span>
                        ) : null,
                        <button key={n} onClick={function() { setPage(n); }}
                          style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--border-subtle)",
                            cursor: "pointer", fontSize: 12, fontWeight: n === safePage ? 700 : 400,
                            background: n === safePage ? "#2563B0" : "var(--bg-surface)",
                            color: n === safePage ? "#fff" : "var(--fg-1)" }}>
                          {n}
                        </button>
                      ];
                    })}
                    <button onClick={function() { setPage(safePage + 1); }} disabled={safePage === totalPages} style={navBtnStyle(safePage === totalPages)}>
                      <span style={{ fontSize: 12 }}>›</span>
                    </button>
                    <button onClick={function() { setPage(totalPages); }} disabled={safePage === totalPages} style={navBtnStyle(safePage === totalPages)}>
                      <span style={{ fontSize: 12 }}>»</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detail pane for list view */}
          {selectedProject && (
            <DetailPane
              project={selectedProject}
              onClose={function() { setSelected(null); }}
              onEdit={function(proj) { setShowEdit(proj); }}
              onDelete={handleDelete}
              onAddDiscussion={function(pid) { setShowDiscussion(pid); }}
              onAdvanceStage={function(proj) { setShowAdvance(proj); }}
              onActivate={handleActivate}
              onNoteSave={handleNoteSave}
            />
          )}
        </div>
      )}

      {/* Modals */}
      {showNew && (
        <NewProjectModal
          employees={employees}
          onClose={function() { setShowNew(false); }}
          onSave={handleNew}
        />
      )}

      {showEdit && (
        <NewProjectModal
          employees={employees}
          initial={{
            title:           showEdit.title,
            type:            showEdit.type,
            partyId:         showEdit.partyId,
            partyName:       showEdit.partyName,
            location:        showEdit.location,
            lat:             showEdit.lat,
            lng:             showEdit.lng,
            priority:        showEdit.priority,
            assignedTo:      showEdit.assignedTo,
            description:     showEdit.description,
            quotationDate:   showEdit.quotationDate,
            quotationRef:    showEdit.quotationRef,
            quotationAmount: showEdit.quotationAmount || "",
            notes:           showEdit.notes,
          }}
          onClose={function() { setShowEdit(null); }}
          onSave={handleEditProject}
        />
      )}

      {showAdvance && (
        <StageAdvanceModal
          project={showAdvance}
          employees={employees}
          onClose={function() { setShowAdvance(null); }}
          onAdvance={handleAdvance}
        />
      )}

      {showDiscussion && (
        <AddDiscussionModal
          projectId={showDiscussion}
          onClose={function() { setShowDiscussion(null); }}
          onSave={handleAddDiscussion}
        />
      )}
    </div>
  );
}

Object.assign(window, { ProjectPage });

export default ProjectPage;
