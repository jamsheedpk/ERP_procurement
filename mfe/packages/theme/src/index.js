/** Curated brand palettes, ported from the monolith's index.html. */
export const ACCENT_THEMES = {
  "#6F1947": { name: "Burgundy", magenta: "#B61B54", pink: "#F5989D", plum700: "#5B1239", plum50: "#FBF3F7", plum100: "#F4DDE8", plum200: "#E7B7CE", plum800: "#420C29", plum900: "#2A0719" },
  "#3B3E8F": { name: "Indigo",   magenta: "#5C4FC6", pink: "#A6B0E8", plum700: "#2D2F70", plum50: "#F0F1FA", plum100: "#DCDFF1", plum200: "#B6BCDF", plum800: "#222469", plum900: "#1B1D52" },
  "#1F5A3D": { name: "Forest",   magenta: "#2E7D54", pink: "#A8D2B9", plum700: "#163F2B", plum50: "#EEF6F1", plum100: "#D2E8DB", plum200: "#A8CFB7", plum800: "#0E2A1D", plum900: "#082015" },
  "#2A2326": { name: "Charcoal", magenta: "#5C5156", pink: "#A89DA3", plum700: "#1A1316", plum50: "#F3F0F2", plum100: "#E6E1E4", plum200: "#CFC7CC", plum800: "#1A1316", plum900: "#0F0A0C" },
};

export const DEFAULT_ACCENT = "#6F1947";
const ACCENT_KEY = "meridian_accent";

/** The user's persisted accent choice (falls back to Burgundy). */
export function getSavedAccent() {
  try {
    const a = localStorage.getItem(ACCENT_KEY);
    return ACCENT_THEMES[a] ? a : DEFAULT_ACCENT;
  } catch { return DEFAULT_ACCENT; }
}

/** Apply a palette and remember it for the next visit. */
export function setAccent(accent) {
  try { localStorage.setItem(ACCENT_KEY, accent); } catch { /* private mode */ }
  applyTheme(accent);
}

export function applyTheme(accent) {
  const t = ACCENT_THEMES[accent] || ACCENT_THEMES[DEFAULT_ACCENT];
  const r = document.documentElement.style;
  r.setProperty("--brand-burgundy", ACCENT_THEMES[accent] ? accent : DEFAULT_ACCENT);
  r.setProperty("--brand-magenta", t.magenta);
  r.setProperty("--brand-pink", t.pink);
  r.setProperty("--plum-700", t.plum700);
  r.setProperty("--plum-50", t.plum50);
  r.setProperty("--plum-100", t.plum100);
  r.setProperty("--plum-200", t.plum200);
  r.setProperty("--plum-800", t.plum800);
  r.setProperty("--plum-900", t.plum900);
}
