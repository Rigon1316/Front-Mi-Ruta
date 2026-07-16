// ─── Design System – MiRuta ───────────────────────────────────────────────
export const C = {
  // Primary olive/military green palette
  PRIMARY:        "#4A5C3F",
  PRIMARY_LIGHT:  "#6B7B5E",
  ACCENT:         "#7E9E6A",
  ACCENT_BG:      "#EAF0E5",  // very pale green – used as chip / stats bg

  // Surfaces
  SURFACE:        "#FFFFFF",
  BG:             "#F4F5F0",  // warm off-white page background
  CARD:           "#FFFFFF",

  // Text
  TEXT:           "#1A1A1A",
  TEXT_MUTED:     "#6B6B6B",
  TEXT_LIGHT:     "#A0A0A0",

  // Utility
  BORDER:         "#E4E6DF",
  SHADOW:         "#000000",

  // Semantic
  DANGER:         "#C0392B",
  LIKE:           "#E74C3C",
} as const;

export const FONTS = {
  BOLD:     "700" as const,
  SEMI:     "600" as const,
  REGULAR:  "400" as const,
};
