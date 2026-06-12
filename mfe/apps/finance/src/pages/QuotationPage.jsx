import React from "react";
import { Icon, Button, IconButton, Avatar, PartyAutocomplete, ProjectSelect } from "../legacy.jsx";
import "../setup.js";
const {
  useState:   useStateQ,
  useEffect:  useEffectQ,
  useMemo:    useMemoQ,
  useCallback:useCallbackQ,
  useRef:     useRefQ,
} = React;

/* ── Status metadata ─────────────────────────────────────────── */
var QUO_STATUS = {
  draft:    { label: "Draft",    color: "#A89DA3", bg: "var(--ink-100)",  icon: "file-text"      },
  sent:     { label: "Sent",     color: "#2563B0", bg: "#EFF6FF",         icon: "send"            },
  approved: { label: "Approved", color: "#1F8A52", bg: "#ECFDF5",         icon: "check-circle-2"  },
  rejected: { label: "Rejected", color: "#C0263A", bg: "#FFF1F2",         icon: "x-circle"        },
  expired:  { label: "Expired",  color: "#D78A14", bg: "#FEF3C7",         icon: "clock"           },
};

var QUO_PROJ_TYPES = [
  { value: "house",          label: "House" },
  { value: "villa",          label: "Villa" },
  { value: "office",         label: "Office" },
  { value: "tower",          label: "Tower" },
  { value: "museum",         label: "Museum" },
  { value: "mall",           label: "Mall" },
  { value: "hotel",          label: "Hotel" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "renovation",     label: "Renovation" },
  { value: "city_space",     label: "City Space" },
  { value: "transport",      label: "Transport" },
  { value: "park",           label: "Park" },
  { value: "other",          label: "Other" },
];

var UNIT_OPTIONS = ["lump sum","sqm","sqft","month","week","day","nos","lot"];

var DEFAULT_EXCLUSIONS = "Supply of construction materials unless specifically stated. Furniture, fixtures and loose items. Utility connection fees and government levies. Any works not specifically mentioned in the scope above.";

/* ── Templates ─────────────────────────────────────────────────── */
var QUOTATION_TEMPLATES = {
  house: {
    introduction: "We are pleased to submit our professional quotation for the architectural design, planning and development of your residential property. Our team brings extensive experience in designing premium residential spaces that balance aesthetics, functionality, and sustainability. This proposal covers comprehensive design services from concept through construction.",
    scopeOfWork: "• Preliminary concept design and feasibility study\n• Full architectural working drawings\n• Structural and civil engineering design\n• MEP (Mechanical, Electrical & Plumbing) engineering\n• Interior design and space planning\n• Landscape and outdoor environment design\n• 3D visualization and photorealistic renderings\n• Construction supervision and site visits\n• Project management and consultant coordination\n• Authority submission and planning approvals",
    exclusions: DEFAULT_EXCLUSIONS,
    items: [
      { category: "Design", description: "Preliminary & Concept Design", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Design", description: "Architectural Working Drawings", unit: "lump sum", qty: 1, unitPrice: 15000 },
      { category: "Engineering", description: "Structural Engineering Design", unit: "lump sum", qty: 1, unitPrice: 10000 },
      { category: "Engineering", description: "MEP (Mechanical, Electrical & Plumbing) Design", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Design", description: "Interior Design & Space Planning", unit: "lump sum", qty: 1, unitPrice: 12000 },
      { category: "Design", description: "Landscape & Outdoor Design", unit: "lump sum", qty: 1, unitPrice: 5000 },
      { category: "Visualization", description: "3D Visualization & Renderings", unit: "lump sum", qty: 1, unitPrice: 6000 },
      { category: "Supervision", description: "Construction Supervision", unit: "month", qty: 6, unitPrice: 3500 },
      { category: "Management", description: "Project Management & Coordination", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Approvals", description: "Authority Submission & Approvals", unit: "lump sum", qty: 1, unitPrice: 4000 },
    ],
  },
  villa: {
    introduction: "We are pleased to submit our professional quotation for the architectural design, planning and development of your luxury villa. Our team brings extensive experience in designing premium residential spaces that balance aesthetics, functionality, and sustainability. This proposal covers comprehensive design services from concept through construction.",
    scopeOfWork: "• Preliminary concept design and feasibility study\n• Full architectural working drawings for luxury villa\n• Structural and civil engineering design\n• MEP (Mechanical, Electrical & Plumbing) engineering\n• Interior design and luxury finishes specification\n• Landscape and outdoor environment design\n• 3D visualization and photorealistic renderings\n• Construction supervision and site visits\n• Project management and consultant coordination\n• Authority submission and planning approvals",
    exclusions: DEFAULT_EXCLUSIONS,
    items: [
      { category: "Design", description: "Preliminary & Concept Design", unit: "lump sum", qty: 1, unitPrice: 12000 },
      { category: "Design", description: "Architectural Working Drawings", unit: "lump sum", qty: 1, unitPrice: 20000 },
      { category: "Engineering", description: "Structural Engineering Design", unit: "lump sum", qty: 1, unitPrice: 14000 },
      { category: "Engineering", description: "MEP (Mechanical, Electrical & Plumbing) Design", unit: "lump sum", qty: 1, unitPrice: 12000 },
      { category: "Design", description: "Interior Design & Space Planning", unit: "lump sum", qty: 1, unitPrice: 18000 },
      { category: "Design", description: "Luxury Finishes Specification", unit: "lump sum", qty: 1, unitPrice: 10000 },
      { category: "Design", description: "Landscape & Outdoor Design", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Visualization", description: "3D Visualization & Renderings", unit: "lump sum", qty: 1, unitPrice: 9000 },
      { category: "Supervision", description: "Construction Supervision", unit: "month", qty: 8, unitPrice: 4500 },
      { category: "Management", description: "Project Management & Coordination", unit: "lump sum", qty: 1, unitPrice: 10000 },
      { category: "Approvals", description: "Authority Submission & Approvals", unit: "lump sum", qty: 1, unitPrice: 5000 },
    ],
  },
  office: {
    introduction: "We are pleased to present our architectural and interior design services quotation for your commercial office development. Our designs create productive, modern workplaces that reflect your brand identity and enhance employee wellbeing. We offer end-to-end design solutions from concept to handover.",
    scopeOfWork: "• Concept and schematic design for office layout\n• Detailed architectural design and working drawings\n• Space planning and workplace strategy\n• Interior design and fit-out drawings\n• Structural engineering\n• MEP engineering design\n• Facade design\n• IT & AV infrastructure planning\n• 3D visualization and walkthroughs\n• Construction supervision\n• Authority approvals and submissions",
    exclusions: DEFAULT_EXCLUSIONS,
    items: [
      { category: "Design", description: "Concept & Schematic Design", unit: "lump sum", qty: 1, unitPrice: 12000 },
      { category: "Design", description: "Detailed Architectural Design", unit: "lump sum", qty: 1, unitPrice: 20000 },
      { category: "Design", description: "Space Planning & Workplace Strategy", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Design", description: "Interior Design & Fit-Out Drawings", unit: "lump sum", qty: 1, unitPrice: 18000 },
      { category: "Engineering", description: "Structural Engineering", unit: "lump sum", qty: 1, unitPrice: 12000 },
      { category: "Engineering", description: "MEP Engineering Design", unit: "lump sum", qty: 1, unitPrice: 14000 },
      { category: "Design", description: "Facade Design", unit: "lump sum", qty: 1, unitPrice: 10000 },
      { category: "Engineering", description: "IT & AV Infrastructure Planning", unit: "lump sum", qty: 1, unitPrice: 6000 },
      { category: "Visualization", description: "3D Visualization", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Supervision", description: "Construction Supervision", unit: "month", qty: 8, unitPrice: 4500 },
      { category: "Approvals", description: "Authority Approvals", unit: "lump sum", qty: 1, unitPrice: 5000 },
    ],
  },
  tower: {
    introduction: "We are honored to present our comprehensive high-rise architectural and engineering design services. Our experienced team specializes in iconic tower design combining structural innovation, sustainable technologies, and world-class aesthetics. This quotation covers full design services for your tower development.",
    scopeOfWork: "• Master planning and concept design\n• Detailed architectural design\n• High-rise structural engineering\n• MEP engineering design\n• Facade engineering and design\n• BIM modeling (LOD 350)\n• Fire life safety design\n• Vertical transportation design\n• Landscape and podium design\n• 3D visualization and fly-through\n• Construction management\n• Authority submissions",
    exclusions: DEFAULT_EXCLUSIONS,
    items: [
      { category: "Design", description: "Master Planning & Concept Design", unit: "lump sum", qty: 1, unitPrice: 35000 },
      { category: "Design", description: "Detailed Architectural Design", unit: "lump sum", qty: 1, unitPrice: 60000 },
      { category: "Engineering", description: "Structural Engineering (High-Rise)", unit: "lump sum", qty: 1, unitPrice: 45000 },
      { category: "Engineering", description: "MEP Engineering Design", unit: "lump sum", qty: 1, unitPrice: 40000 },
      { category: "Engineering", description: "Facade Engineering & Design", unit: "lump sum", qty: 1, unitPrice: 30000 },
      { category: "Engineering", description: "BIM Modeling (LOD 350)", unit: "lump sum", qty: 1, unitPrice: 25000 },
      { category: "Engineering", description: "Fire Life Safety Design", unit: "lump sum", qty: 1, unitPrice: 15000 },
      { category: "Engineering", description: "Vertical Transportation Design", unit: "lump sum", qty: 1, unitPrice: 12000 },
      { category: "Design", description: "Landscape & Podium Design", unit: "lump sum", qty: 1, unitPrice: 18000 },
      { category: "Visualization", description: "3D Visualization & Fly-through", unit: "lump sum", qty: 1, unitPrice: 20000 },
      { category: "Management", description: "Construction Management", unit: "month", qty: 24, unitPrice: 12000 },
      { category: "Approvals", description: "Authority Submissions", unit: "lump sum", qty: 1, unitPrice: 10000 },
    ],
  },
  museum: {
    introduction: "We are delighted to present our architectural design proposal for your museum project. Our studio has deep expertise in creating cultural institutions that inspire and educate, blending spatial narrative with architectural excellence. This quotation covers all design disciplines required to deliver a world-class museum experience.",
    scopeOfWork: "• Cultural concept and narrative design\n• Architectural design development\n• Exhibition space planning\n• Structural engineering\n• MEP engineering\n• Acoustic and environmental design\n• Specialist lighting design\n• Conservation and climate control specification\n• Accessibility and universal design\n• 3D visualization and walkthrough\n• Construction supervision\n• Authority approvals",
    exclusions: DEFAULT_EXCLUSIONS,
    items: [
      { category: "Design", description: "Cultural Concept & Narrative Design", unit: "lump sum", qty: 1, unitPrice: 25000 },
      { category: "Design", description: "Architectural Design Development", unit: "lump sum", qty: 1, unitPrice: 40000 },
      { category: "Design", description: "Exhibition Space Planning", unit: "lump sum", qty: 1, unitPrice: 20000 },
      { category: "Engineering", description: "Structural Engineering", unit: "lump sum", qty: 1, unitPrice: 22000 },
      { category: "Engineering", description: "MEP Engineering", unit: "lump sum", qty: 1, unitPrice: 18000 },
      { category: "Engineering", description: "Acoustic & Environmental Design", unit: "lump sum", qty: 1, unitPrice: 12000 },
      { category: "Design", description: "Specialist Lighting Design", unit: "lump sum", qty: 1, unitPrice: 15000 },
      { category: "Engineering", description: "Conservation & Climate Control Spec", unit: "lump sum", qty: 1, unitPrice: 10000 },
      { category: "Design", description: "Accessibility & Universal Design", unit: "lump sum", qty: 1, unitPrice: 6000 },
      { category: "Visualization", description: "3D Visualization & Walkthrough", unit: "lump sum", qty: 1, unitPrice: 18000 },
      { category: "Supervision", description: "Construction Supervision", unit: "month", qty: 18, unitPrice: 8000 },
      { category: "Approvals", description: "Authority Approvals", unit: "lump sum", qty: 1, unitPrice: 8000 },
    ],
  },
  mall: {
    introduction: "We are pleased to submit our design services quotation for your retail and commercial mall development. Our team specializes in creating vibrant retail environments that maximize footfall, tenant mix, and shopper experience. This proposal covers full architectural and engineering design for your mall project.",
    scopeOfWork: "• Master planning and zoning\n• Architectural design\n• Retail space planning and leasing plan\n• Anchor tenant zone design\n• Food court and F&B zone design\n• Structural engineering\n• MEP engineering\n• Facade and signage design\n• Parking structure design\n• Landscape and external works\n• 3D visualization\n• Construction supervision",
    exclusions: DEFAULT_EXCLUSIONS,
    items: [
      { category: "Design", description: "Master Planning & Zoning", unit: "lump sum", qty: 1, unitPrice: 30000 },
      { category: "Design", description: "Architectural Design", unit: "lump sum", qty: 1, unitPrice: 55000 },
      { category: "Design", description: "Retail Space Planning & Leasing Plan", unit: "lump sum", qty: 1, unitPrice: 20000 },
      { category: "Design", description: "Anchor Tenant Zone Design", unit: "lump sum", qty: 1, unitPrice: 15000 },
      { category: "Design", description: "Food Court & F&B Zone Design", unit: "lump sum", qty: 1, unitPrice: 12000 },
      { category: "Engineering", description: "Structural Engineering", unit: "lump sum", qty: 1, unitPrice: 35000 },
      { category: "Engineering", description: "MEP Engineering", unit: "lump sum", qty: 1, unitPrice: 30000 },
      { category: "Design", description: "Facade & Signage Design", unit: "lump sum", qty: 1, unitPrice: 20000 },
      { category: "Engineering", description: "Parking Structure Design", unit: "lump sum", qty: 1, unitPrice: 18000 },
      { category: "Design", description: "Landscape & External Works", unit: "lump sum", qty: 1, unitPrice: 15000 },
      { category: "Visualization", description: "3D Visualization", unit: "lump sum", qty: 1, unitPrice: 15000 },
      { category: "Supervision", description: "Construction Supervision", unit: "month", qty: 20, unitPrice: 10000 },
    ],
  },
  hotel: {
    introduction: "We are delighted to present our hospitality design services quotation for your hotel development. Our team combines deep knowledge of hospitality standards with innovative design to create exceptional guest experiences. This proposal delivers complete design services from brand concept through construction.",
    scopeOfWork: "• Hospitality concept design\n• Full architectural design\n• Guest room layout and FF&E design\n• F&B outlet and restaurant design\n• Lobby and public area design\n• Spa and wellness facility design\n• Structural engineering\n• MEP engineering\n• Service and back-of-house planning\n• Pool and recreation design\n• 3D visualization\n• Construction supervision",
    exclusions: DEFAULT_EXCLUSIONS,
    items: [
      { category: "Design", description: "Hospitality Concept Design", unit: "lump sum", qty: 1, unitPrice: 28000 },
      { category: "Design", description: "Architectural Design", unit: "lump sum", qty: 1, unitPrice: 45000 },
      { category: "Design", description: "Guest Room Layout & FF&E Design", unit: "lump sum", qty: 1, unitPrice: 20000 },
      { category: "Design", description: "F&B Outlet & Restaurant Design", unit: "lump sum", qty: 1, unitPrice: 18000 },
      { category: "Design", description: "Lobby & Public Area Design", unit: "lump sum", qty: 1, unitPrice: 15000 },
      { category: "Design", description: "Spa & Wellness Facility Design", unit: "lump sum", qty: 1, unitPrice: 12000 },
      { category: "Engineering", description: "Structural Engineering", unit: "lump sum", qty: 1, unitPrice: 25000 },
      { category: "Engineering", description: "MEP Engineering", unit: "lump sum", qty: 1, unitPrice: 22000 },
      { category: "Design", description: "Service & Back-of-House Planning", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Design", description: "Pool & Recreation Design", unit: "lump sum", qty: 1, unitPrice: 10000 },
      { category: "Visualization", description: "3D Visualization", unit: "lump sum", qty: 1, unitPrice: 16000 },
      { category: "Supervision", description: "Construction Supervision", unit: "month", qty: 16, unitPrice: 9000 },
    ],
  },
  infrastructure: {
    introduction: "We are pleased to submit our engineering and design services quotation for your infrastructure development project. Our multidisciplinary team delivers technically sound, cost-effective infrastructure solutions that meet the highest regulatory standards and community needs.",
    scopeOfWork: "• Site survey and topographic study\n• Civil engineering design\n• Road and transportation design\n• Drainage and stormwater design\n• Utilities infrastructure design\n• Structural engineering\n• Environmental impact assessment\n• Landscape and softscape design\n• Authority approvals and submissions\n• Construction supervision",
    exclusions: DEFAULT_EXCLUSIONS,
    items: [
      { category: "Survey", description: "Site Survey & Topographic Study", unit: "lump sum", qty: 1, unitPrice: 15000 },
      { category: "Engineering", description: "Civil Engineering Design", unit: "lump sum", qty: 1, unitPrice: 30000 },
      { category: "Engineering", description: "Road & Transportation Design", unit: "lump sum", qty: 1, unitPrice: 20000 },
      { category: "Engineering", description: "Drainage & Stormwater Design", unit: "lump sum", qty: 1, unitPrice: 12000 },
      { category: "Engineering", description: "Utilities Infrastructure Design", unit: "lump sum", qty: 1, unitPrice: 18000 },
      { category: "Engineering", description: "Structural Engineering", unit: "lump sum", qty: 1, unitPrice: 15000 },
      { category: "Environment", description: "Environmental Impact Assessment", unit: "lump sum", qty: 1, unitPrice: 10000 },
      { category: "Design", description: "Landscape & Softscape Design", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Approvals", description: "Authority Approvals & Submissions", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Supervision", description: "Construction Supervision", unit: "month", qty: 12, unitPrice: 6000 },
    ],
  },
  renovation: {
    introduction: "We are pleased to present our architectural design and project management quotation for your renovation and refurbishment project. Our team specialises in transforming existing spaces while preserving character, improving functionality, and incorporating modern design elements. This quotation covers all services required for a successful renovation.",
    scopeOfWork: "• Existing conditions survey and documentation\n• Structural assessment\n• Architectural renovation design\n• Interior design and finishes specification\n• MEP upgrade design\n• Demolition and construction drawings\n• 3D before and after visualization\n• Construction supervision\n• Authority approvals",
    exclusions: DEFAULT_EXCLUSIONS,
    items: [
      { category: "Survey", description: "Existing Conditions Survey & Documentation", unit: "lump sum", qty: 1, unitPrice: 6000 },
      { category: "Engineering", description: "Structural Assessment", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Design", description: "Architectural Renovation Design", unit: "lump sum", qty: 1, unitPrice: 18000 },
      { category: "Design", description: "Interior Design & Finishes Specification", unit: "lump sum", qty: 1, unitPrice: 14000 },
      { category: "Engineering", description: "MEP Upgrade Design", unit: "lump sum", qty: 1, unitPrice: 10000 },
      { category: "Design", description: "Demolition & Construction Drawings", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Visualization", description: "3D Before & After Visualization", unit: "lump sum", qty: 1, unitPrice: 7000 },
      { category: "Supervision", description: "Construction Supervision", unit: "month", qty: 4, unitPrice: 4000 },
      { category: "Approvals", description: "Authority Approvals", unit: "lump sum", qty: 1, unitPrice: 3000 },
    ],
  },
  city_space: {
    introduction: "We are pleased to present our urban design and planning services quotation for your city space development. Our award-winning urban design team creates liveable, vibrant public spaces that foster community connection and enhance city identity. This proposal covers complete design services for your urban space project.",
    scopeOfWork: "• Urban design masterplan\n• Public space concept design\n• Landscape architecture\n• Hardscape and softscape design\n• Public art and feature integration\n• Lighting design\n• Accessibility and universal design\n• Environmental and sustainability assessment\n• Community engagement materials\n• Construction supervision\n• Authority submissions",
    exclusions: DEFAULT_EXCLUSIONS,
    items: [
      { category: "Design", description: "Urban Design Masterplan", unit: "lump sum", qty: 1, unitPrice: 35000 },
      { category: "Design", description: "Public Space Concept Design", unit: "lump sum", qty: 1, unitPrice: 20000 },
      { category: "Design", description: "Landscape Architecture", unit: "lump sum", qty: 1, unitPrice: 18000 },
      { category: "Design", description: "Hardscape & Softscape Design", unit: "lump sum", qty: 1, unitPrice: 12000 },
      { category: "Design", description: "Public Art & Feature Integration", unit: "lump sum", qty: 1, unitPrice: 10000 },
      { category: "Design", description: "Lighting Design", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Design", description: "Accessibility & Universal Design", unit: "lump sum", qty: 1, unitPrice: 6000 },
      { category: "Environment", description: "Environmental & Sustainability Assessment", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Design", description: "Community Engagement Materials", unit: "lump sum", qty: 1, unitPrice: 5000 },
      { category: "Supervision", description: "Construction Supervision", unit: "month", qty: 8, unitPrice: 5000 },
      { category: "Approvals", description: "Authority Submissions", unit: "lump sum", qty: 1, unitPrice: 5000 },
    ],
  },
  park: {
    introduction: "We are pleased to present our landscape and park design services quotation for your park development project. Our landscape architecture team creates inviting green spaces that connect communities with nature, promote wellbeing, and enhance the urban environment. This proposal covers full design services from concept through construction.",
    scopeOfWork: "• Site analysis and assessment\n• Park master plan and concept design\n• Landscape architecture design\n• Playground and recreational equipment design\n• Irrigation system design\n• Outdoor and pathway lighting design\n• Pathway and civil works design\n• Planting design and species schedule\n• Environmental impact assessment\n• Construction supervision",
    exclusions: DEFAULT_EXCLUSIONS,
    items: [
      { category: "Survey", description: "Site Analysis & Assessment", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Design", description: "Park Master Plan", unit: "lump sum", qty: 1, unitPrice: 20000 },
      { category: "Design", description: "Landscape Architecture Design", unit: "lump sum", qty: 1, unitPrice: 18000 },
      { category: "Design", description: "Playground & Recreational Equipment Design", unit: "lump sum", qty: 1, unitPrice: 10000 },
      { category: "Engineering", description: "Irrigation System Design", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Design", description: "Outdoor & Pathway Lighting Design", unit: "lump sum", qty: 1, unitPrice: 7000 },
      { category: "Engineering", description: "Pathway & Civil Works Design", unit: "lump sum", qty: 1, unitPrice: 12000 },
      { category: "Design", description: "Planting Design & Species Schedule", unit: "lump sum", qty: 1, unitPrice: 6000 },
      { category: "Environment", description: "Environmental Impact Assessment", unit: "lump sum", qty: 1, unitPrice: 7000 },
      { category: "Supervision", description: "Construction Supervision", unit: "month", qty: 6, unitPrice: 4500 },
    ],
  },
  transport: {
    introduction: "We are pleased to submit our engineering design services quotation for your transport infrastructure project. Our transport and infrastructure team delivers efficient, safe, and future-ready transport solutions designed to the highest international standards.",
    scopeOfWork: "• Traffic and transport study\n• Transport infrastructure design\n• Road design and geometry\n• Bridge and overpass structural design\n• Traffic signage and road marking design\n• Pedestrian and cycling infrastructure\n• Bus stop and shelter design\n• MEP for transport facilities\n• Environmental impact study\n• Construction supervision",
    exclusions: DEFAULT_EXCLUSIONS,
    items: [
      { category: "Study", description: "Traffic & Transport Study", unit: "lump sum", qty: 1, unitPrice: 15000 },
      { category: "Engineering", description: "Transport Infrastructure Design", unit: "lump sum", qty: 1, unitPrice: 30000 },
      { category: "Engineering", description: "Road Design", unit: "lump sum", qty: 1, unitPrice: 20000 },
      { category: "Engineering", description: "Bridge/Overpass Structural Design", unit: "lump sum", qty: 1, unitPrice: 35000 },
      { category: "Engineering", description: "Traffic Signage & Marking", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Design", description: "Pedestrian & Cycling Infrastructure", unit: "lump sum", qty: 1, unitPrice: 10000 },
      { category: "Design", description: "Bus Stop & Shelter Design", unit: "lump sum", qty: 1, unitPrice: 6000 },
      { category: "Engineering", description: "MEP for Transport Facilities", unit: "lump sum", qty: 1, unitPrice: 12000 },
      { category: "Environment", description: "Environmental Study", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Supervision", description: "Construction Supervision", unit: "month", qty: 10, unitPrice: 6000 },
    ],
  },
  other: {
    introduction: "We are pleased to submit our professional design and consulting services quotation. Our multidisciplinary team is committed to delivering high-quality design solutions tailored to your specific project requirements.",
    scopeOfWork: "• Conceptual design and feasibility\n• Design development\n• Working drawings\n• Structural engineering\n• MEP engineering\n• Project management\n• Construction supervision",
    exclusions: DEFAULT_EXCLUSIONS,
    items: [
      { category: "Design", description: "Conceptual Design", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Design", description: "Design Development", unit: "lump sum", qty: 1, unitPrice: 12000 },
      { category: "Design", description: "Working Drawings", unit: "lump sum", qty: 1, unitPrice: 10000 },
      { category: "Engineering", description: "Structural Engineering", unit: "lump sum", qty: 1, unitPrice: 10000 },
      { category: "Engineering", description: "MEP Engineering", unit: "lump sum", qty: 1, unitPrice: 8000 },
      { category: "Management", description: "Project Management", unit: "lump sum", qty: 1, unitPrice: 6000 },
      { category: "Supervision", description: "Construction Supervision", unit: "month", qty: 6, unitPrice: 3500 },
    ],
  },
};

/* ── Helpers ────────────────────────────────────────────────────── */
function fmtAED(n) {
  var num = parseFloat(n) || 0;
  return "AED " + num.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayStr() {
  var d = new Date();
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var dd = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + dd;
}

function addDays(dateStr, days) {
  if (!dateStr) return "";
  var d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var dd = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + dd;
}

/* ── printQuotation — opens a clean A4 print window ─────────────────── */
function printQuotation(q) {
  var totals = computeItemsLocally(q.items, q.discountPct, q.taxPct);
  var typeLabel = "";
  for (var ti = 0; ti < QUO_PROJ_TYPES.length; ti++) {
    if (QUO_PROJ_TYPES[ti].value === q.projectType) { typeLabel = QUO_PROJ_TYPES[ti].label; break; }
  }
  var statusMeta = QUO_STATUS[q.status || "draft"] || QUO_STATUS.draft;
  var BRAND = "#6F1947";

  function money(n) {
    return "AED " + (parseFloat(n) || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  var itemRows = "";
  var items = q.items || [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var bg = i % 2 === 0 ? "#ffffff" : "#fafafa";
    var rowTotal = (parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0);
    itemRows += "<tr style=\"background:" + bg + ";border-bottom:1px solid #f0f0f0\">"
      + "<td style=\"padding:7px 10px;color:#888;font-size:12px\">" + (i + 1) + "</td>"
      + "<td style=\"padding:7px 10px;font-size:12px\">"
        + (it.category ? "<span style=\"font-size:10px;color:" + BRAND + ";font-weight:700;margin-right:6px\">" + it.category + "</span>" : "")
        + (it.description || "") + "</td>"
      + "<td style=\"padding:7px 10px;color:#666;font-size:12px\">" + (it.unit || "lump sum") + "</td>"
      + "<td style=\"padding:7px 10px;text-align:right;font-size:12px\">" + (it.qty || 0) + "</td>"
      + "<td style=\"padding:7px 10px;text-align:right;font-size:12px\">" + money(it.unitPrice) + "</td>"
      + "<td style=\"padding:7px 10px;text-align:right;font-weight:600;font-size:12px\">" + money(rowTotal) + "</td>"
      + "</tr>";
  }

  var discountRow = totals.discountAmt > 0
    ? "<div style=\"display:flex;justify-content:space-between;padding:5px 10px;font-size:12px\"><span style=\"color:#555\">Discount (" + (q.discountPct || 0) + "%)</span><span style=\"color:#C0263A\">- " + money(totals.discountAmt) + "</span></div>"
    : "";

  var introHtml   = q.introduction ? "<div style=\"margin-bottom:20px\"><div style=\"font-weight:700;font-size:13px;color:" + BRAND + ";margin-bottom:6px;border-bottom:1px solid #eee;padding-bottom:4px\">Introduction</div><p style=\"margin:0;line-height:1.8;color:#333;font-size:13px\">" + q.introduction + "</p></div>" : "";
  var scopeHtml   = q.scopeOfWork  ? "<div style=\"margin-bottom:20px\"><div style=\"font-weight:700;font-size:13px;color:" + BRAND + ";margin-bottom:6px;border-bottom:1px solid #eee;padding-bottom:4px\">Scope of Work</div><div style=\"line-height:1.9;color:#333;font-size:13px;white-space:pre-line\">" + q.scopeOfWork + "</div></div>" : "";
  var exclHtml    = q.exclusions   ? "<div style=\"margin-bottom:20px\"><div style=\"font-weight:700;font-size:13px;color:" + BRAND + ";margin-bottom:6px;border-bottom:1px solid #eee;padding-bottom:4px\">Exclusions</div><div style=\"line-height:1.8;color:#555;font-size:12px\">" + q.exclusions + "</div></div>" : "";
  var payHtml     = q.paymentTerms ? "<div style=\"margin-bottom:20px\"><div style=\"font-weight:700;font-size:13px;color:" + BRAND + ";margin-bottom:6px;border-bottom:1px solid #eee;padding-bottom:4px\">Payment Terms</div><div style=\"line-height:1.8;color:#555;font-size:12px\">" + q.paymentTerms + "</div></div>" : "";
  var notesHtml   = q.notes        ? "<div style=\"margin-bottom:20px\"><div style=\"font-weight:700;font-size:13px;color:" + BRAND + ";margin-bottom:6px;border-bottom:1px solid #eee;padding-bottom:4px\">Notes</div><div style=\"line-height:1.8;color:#555;font-size:12px\">" + q.notes + "</div></div>" : "";

  var clientDetails = "";
  if (q.clientAddress) clientDetails += "<div>" + q.clientAddress + "</div>";
  if (q.clientPhone)   clientDetails += "<div>T: " + q.clientPhone + "</div>";
  if (q.clientEmail)   clientDetails += "<div>E: " + q.clientEmail + "</div>";

  var html = "<!DOCTYPE html><html><head><meta charset=\"utf-8\">"
    + "<title>Quotation " + (q.quotationId || "") + "</title>"
    + "<style>"
    + "@page { size: A4; margin: 18mm 16mm; }"
    + "* { box-sizing: border-box; margin: 0; padding: 0; }"
    + "body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; }"
    + "table { border-collapse: collapse; width: 100%; }"
    + "th { background: " + BRAND + " !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }"
    + ".grand-total-row { background: " + BRAND + " !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }"
    + ".from-box { background: #fdf4f8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }"
    + ".proj-box { background: #f8f5ff !important; border: 1px solid #e8e0f8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }"
    + "@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }"
    + "</style></head><body>"
    + "<div style=\"padding:0\">"

    /* ── Header ── */
    + "<div style=\"display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:18px;border-bottom:3px solid " + BRAND + "\">"
      + "<div>"
        + "<div style=\"display:flex;align-items:center;gap:10px;margin-bottom:6px\">"
          + "<div style=\"width:40px;height:40px;border-radius:10px;background:" + BRAND + ";display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px\">M</div>"
          + "<div><div style=\"font-weight:800;font-size:16px;color:" + BRAND + "\">Meridian Architecture &amp; Development</div>"
          + "<div style=\"font-size:11px;color:#666\">Design · Engineering · Construction</div></div>"
        + "</div>"
        + "<div style=\"font-size:11px;color:#555;line-height:1.7\"><div>Business Bay, Dubai, UAE</div><div>+971 4 000 0000 · info@meridianad.ae</div></div>"
      + "</div>"
      + "<div style=\"text-align:right\">"
        + "<div style=\"font-size:22px;font-weight:800;color:" + BRAND + ";letter-spacing:-0.5px\">QUOTATION</div>"
        + "<div style=\"font-size:14px;font-weight:700;color:#333;margin-top:2px\">" + (q.quotationId || "") + "</div>"
        + "<div style=\"margin-top:8px;display:inline-block;padding:3px 10px;border-radius:20px;background:" + (statusMeta.bg || "#eee") + ";color:" + statusMeta.color + ";font-size:11px;font-weight:600\">" + statusMeta.label + "</div>"
      + "</div>"
    + "</div>"

    /* ── Dates ── */
    + "<div style=\"display:flex;gap:24px;margin-bottom:20px;flex-wrap:wrap\">"
      + "<div><span style=\"font-size:10px;color:#888;font-weight:700;text-transform:uppercase;letter-spacing:0.5px\">Date</span><br><span style=\"font-weight:600\">" + (q.date || "—") + "</span></div>"
      + "<div><span style=\"font-size:10px;color:#888;font-weight:700;text-transform:uppercase;letter-spacing:0.5px\">Valid Until</span><br><span style=\"font-weight:600\">" + (q.validUntil || "—") + "</span></div>"
      + "<div><span style=\"font-size:10px;color:#888;font-weight:700;text-transform:uppercase;letter-spacing:0.5px\">Currency</span><br><span style=\"font-weight:600\">" + (q.currency || "AED") + "</span></div>"
    + "</div>"

    /* ── From / To ── */
    + "<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px\">"
      + "<div class=\"from-box\" style=\"padding:14px 16px;border-radius:8px\">"
        + "<div style=\"font-size:10px;font-weight:700;color:" + BRAND + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:8px\">From</div>"
        + "<div style=\"font-weight:700;font-size:14px\">Meridian Architecture &amp; Development</div>"
        + "<div style=\"font-size:12px;color:#555;margin-top:4px;line-height:1.6\"><div>Business Bay, Dubai, UAE</div><div>TRN: 100000000000003</div></div>"
      + "</div>"
      + "<div style=\"padding:14px 16px;border-radius:8px;background:#fafafa;border:1px solid #eee\">"
        + "<div style=\"font-size:10px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px\">To</div>"
        + "<div style=\"font-weight:700;font-size:14px\">" + (q.clientName || "—") + "</div>"
        + "<div style=\"font-size:12px;color:#555;margin-top:4px;line-height:1.6\">" + clientDetails + "</div>"
      + "</div>"
    + "</div>"

    /* ── Project ── */
    + "<div class=\"proj-box\" style=\"padding:12px 16px;border-radius:8px;margin-bottom:20px\">"
      + "<div style=\"font-size:10px;font-weight:700;color:" + BRAND + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:8px\">Project Details</div>"
      + "<div style=\"display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:12px\">"
        + "<div><span style=\"color:#888;display:block;font-size:10px;margin-bottom:2px\">PROJECT TITLE</span><span style=\"font-weight:600\">" + (q.projectTitle || "—") + "</span></div>"
        + "<div><span style=\"color:#888;display:block;font-size:10px;margin-bottom:2px\">TYPE</span><span style=\"font-weight:600\">" + (typeLabel || q.projectType || "—") + "</span></div>"
        + "<div><span style=\"color:#888;display:block;font-size:10px;margin-bottom:2px\">LOCATION</span><span style=\"font-weight:600\">" + (q.location || "—") + "</span></div>"
      + "</div>"
    + "</div>"

    /* ── Narrative ── */
    + introHtml + scopeHtml

    /* ── Fee Schedule ── */
    + "<div style=\"margin-bottom:20px\">"
      + "<div style=\"font-weight:700;font-size:13px;color:" + BRAND + ";margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:4px\">Fee Schedule</div>"
      + "<table><thead><tr>"
        + "<th style=\"padding:8px 10px;text-align:left;width:30px;font-size:12px\">#</th>"
        + "<th style=\"padding:8px 10px;text-align:left;font-size:12px\">Description</th>"
        + "<th style=\"padding:8px 10px;text-align:left;width:80px;font-size:12px\">Unit</th>"
        + "<th style=\"padding:8px 10px;text-align:right;width:50px;font-size:12px\">Qty</th>"
        + "<th style=\"padding:8px 10px;text-align:right;width:110px;font-size:12px\">Unit Price</th>"
        + "<th style=\"padding:8px 10px;text-align:right;width:110px;font-size:12px\">Total</th>"
      + "</tr></thead><tbody>" + itemRows + "</tbody></table>"
      + "<div style=\"display:flex;justify-content:flex-end;margin-top:12px\">"
        + "<div style=\"width:280px\">"
          + "<div style=\"display:flex;justify-content:space-between;padding:5px 10px;font-size:12px\"><span style=\"color:#555\">Subtotal</span><span style=\"font-weight:500\">" + money(totals.subtotal) + "</span></div>"
          + discountRow
          + "<div style=\"display:flex;justify-content:space-between;padding:5px 10px;font-size:12px\"><span style=\"color:#555\">VAT / Tax (" + (q.taxPct || 5) + "%)</span><span style=\"font-weight:500\">" + money(totals.taxAmt) + "</span></div>"
          + "<div class=\"grand-total-row\" style=\"display:flex;justify-content:space-between;padding:10px;border-radius:6px;margin-top:4px\">"
            + "<span style=\"font-weight:700;font-size:14px\">GRAND TOTAL</span>"
            + "<span style=\"font-weight:800;font-size:15px\">" + money(totals.grandTotal) + "</span>"
          + "</div>"
        + "</div>"
      + "</div>"
    + "</div>"

    /* ── Footer sections ── */
    + exclHtml + payHtml + notesHtml

    /* ── Signature footer ── */
    + "<div style=\"margin-top:32px;padding-top:16px;border-top:2px solid " + BRAND + ";display:flex;justify-content:space-between;align-items:flex-end;font-size:11px;color:#888\">"
      + "<div><div style=\"font-weight:600;color:#555\">Authorised Signature</div>"
        + "<div style=\"margin-top:32px;border-top:1px solid #999;padding-top:4px;width:200px\">Meridian Architecture &amp; Development</div></div>"
      + "<div style=\"text-align:right\">"
        + "<div>This quotation is valid for " + (q.validityDays || 30) + " days from the date of issue.</div>"
        + "<div style=\"margin-top:2px\">Prices are in " + (q.currency || "AED") + " and exclusive of VAT unless stated.</div>"
      + "</div>"
    + "</div>"

    + "</div></body></html>";

  var pw = window.open("", "_blank", "width=900,height=700,scrollbars=yes");
  if (!pw) { alert("Please allow popups to print the quotation."); return; }
  pw.document.open();
  pw.document.write(html);
  pw.document.close();
  pw.focus();
  setTimeout(function() { pw.print(); }, 600);
}

function computeItemsLocally(items, discountPct, taxPct) {
  var computed = (items || []).map(function(it) {
    return Object.assign({}, it, { total: (parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0) });
  });
  var subtotal    = computed.reduce(function(s, it) { return s + (it.total || 0); }, 0);
  var discountAmt = subtotal * ((parseFloat(discountPct) || 0) / 100);
  var taxAmt      = (subtotal - discountAmt) * ((parseFloat(taxPct) || 5) / 100);
  var grandTotal  = subtotal - discountAmt + taxAmt;
  return { items: computed, subtotal: subtotal, discountAmt: discountAmt, taxAmt: taxAmt, grandTotal: grandTotal };
}

/* ── LineItemsEditor ─────────────────────────────────────────────── */
function LineItemsEditor(props) {
  var items    = props.items || [];
  var onChange = props.onChange;

  function updateItem(idx, field, value) {
    var next = items.map(function(it, i) {
      if (i !== idx) return it;
      var updated = Object.assign({}, it);
      updated[field] = value;
      if (field === "qty" || field === "unitPrice") {
        updated.total = (parseFloat(field === "qty" ? value : updated.qty) || 0) *
                        (parseFloat(field === "unitPrice" ? value : updated.unitPrice) || 0);
      }
      return updated;
    });
    onChange(next);
  }

  function addItem() {
    onChange(items.concat([{ category: "", description: "", unit: "lump sum", qty: 1, unitPrice: 0, total: 0 }]));
  }

  function removeItem(idx) {
    onChange(items.filter(function(_, i) { return i !== idx; }));
  }

  var subtotal = items.reduce(function(s, it) { return s + ((parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0)); }, 0);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "var(--plum-50)", borderBottom: "1px solid var(--border-subtle)" }}>
            <th style={{ padding: "7px 8px", textAlign: "left", fontWeight: 600, color: "var(--fg-2)", width: 32 }}>#</th>
            <th style={{ padding: "7px 8px", textAlign: "left", fontWeight: 600, color: "var(--fg-2)", width: 100 }}>Category</th>
            <th style={{ padding: "7px 8px", textAlign: "left", fontWeight: 600, color: "var(--fg-2)" }}>Description</th>
            <th style={{ padding: "7px 8px", textAlign: "left", fontWeight: 600, color: "var(--fg-2)", width: 110 }}>Unit</th>
            <th style={{ padding: "7px 8px", textAlign: "right", fontWeight: 600, color: "var(--fg-2)", width: 70 }}>Qty</th>
            <th style={{ padding: "7px 8px", textAlign: "right", fontWeight: 600, color: "var(--fg-2)", width: 110 }}>Unit Price</th>
            <th style={{ padding: "7px 8px", textAlign: "right", fontWeight: 600, color: "var(--fg-2)", width: 110 }}>Total</th>
            <th style={{ padding: "7px 8px", width: 32 }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map(function(it, idx) {
            return (
              <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "5px 8px", color: "var(--fg-3)", fontSize: 12 }}>{idx + 1}</td>
                <td style={{ padding: "4px 6px" }}>
                  <input
                    className="form-input"
                    style={{ fontSize: 12, padding: "4px 6px", width: "100%" }}
                    value={it.category || ""}
                    placeholder="Category"
                    onChange={function(e) { updateItem(idx, "category", e.target.value); }}
                  />
                </td>
                <td style={{ padding: "4px 6px" }}>
                  <input
                    className="form-input"
                    style={{ fontSize: 12, padding: "4px 6px", width: "100%" }}
                    value={it.description || ""}
                    placeholder="Description"
                    onChange={function(e) { updateItem(idx, "description", e.target.value); }}
                  />
                </td>
                <td style={{ padding: "4px 6px" }}>
                  <select
                    className="form-input"
                    style={{ fontSize: 12, padding: "4px 6px", width: "100%" }}
                    value={it.unit || "lump sum"}
                    onChange={function(e) { updateItem(idx, "unit", e.target.value); }}
                  >
                    {UNIT_OPTIONS.map(function(u) { return <option key={u} value={u}>{u}</option>; })}
                  </select>
                </td>
                <td style={{ padding: "4px 6px" }}>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    style={{ fontSize: 12, padding: "4px 6px", width: "100%", textAlign: "right" }}
                    value={it.qty || 0}
                    onChange={function(e) { updateItem(idx, "qty", e.target.value); }}
                  />
                </td>
                <td style={{ padding: "4px 6px" }}>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    style={{ fontSize: 12, padding: "4px 6px", width: "100%", textAlign: "right" }}
                    value={it.unitPrice || 0}
                    onChange={function(e) { updateItem(idx, "unitPrice", e.target.value); }}
                  />
                </td>
                <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--fg-1)", fontWeight: 500, fontSize: 13 }}>
                  {fmtAED((parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0))}
                </td>
                <td style={{ padding: "5px 6px", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={function() { removeItem(idx); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-3)", padding: "2px 4px", borderRadius: 4 }}
                    title="Remove item"
                  >
                    <Icon name="trash-2" size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={8} style={{ padding: "8px 6px" }}>
              <button
                type="button"
                className="btn"
                onClick={addItem}
                style={{ fontSize: 12, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}
              >
                <Icon name="plus" size={13} />
                Add Item
              </button>
            </td>
          </tr>
          <tr style={{ borderTop: "2px solid var(--border-subtle)", background: "var(--plum-50)" }}>
            <td colSpan={6} style={{ padding: "7px 8px", textAlign: "right", fontWeight: 600, fontSize: 13 }}>Subtotal:</td>
            <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 700, fontSize: 13, color: "var(--brand-burgundy)" }}>{fmtAED(subtotal)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ── QuotationFormModal ──────────────────────────────────────────── */
function QuotationFormModal(props) {
  var initial   = props.initial || {};
  var onClose   = props.onClose;
  var onSave    = props.onSave;
  var projects  = props.projects || [];

  var todayISO = todayStr();

  var stateTab         = useStateQ(0);             var tab = stateTab[0]; var setTab = stateTab[1];
  var stateDate        = useStateQ(initial.date || todayISO);
  var date = stateDate[0]; var setDate = stateDate[1];
  var stateValidUntil  = useStateQ(initial.validUntil || addDays(todayISO, 30));
  var validUntil = stateValidUntil[0]; var setValidUntil = stateValidUntil[1];
  var stateProjectId   = useStateQ(initial.projectId || "");
  var projectId = stateProjectId[0]; var setProjectId = stateProjectId[1];
  var stateProjectName = useStateQ(initial.projectName || "");
  var projectName = stateProjectName[0]; var setProjectName = stateProjectName[1];
  var stateProjectType = useStateQ(initial.projectType || "other");
  var projectType = stateProjectType[0]; var setProjectType = stateProjectType[1];
  var stateClientName  = useStateQ(initial.clientName || "");
  var clientName = stateClientName[0]; var setClientName = stateClientName[1];
  var stateClientPhone = useStateQ(initial.clientPhone || "");
  var clientPhone = stateClientPhone[0]; var setClientPhone = stateClientPhone[1];
  var stateClientEmail = useStateQ(initial.clientEmail || "");
  var clientEmail = stateClientEmail[0]; var setClientEmail = stateClientEmail[1];
  var stateClientAddr  = useStateQ(initial.clientAddress || "");
  var clientAddress = stateClientAddr[0]; var setClientAddress = stateClientAddr[1];
  var stateProjTitle   = useStateQ(initial.projectTitle || "");
  var projectTitle = stateProjTitle[0]; var setProjectTitle = stateProjTitle[1];
  var stateLocation    = useStateQ(initial.location || "");
  var location = stateLocation[0]; var setLocation = stateLocation[1];
  var statePayTerms    = useStateQ(initial.paymentTerms || "30% advance, 40% at 50% completion, 30% on delivery");
  var paymentTerms = statePayTerms[0]; var setPaymentTerms = statePayTerms[1];
  var stateIntro       = useStateQ(initial.introduction || "");
  var introduction = stateIntro[0]; var setIntroduction = stateIntro[1];
  var stateScope       = useStateQ(initial.scopeOfWork || "");
  var scopeOfWork = stateScope[0]; var setScopeOfWork = stateScope[1];
  var stateItems       = useStateQ(initial.items || []);
  var items = stateItems[0]; var setItems = stateItems[1];
  var stateExclusions  = useStateQ(initial.exclusions || "");
  var exclusions = stateExclusions[0]; var setExclusions = stateExclusions[1];
  var stateDiscPct     = useStateQ(initial.discountPct || 0);
  var discountPct = stateDiscPct[0]; var setDiscountPct = stateDiscPct[1];
  var stateTaxPct      = useStateQ(initial.taxPct || 5);
  var taxPct = stateTaxPct[0]; var setTaxPct = stateTaxPct[1];
  var stateNotes       = useStateQ(initial.notes || "");
  var notes = stateNotes[0]; var setNotes = stateNotes[1];

  var templateApplied = useRefQ(false);

  function applyTemplate(type, force) {
    var tpl = QUOTATION_TEMPLATES[type] || QUOTATION_TEMPLATES["other"];
    if (!tpl) return;
    if (!force && items.length > 0) {
      var ok = window.confirm("Apply template for " + type + "? This will replace current items and text.");
      if (!ok) return;
    }
    setIntroduction(tpl.introduction || "");
    setScopeOfWork(tpl.scopeOfWork || "");
    setExclusions(tpl.exclusions || "");
    setItems((tpl.items || []).map(function(it) {
      return Object.assign({}, it, { total: (it.qty || 0) * (it.unitPrice || 0) });
    }));
  }

  function handleProjectTypeChange(newType) {
    setProjectType(newType);
    applyTemplate(newType, items.length === 0);
  }

  function handleProjectSelect(e) {
    var pid = e.target.value;
    setProjectId(pid);
    if (!pid) { setProjectName(""); return; }
    var proj = null;
    for (var i = 0; i < projects.length; i++) {
      if (projects[i].projectId === pid) { proj = projects[i]; break; }
    }
    if (!proj) return;
    setProjectName(proj.title || "");
    if (proj.type) setProjectType(proj.type);
    if (proj.partyName) setClientName(proj.partyName);
    if (proj.location) setLocation(proj.location);
    if (proj.title) setProjectTitle(proj.title);
    if (proj.type) applyTemplate(proj.type, items.length === 0);
  }

  var totals = useMemoQ(function() {
    return computeItemsLocally(items, discountPct, taxPct);
  }, [items, discountPct, taxPct]);

  function handleSave() {
    var formData = {
      projectId:     projectId,
      projectName:   projectName,
      projectType:   projectType,
      date:          date,
      validUntil:    validUntil,
      clientName:    clientName,
      clientPhone:   clientPhone,
      clientEmail:   clientEmail,
      clientAddress: clientAddress,
      projectTitle:  projectTitle,
      location:      location,
      paymentTerms:  paymentTerms,
      introduction:  introduction,
      scopeOfWork:   scopeOfWork,
      exclusions:    exclusions,
      items:         items,
      discountPct:   parseFloat(discountPct) || 0,
      taxPct:        parseFloat(taxPct) || 5,
      notes:         notes,
    };
    if (initial.quotationId) formData.quotationId = initial.quotationId;
    if (initial.status) formData.status = initial.status;
    onSave(formData);
  }

  var isEdit = !!(initial.quotationId);

  return (
    <div className="modal-overlay" onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 740, width: "100%", maxHeight: "92vh", display: "flex", flexDirection: "column" }}>
        <div className="modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--plum-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="file-text" size={16} color="var(--brand-burgundy)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{isEdit ? "Edit Quotation" : "New Quotation"}</div>
              {isEdit && <div style={{ fontSize: 11, color: "var(--fg-3)" }}>{initial.quotationId}</div>}
            </div>
          </div>
          <button className="btn" onClick={onClose} style={{ padding: "4px 8px" }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border-subtle)", padding: "0 20px" }}>
          {["Project & Client", "Scope & Items"].map(function(label, i) {
            return (
              <button
                key={i}
                type="button"
                onClick={function() { setTab(i); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "10px 16px", fontSize: 13, fontWeight: tab === i ? 600 : 400,
                  color: tab === i ? "var(--brand-burgundy)" : "var(--fg-3)",
                  borderBottom: tab === i ? "2px solid var(--brand-burgundy)" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: "auto" }}>
          {tab === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-row">
                <div>
                  <label className="form-label">Quotation Date</label>
                  <input className="form-input" type="date" value={date} onChange={function(e) { setDate(e.target.value); }} />
                </div>
                <div>
                  <label className="form-label">Valid Until</label>
                  <input className="form-input" type="date" value={validUntil} onChange={function(e) { setValidUntil(e.target.value); }} />
                </div>
              </div>

              <div>
                <label className="form-label">Project</label>
                <select className="form-input" value={projectId} onChange={handleProjectSelect}>
                  <option value="">-- Select Project --</option>
                  {projects.map(function(p) {
                    return <option key={p.projectId} value={p.projectId}>{p.title || p.projectId}</option>;
                  })}
                </select>
              </div>

              <div className="form-row">
                <div>
                  <label className="form-label">Project Type</label>
                  <select className="form-input" value={projectType} onChange={function(e) { handleProjectTypeChange(e.target.value); }}>
                    {QUO_PROJ_TYPES.map(function(pt) {
                      return <option key={pt.value} value={pt.value}>{pt.label}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="form-label">Project Title</label>
                  <input className="form-input" value={projectTitle} placeholder="e.g. Al Barsha Villa" onChange={function(e) { setProjectTitle(e.target.value); }} />
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label className="form-label">Client Name</label>
                  <input className="form-input" value={clientName} placeholder="Client / Company name" onChange={function(e) { setClientName(e.target.value); }} />
                </div>
                <div>
                  <label className="form-label">Client Phone</label>
                  <input className="form-input" value={clientPhone} placeholder="+971 50 000 0000" onChange={function(e) { setClientPhone(e.target.value); }} />
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label className="form-label">Client Email</label>
                  <input className="form-input" type="email" value={clientEmail} placeholder="client@email.com" onChange={function(e) { setClientEmail(e.target.value); }} />
                </div>
                <div>
                  <label className="form-label">Location</label>
                  <input className="form-input" value={location} placeholder="Project location" onChange={function(e) { setLocation(e.target.value); }} />
                </div>
              </div>

              <div>
                <label className="form-label">Client Address</label>
                <textarea className="form-input" rows={2} value={clientAddress} placeholder="Full address" onChange={function(e) { setClientAddress(e.target.value); }} style={{ resize: "vertical" }} />
              </div>

              <div>
                <label className="form-label">Payment Terms</label>
                <textarea className="form-input" rows={2} value={paymentTerms} onChange={function(e) { setPaymentTerms(e.target.value); }} style={{ resize: "vertical" }} />
              </div>
            </div>
          )}

          {tab === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn"
                  onClick={function() { applyTemplate(projectType, false); }}
                  style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, color: "var(--brand-burgundy)", borderColor: "var(--brand-burgundy)" }}
                >
                  <Icon name="wand-2" size={13} />
                  Auto-fill from Template
                </button>
              </div>

              <div>
                <label className="form-label">Introduction</label>
                <textarea className="form-input" rows={3} value={introduction} placeholder="Professional introduction paragraph..." onChange={function(e) { setIntroduction(e.target.value); }} style={{ resize: "vertical" }} />
              </div>

              <div>
                <label className="form-label">Scope of Work</label>
                <textarea className="form-input" rows={5} value={scopeOfWork} placeholder="Detailed scope of services..." onChange={function(e) { setScopeOfWork(e.target.value); }} style={{ resize: "vertical" }} />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: 6 }}>Line Items</label>
                <LineItemsEditor items={items} onChange={setItems} />
              </div>

              <div>
                <label className="form-label">Exclusions</label>
                <textarea className="form-input" rows={2} value={exclusions} placeholder="Items not included in this quotation..." onChange={function(e) { setExclusions(e.target.value); }} style={{ resize: "vertical" }} />
              </div>

              <div className="form-row">
                <div>
                  <label className="form-label">Discount %</label>
                  <input className="form-input" type="number" min="0" max="100" step="0.5" value={discountPct} onChange={function(e) { setDiscountPct(e.target.value); }} />
                </div>
                <div>
                  <label className="form-label">Tax % (VAT)</label>
                  <input className="form-input" type="number" min="0" max="100" step="0.5" value={taxPct} onChange={function(e) { setTaxPct(e.target.value); }} />
                </div>
              </div>

              {/* Live totals */}
              <div style={{ background: "var(--plum-50)", borderRadius: 8, padding: "12px 16px", fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "var(--fg-2)" }}>Subtotal</span>
                  <span style={{ fontWeight: 500 }}>{fmtAED(totals.subtotal)}</span>
                </div>
                {totals.discountAmt > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "var(--fg-2)" }}>Discount ({discountPct}%)</span>
                    <span style={{ color: "#C0263A" }}>- {fmtAED(totals.discountAmt)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "var(--fg-2)" }}>Tax / VAT ({taxPct}%)</span>
                  <span style={{ fontWeight: 500 }}>{fmtAED(totals.taxAmt)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Grand Total</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "var(--brand-burgundy)" }}>{fmtAED(totals.grandTotal)}</span>
                </div>
              </div>

              <div>
                <label className="form-label">Internal Notes</label>
                <textarea className="form-input" rows={2} value={notes} placeholder="Internal notes (not shown to client)" onChange={function(e) { setNotes(e.target.value); }} style={{ resize: "vertical" }} />
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {tab === 1 && (
              <button className="btn" type="button" onClick={function() { setTab(0); }}>
                <Icon name="arrow-left" size={14} /> Back
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" type="button" onClick={onClose}>Cancel</button>
            {tab === 0 ? (
              <button className="btn btn-primary" type="button" onClick={function() { setTab(1); }}>
                Next: Scope & Items <Icon name="arrow-right" size={14} />
              </button>
            ) : (
              <button className="btn btn-primary" type="button" onClick={handleSave}>
                <Icon name="save" size={14} /> {isEdit ? "Save Changes" : "Create Quotation"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── QuotationPreview ────────────────────────────────────────────── */
function QuotationPreview(props) {
  var q       = props.quotation || {};
  var onClose = props.onClose;
  var onPrint = props.onPrint;

  var statusMeta = QUO_STATUS[q.status || "draft"] || QUO_STATUS.draft;
  var typeLabel  = "";
  for (var ti = 0; ti < QUO_PROJ_TYPES.length; ti++) {
    if (QUO_PROJ_TYPES[ti].value === q.projectType) { typeLabel = QUO_PROJ_TYPES[ti].label; break; }
  }

  var totals = computeItemsLocally(q.items, q.discountPct, q.taxPct);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff", borderLeft: "1px solid var(--border-subtle)" }}>
      {/* Preview toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--fg-1)" }}>Preview — {q.quotationId || ""}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn" type="button" onClick={onPrint} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="printer" size={13} /> Print
          </button>
          {onClose && (
            <button className="btn" type="button" onClick={onClose} style={{ fontSize: 12, padding: "4px 8px" }}>
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>

      <div id="quo-print-area" style={{ flex: 1, overflowY: "auto", padding: "24px 28px", fontSize: 13, fontFamily: "var(--font-sans)", color: "#1a1a1a", background: "#fff" }}>
        {/* Company header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 20, borderBottom: "3px solid var(--brand-burgundy)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--brand-burgundy)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18 }}>M</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "var(--brand-burgundy)" }}>Meridian Architecture & Development</div>
                <div style={{ fontSize: 11, color: "#666" }}>Design · Engineering · Construction</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#555", lineHeight: 1.7 }}>
              <div>Business Bay, Dubai, UAE</div>
              <div>+971 4 000 0000 · info@meridianad.ae · www.meridianad.ae</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--brand-burgundy)", letterSpacing: -0.5 }}>QUOTATION</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#333", marginTop: 2 }}>{q.quotationId || ""}</div>
            <div style={{ marginTop: 8 }}>
              <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, background: statusMeta.bg, color: statusMeta.color, fontSize: 11, fontWeight: 600 }}>
                {statusMeta.label}
              </span>
            </div>
          </div>
        </div>

        {/* Dates row */}
        <div style={{ display: "flex", gap: 24, marginBottom: 20, flexWrap: "wrap" }}>
          <div><span style={{ fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Date</span><br /><span style={{ fontWeight: 600 }}>{q.date || "—"}</span></div>
          <div><span style={{ fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Valid Until</span><br /><span style={{ fontWeight: 600 }}>{q.validUntil || "—"}</span></div>
          <div><span style={{ fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Currency</span><br /><span style={{ fontWeight: 600 }}>{q.currency || "AED"}</span></div>
        </div>

        {/* From / To */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div style={{ padding: "14px 16px", background: "var(--plum-50)", borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--brand-burgundy)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>From</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Meridian Architecture & Development</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 4, lineHeight: 1.6 }}>
              <div>Business Bay, Dubai, UAE</div>
              <div>TRN: 100000000000003</div>
            </div>
          </div>
          <div style={{ padding: "14px 16px", background: "#FAFAFA", border: "1px solid #eee", borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>To</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{q.clientName || "—"}</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 4, lineHeight: 1.6 }}>
              {q.clientAddress && <div>{q.clientAddress}</div>}
              {q.clientPhone && <div>T: {q.clientPhone}</div>}
              {q.clientEmail && <div>E: {q.clientEmail}</div>}
            </div>
          </div>
        </div>

        {/* Project details */}
        <div style={{ padding: "12px 16px", background: "#F8F5FF", border: "1px solid #E8E0F8", borderRadius: 8, marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--brand-burgundy)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Project Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 12 }}>
            <div><span style={{ color: "#888", display: "block", fontSize: 10, marginBottom: 2 }}>PROJECT TITLE</span><span style={{ fontWeight: 600 }}>{q.projectTitle || "—"}</span></div>
            <div><span style={{ color: "#888", display: "block", fontSize: 10, marginBottom: 2 }}>TYPE</span><span style={{ fontWeight: 600 }}>{typeLabel || q.projectType || "—"}</span></div>
            <div><span style={{ color: "#888", display: "block", fontSize: 10, marginBottom: 2 }}>LOCATION</span><span style={{ fontWeight: 600 }}>{q.location || "—"}</span></div>
          </div>
        </div>

        {/* Introduction */}
        {q.introduction && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brand-burgundy)", marginBottom: 6, borderBottom: "1px solid #eee", paddingBottom: 4 }}>Introduction</div>
            <p style={{ margin: 0, lineHeight: 1.7, color: "#333", fontSize: 13 }}>{q.introduction}</p>
          </div>
        )}

        {/* Scope of Work */}
        {q.scopeOfWork && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brand-burgundy)", marginBottom: 6, borderBottom: "1px solid #eee", paddingBottom: 4 }}>Scope of Work</div>
            <div style={{ lineHeight: 1.8, color: "#333", fontSize: 13, whiteSpace: "pre-line" }}>{q.scopeOfWork}</div>
          </div>
        )}

        {/* Line Items Table */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brand-burgundy)", marginBottom: 8, borderBottom: "1px solid #eee", paddingBottom: 4 }}>Fee Schedule</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "var(--brand-burgundy)", color: "#fff" }}>
                <th style={{ padding: "8px 10px", textAlign: "left", width: 30 }}>#</th>
                <th style={{ padding: "8px 10px", textAlign: "left" }}>Description</th>
                <th style={{ padding: "8px 10px", textAlign: "left", width: 80 }}>Unit</th>
                <th style={{ padding: "8px 10px", textAlign: "right", width: 50 }}>Qty</th>
                <th style={{ padding: "8px 10px", textAlign: "right", width: 110 }}>Unit Price</th>
                <th style={{ padding: "8px 10px", textAlign: "right", width: 110 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(q.items || []).map(function(it, idx) {
                return (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "7px 10px", color: "#888" }}>{idx + 1}</td>
                    <td style={{ padding: "7px 10px" }}>
                      {it.category && <span style={{ fontSize: 10, color: "var(--brand-burgundy)", fontWeight: 600, marginRight: 6 }}>{it.category}</span>}
                      {it.description}
                    </td>
                    <td style={{ padding: "7px 10px", color: "#666" }}>{it.unit || "lump sum"}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right" }}>{it.qty || 0}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right" }}>{fmtAED(it.unitPrice || 0)}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 600 }}>{fmtAED((parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <div style={{ width: 280 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", fontSize: 12 }}>
                <span style={{ color: "#555" }}>Subtotal</span>
                <span style={{ fontWeight: 500 }}>{fmtAED(totals.subtotal)}</span>
              </div>
              {totals.discountAmt > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", fontSize: 12 }}>
                  <span style={{ color: "#555" }}>Discount ({q.discountPct || 0}%)</span>
                  <span style={{ color: "#C0263A" }}>- {fmtAED(totals.discountAmt)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", fontSize: 12 }}>
                <span style={{ color: "#555" }}>VAT / Tax ({q.taxPct || 5}%)</span>
                <span style={{ fontWeight: 500 }}>{fmtAED(totals.taxAmt)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "var(--brand-burgundy)", color: "#fff", borderRadius: 6, marginTop: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>GRAND TOTAL</span>
                <span style={{ fontWeight: 800, fontSize: 15 }}>{fmtAED(totals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Exclusions */}
        {q.exclusions && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brand-burgundy)", marginBottom: 6, borderBottom: "1px solid #eee", paddingBottom: 4 }}>Exclusions</div>
            <div style={{ lineHeight: 1.8, color: "#555", fontSize: 12 }}>{q.exclusions}</div>
          </div>
        )}

        {/* Payment Terms */}
        {q.paymentTerms && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brand-burgundy)", marginBottom: 6, borderBottom: "1px solid #eee", paddingBottom: 4 }}>Payment Terms</div>
            <div style={{ lineHeight: 1.8, color: "#555", fontSize: 12 }}>{q.paymentTerms}</div>
          </div>
        )}

        {/* Notes */}
        {q.notes && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brand-burgundy)", marginBottom: 6, borderBottom: "1px solid #eee", paddingBottom: 4 }}>Notes</div>
            <div style={{ lineHeight: 1.8, color: "#555", fontSize: 12 }}>{q.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: "2px solid var(--brand-burgundy)", display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 11, color: "#888" }}>
          <div>
            <div style={{ fontWeight: 600, color: "#555" }}>Authorised Signature</div>
            <div style={{ marginTop: 32, borderTop: "1px solid #999", paddingTop: 4, width: 200 }}>Meridian Architecture & Development</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div>This quotation is valid for {q.validityDays || 30} days from the date of issue.</div>
            <div style={{ marginTop: 2 }}>Prices are in {q.currency || "AED"} and exclusive of VAT unless stated.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Status Badge ────────────────────────────────────────────────── */
function StatusBadge(props) {
  var status = props.status || "draft";
  var meta   = QUO_STATUS[status] || QUO_STATUS.draft;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      <Icon name={meta.icon} size={11} />
      {meta.label}
    </span>
  );
}

/* ── KPI Card ────────────────────────────────────────────────────── */
function KpiCard(props) {
  var label    = props.label;
  var value    = props.value;
  var sub      = props.sub;
  var color    = props.color || "var(--brand-burgundy)";
  var iconName = props.icon || "file-text";
  return (
    <div className="card" style={{ padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={iconName} size={18} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--fg-1)", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: color, fontWeight: 600, marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ── Loading Skeleton ────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      {[1,2,3,4,5,6,7].map(function(i) {
        return (
          <td key={i} style={{ padding: "12px 14px" }}>
            <div style={{ height: 14, borderRadius: 4, background: "var(--ink-50)", animation: "pulse 1.5s ease-in-out infinite", width: i === 1 ? "60%" : i === 7 ? "40%" : "80%" }} />
          </td>
        );
      })}
    </tr>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */
function QuotationPage(props) {
  var API = window.API || "http://localhost:5000/api";

  var stateQuotations   = useStateQ([]);   var quotations = stateQuotations[0];   var setQuotations = stateQuotations[1];
  var stateProjects     = useStateQ([]);   var projects = stateProjects[0];       var setProjects = stateProjects[1];
  var stateLoading      = useStateQ(true); var loading = stateLoading[0];         var setLoading = stateLoading[1];
  var stateSelected     = useStateQ(null); var selected = stateSelected[0];       var setSelected = stateSelected[1];
  var stateShowForm     = useStateQ(false);var showForm = stateShowForm[0];       var setShowForm = stateShowForm[1];
  var stateEditQuo      = useStateQ(null); var editQuo = stateEditQuo[0];         var setEditQuo = stateEditQuo[1];
  var stateSearch       = useStateQ("");   var search = stateSearch[0];           var setSearch = stateSearch[1];
  var stateStatusFilter = useStateQ("all");var statusFilter = stateStatusFilter[0]; var setStatusFilter = stateStatusFilter[1];

  useEffectQ(function() {
    fetchQuotations();
    fetch(API + "/projects")
      .then(function(r) { return r.json(); })
      .then(function(data) { setProjects(Array.isArray(data) ? data : []); })
      .catch(function() {});
  }, []);

  function fetchQuotations() {
    setLoading(true);
    fetch(API + "/quotations")
      .then(function(r) { return r.json(); })
      .then(function(data) {
        setQuotations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(function() { setLoading(false); });
  }

  var filtered = useMemoQ(function() {
    var q = quotations.filter(function(q) {
      if (statusFilter !== "all" && q.status !== statusFilter) return false;
      if (search) {
        var s = search.toLowerCase();
        var haystack = [q.quotationId || "", q.projectTitle || "", q.clientName || "", q.projectName || ""].join(" ").toLowerCase();
        if (haystack.indexOf(s) === -1) return false;
      }
      return true;
    });
    return q;
  }, [quotations, statusFilter, search]);

  /* KPIs */
  var totalCount    = quotations.length;
  var pendingCount  = quotations.filter(function(q) { return q.status === "sent"; }).length;
  var approvedList  = quotations.filter(function(q) { return q.status === "approved"; });
  var approvedTotal = approvedList.reduce(function(s, q) { return s + (q.grandTotal || 0); }, 0);
  var draftCount    = quotations.filter(function(q) { return q.status === "draft"; }).length;

  function handleSave(formData) {
    var isEdit = !!(editQuo);
    var url    = isEdit ? API + "/quotations/" + (editQuo.quotationId || "") : API + "/quotations";
    var method = isEdit ? "PATCH" : "POST";

    fetch(url, {
      method:  method,
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(formData),
    })
      .then(function(r) { return r.json(); })
      .then(function(saved) {
        if (saved.error) { alert("Error: " + saved.error); return; }
        if (isEdit) {
          setQuotations(quotations.map(function(q) { return q.quotationId === saved.quotationId ? saved : q; }));
          if (selected && selected.quotationId === saved.quotationId) setSelected(saved);
        } else {
          setQuotations([saved].concat(quotations));
          setSelected(saved);
        }
        setShowForm(false);
        setEditQuo(null);
      })
      .catch(function(err) { alert("Save failed: " + err.message); });
  }

  function handleDelete(quotationId) {
    if (!window.confirm("Delete quotation " + quotationId + "? This cannot be undone.")) return;
    fetch(API + "/quotations/" + quotationId, { method: "DELETE" })
      .then(function() {
        setQuotations(quotations.filter(function(q) { return q.quotationId !== quotationId; }));
        if (selected && selected.quotationId === quotationId) setSelected(null);
      })
      .catch(function(err) { alert("Delete failed: " + err.message); });
  }

  function handleStatusChange(quotationId, newStatus) {
    fetch(API + "/quotations/" + quotationId, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: newStatus }),
    })
      .then(function(r) { return r.json(); })
      .then(function(saved) {
        if (saved.error) { alert("Error: " + saved.error); return; }
        setQuotations(quotations.map(function(q) { return q.quotationId === saved.quotationId ? saved : q; }));
        if (selected && selected.quotationId === saved.quotationId) setSelected(saved);
      })
      .catch(function(err) { alert("Status update failed: " + err.message); });
  }

  function handlePrint() {
    if (selected) printQuotation(selected);
  }

  function handleConvert(quotationId) {
    var q = quotations.filter(function(x) { return x.quotationId === quotationId; })[0];
    if (q && q.invoiceId) { alert("Already invoiced as " + q.invoiceId); return; }
    if (!window.confirm("Convert this quotation to an invoice?")) return;
    fetch(API + "/invoices/from-quotation/" + quotationId, { method: "POST" })
      .then(function(r) { return r.json(); })
      .then(function(inv) {
        if (inv.error) { alert("Convert failed: " + inv.error); return; }
        setQuotations(quotations.map(function(x) {
          return x.quotationId === quotationId ? Object.assign({}, x, { invoiceId: inv.invoiceId }) : x;
        }));
        if (selected && selected.quotationId === quotationId) {
          setSelected(Object.assign({}, selected, { invoiceId: inv.invoiceId }));
        }
        if (props.onNav && window.confirm("Invoice " + inv.invoiceId + " created. Open Invoices now?")) {
          props.onNav("invoices");
        }
      })
      .catch(function(err) { alert("Convert failed: " + err.message); });
  }

  function openNew() {
    setEditQuo(null);
    setShowForm(true);
  }

  function openEdit(q) {
    setEditQuo(q);
    setShowForm(true);
  }

  var statusPills = [
    { value: "all",      label: "All" },
    { value: "draft",    label: "Draft" },
    { value: "sent",     label: "Sent" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "expired",  label: "Expired" },
  ];

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Page header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Projects</div>
          <h1 className="page-title">Quotations</h1>
          <p className="page-sub">Manage client quotations and proposals</p>
        </div>
        <Button variant="primary" icon="plus" onClick={openNew}>New Quotation</Button>
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: 18 }}>
        <KpiCard label="Total Quotations" value={totalCount} icon="file-text" color="#3B3E8F" />
        <KpiCard label="Pending (Sent)" value={pendingCount} icon="send" color="#D78A14" />
        <KpiCard label="Approved" value={approvedList.length} sub={approvedTotal > 0 ? fmtAED(approvedTotal) : undefined} icon="check-circle-2" color="#1F8A52" />
        <KpiCard label="Draft" value={draftCount} icon="file-text" color="#A89DA3" />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 300 }}>
          <Icon name="search" size={14} color="var(--fg-3)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            className="form-input"
            style={{ paddingLeft: 32 }}
            placeholder="Search quotations…"
            value={search}
            onChange={function(e) { setSearch(e.target.value); }}
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {statusPills.map(function(pill) {
            var active = statusFilter === pill.value;
            return (
              <button
                key={pill.value}
                type="button"
                className="pill-btn"
                onClick={function() { setStatusFilter(pill.value); }}
                style={{ fontWeight: active ? 700 : 400, background: active ? "var(--brand-burgundy)" : "var(--bg-surface)", color: active ? "#fff" : "var(--fg-2)", border: "1px solid " + (active ? "var(--brand-burgundy)" : "var(--border-subtle)") }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main area: table + preview */}
      <div style={{ flex: 1, display: "flex", gap: 16, minHeight: 0, overflow: "hidden" }}>
        {/* Table */}
        <div className="card" style={{ flex: selected ? "0 0 56%" : 1, minWidth: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {loading ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[1,2,3,4,5].map(function(i) { return <SkeletonRow key={i} />; })}
              </tbody>
            </table>
          ) : filtered.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: 40, textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--plum-50)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <Icon name="file-text" size={26} color="var(--brand-burgundy)" stroke={1.5} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>No quotations found</div>
              <div style={{ fontSize: 13, color: "var(--fg-3)", marginBottom: 16, maxWidth: 320 }}>
                {search || statusFilter !== "all" ? "Try adjusting your filters." : "Create your first quotation to get started."}
              </div>
              {statusFilter === "all" && !search && (
                <Button variant="primary" icon="plus" onClick={openNew}>New Quotation</Button>
              )}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--plum-50)" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "var(--fg-2)", fontSize: 12 }}>#</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "var(--fg-2)", fontSize: 12 }}>Project / Client</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "var(--fg-2)", fontSize: 12 }}>Type</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "var(--fg-2)", fontSize: 12 }}>Date</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "var(--fg-2)", fontSize: 12 }}>Valid Until</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "var(--fg-2)", fontSize: 12 }}>Grand Total</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "var(--fg-2)", fontSize: 12 }}>Status</th>
                  <th style={{ padding: "10px 14px", fontWeight: 600, color: "var(--fg-2)", fontSize: 12 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(function(q, idx) {
                  var isActive   = selected && selected.quotationId === q.quotationId;
                  var typeLabel  = "";
                  for (var ti = 0; ti < QUO_PROJ_TYPES.length; ti++) {
                    if (QUO_PROJ_TYPES[ti].value === q.projectType) { typeLabel = QUO_PROJ_TYPES[ti].label; break; }
                  }
                  return (
                    <tr
                      key={q.quotationId || idx}
                      onClick={function(row) { return function() { setSelected(isActive ? null : row); }; }(q)}
                      style={{ borderBottom: "1px solid var(--border-subtle)", cursor: "pointer", background: isActive ? "var(--plum-50)" : "transparent", transition: "background 0.12s" }}
                    >
                      <td style={{ padding: "10px 14px", color: "var(--fg-3)", fontSize: 11 }}>
                        <div style={{ fontWeight: 600, color: "var(--brand-burgundy)", fontSize: 12 }}>{q.quotationId || ""}</div>
                        <div style={{ fontSize: 11, color: "var(--fg-4)" }}>#{idx + 1}</div>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ fontWeight: 600, color: "var(--fg-1)" }}>{q.projectTitle || q.projectName || "—"}</div>
                        <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2 }}>{q.clientName || ""}</div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--fg-2)", fontSize: 12 }}>{typeLabel || q.projectType || "—"}</td>
                      <td style={{ padding: "10px 14px", color: "var(--fg-2)", fontSize: 12 }}>{q.date || "—"}</td>
                      <td style={{ padding: "10px 14px", color: "var(--fg-2)", fontSize: 12 }}>{q.validUntil || "—"}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "var(--fg-1)" }}>{fmtAED(q.grandTotal || 0)}</td>
                      <td style={{ padding: "10px 14px" }}><StatusBadge status={q.status || "draft"} /></td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }} onClick={function(e) { e.stopPropagation(); }}>
                          {/* Free status change — set any status, including back to Draft */}
                          <select
                            value={q.status || "draft"}
                            title="Change status"
                            style={{ fontSize: 11, fontWeight: 600, padding: "3px 6px", borderRadius: 5, cursor: "pointer",
                              border: "1px solid " + (QUO_STATUS[q.status || "draft"].color) + "55",
                              background: QUO_STATUS[q.status || "draft"].bg,
                              color: QUO_STATUS[q.status || "draft"].color }}
                            onChange={function(id) { return function(e) { handleStatusChange(id, e.target.value); }; }(q.quotationId)}
                          >
                            {Object.keys(QUO_STATUS).map(function(s) {
                              return <option key={s} value={s} style={{ color: "var(--fg-1)", background: "var(--bg-1)" }}>{QUO_STATUS[s].label}</option>;
                            })}
                          </select>
                          {/* Convert to invoice (or show the linked invoice) */}
                          {q.invoiceId ? (
                            <button className="pill-btn" type="button" title={"Invoiced as " + q.invoiceId}
                              style={{ fontSize: 11, padding: "3px 8px", background: "#ECFDF5", color: "#1F8A52", border: "1px solid #A7F3D0" }}
                              onClick={function() { if (props.onNav) props.onNav("invoices"); }}>
                              <Icon name="receipt" size={11} /> Invoiced
                            </button>
                          ) : (
                            <button className="pill-btn" type="button" title="Convert to invoice"
                              style={{ fontSize: 11, padding: "3px 8px", background: "#EEF2FF", color: "#534AB7", border: "1px solid #C7D2FE" }}
                              onClick={function(id) { return function() { handleConvert(id); }; }(q.quotationId)}>
                              <Icon name="file-text" size={11} /> Invoice
                            </button>
                          )}
                          {/* View / Edit / Delete */}
                          <button
                            className="btn"
                            type="button"
                            title="View"
                            style={{ padding: "4px 7px", fontSize: 12 }}
                            onClick={function(row) { return function() { setSelected(row); }; }(q)}
                          >
                            <Icon name="eye" size={13} />
                          </button>
                          <button
                            className="btn"
                            type="button"
                            title="Edit"
                            style={{ padding: "4px 7px", fontSize: 12 }}
                            onClick={function(row) { return function() { openEdit(row); }; }(q)}
                          >
                            <Icon name="pencil" size={13} />
                          </button>
                          <button
                            className="btn"
                            type="button"
                            title="Delete"
                            style={{ padding: "4px 7px", fontSize: 12, color: "#C0263A" }}
                            onClick={function(id) { return function() { handleDelete(id); }; }(q.quotationId)}
                          >
                            <Icon name="trash-2" size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right preview pane */}
        {selected && (
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column", borderRadius: 8 }}>
            <QuotationPreview
              quotation={selected}
              onClose={function() { setSelected(null); }}
              onPrint={handlePrint}
            />
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <QuotationFormModal
          initial={editQuo || {}}
          projects={projects}
          onClose={function() { setShowForm(false); setEditQuo(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

Object.assign(window, { QuotationPage });

export default QuotationPage;

export { computeItemsLocally };
