/**
 * The canonical 11-stage procurement lifecycle, mirroring the backend.
 *
 * Note: in the monolith this lived in global scope and its `stageIndex` helper
 * collided with ProjectPage's same-named global, pinning the stepper to stage 1.
 * Here it is module-scoped — module boundaries make that whole class of bug
 * structurally impossible, which is a core reason to adopt micro-frontends.
 */
export const PROC_STAGES = [
  { key: "enquiry",             label: "Enquiry",             icon: "search",        phase: "Initiation" },
  { key: "prepare_list",        label: "Prepare List",        icon: "list-checks",   phase: "Initiation" },
  { key: "quotation",           label: "Quotation (RFQ)",     icon: "file-text",     phase: "Sourcing" },
  { key: "comparison",          label: "Comparison",          icon: "scale",         phase: "Sourcing" },
  { key: "approval",            label: "Approval",            icon: "check-circle",  phase: "Sourcing" },
  { key: "lpo",                 label: "LPO Issue",           icon: "file-output",   phase: "Ordering" },
  { key: "proforma",            label: "Proforma Invoice",    icon: "receipt",       phase: "Payment" },
  { key: "payment_application", label: "Payment Application", icon: "file-plus",     phase: "Payment" },
  { key: "payment_appr",        label: "Payment Approval",    icon: "badge-check",   phase: "Payment" },
  { key: "payment_release",     label: "Payment Release",     icon: "banknote",      phase: "Payment" },
  { key: "logistics",           label: "Logistics",           icon: "truck",         phase: "Delivery" },
];

export const STAGE_KEYS = PROC_STAGES.map((s) => s.key);
export const STAGE_BY_KEY = Object.fromEntries(PROC_STAGES.map((s) => [s.key, s]));
export const stageIndex = (key) => STAGE_KEYS.indexOf(key);

export const PHASE_COLOR = {
  Initiation: "#2563B0", Sourcing: "#D78A14", Ordering: "#534AB7", Payment: "#1F8A52", Delivery: "#0F6E56",
};

export const PRIORITY_META = {
  low:    { label: "Low",    color: "#A89DA3" },
  normal: { label: "Normal", color: "#2563B0" },
  high:   { label: "High",   color: "#D78A14" },
  urgent: { label: "Urgent", color: "#C0263A" },
};

export const STATUS_META = {
  in_progress: { label: "In Progress", color: "#2563B0", bg: "#EFF6FF" },
  completed:   { label: "Completed",   color: "#1F8A52", bg: "#ECFDF5" },
  on_hold:     { label: "On Hold",     color: "#9A6A11", bg: "#FEF8EC" },
  cancelled:   { label: "Cancelled",   color: "#C0263A", bg: "#FEF2F2" },
};
