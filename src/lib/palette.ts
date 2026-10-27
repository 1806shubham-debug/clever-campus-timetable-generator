export const PALETTE = {
  sun: "#FFCC00",
  cobalt: "#2F4BFF",
  signal: "#FF3B30",
  orchid: "#8B5CF6",
  mint: "#3ED9A4",
  ink: "#000000",
} as const;

export type PaletteKey = keyof typeof PALETTE;
