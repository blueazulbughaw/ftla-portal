// ============================================================
// Organization themes. Everyone picks a preset and an accent color.
// With the custom_branding add-on, an organization can set every color,
// a font, a logo and extra CSS.
// ============================================================

export type Theme = {
  preset?: string;
  accent?: string;
  // Custom branding only:
  bg?: string;
  surface?: string;
  fg?: string;
  link?: string;
  font?: string;
  logo?: string;
  css?: string;
};

type Preset = { key: string; label: string; accent: string; soft: string; link: string; bg?: string; surface?: string; fg?: string };

export const PRESETS: Preset[] = [
  { key: "faithtech", label: "FaithTech yellow", accent: "#ffd700", soft: "#ffef7a", link: "#b83a16" },
  { key: "ocean", label: "Ocean", accent: "#8adfff", soft: "#c9f0ff", link: "#0b6e94" },
  { key: "garden", label: "Garden", accent: "#bae386", soft: "#dcf2c2", link: "#3d6b12" },
  { key: "sunset", label: "Sunset", accent: "#ff9a62", soft: "#ffd0b3", link: "#b0361a" },
  { key: "grape", label: "Grape", accent: "#c9a7ff", soft: "#e6d8ff", link: "#5b2fa8" },
  { key: "rose", label: "Rose", accent: "#ffadc6", soft: "#ffd9e5", link: "#a3224b" },
  { key: "night", label: "Night", accent: "#ffd700", soft: "#4a4630", link: "#ffcf5c", bg: "#121212", surface: "#1e1e1e", fg: "#f3f3f3" },
];

/** Accent colors anyone can pick, on top of the preset's own. */
export const ACCENTS = ["#ffd700", "#f05228", "#bae386", "#8adfff", "#c9a7ff", "#ffadc6", "#ff9a62", "#5eead4"];

export const FONTS = ["Inter", "DM Sans", "Poppins", "Lora", "Merriweather", "Space Grotesk", "Nunito"];

const HEX = /^#[0-9a-f]{6}$/i;
export const hex = (v: unknown) => (typeof v === "string" && HEX.test(v) ? v : undefined);

/** Mixes a color toward white, for the soft accent. */
function soften(c: string, amount = 0.55) {
  const n = parseInt(c.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => Math.round(x + (255 - x) * amount));
  return `#${ch.map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/** Black or near-black text on light fills, white on dark ones. */
function onFill(c: string) {
  const n = parseInt(c.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#16160c" : "#ffffff";
}

/** The CSS for an organization's pages. Returns "" for the default look. */
export function themeCss(theme: Theme | null | undefined, custom: boolean): string {
  if (!theme || (!theme.preset && !theme.accent && !custom)) return "";
  const p = PRESETS.find((x) => x.key === theme.preset) ?? PRESETS[0];
  const accent = hex(theme.accent) ?? p.accent;
  const vars: Record<string, string> = {
    "--yellow": accent,
    "--yellow-soft": theme.accent ? soften(accent) : p.soft,
    "--on-fill": onFill(accent),
    "--link": p.link,
  };
  if (p.bg) Object.assign(vars, { "--bg": p.bg, "--surface": p.surface!, "--surface-2": p.surface!, "--fg": p.fg!, "--fg-soft": "#b5b5b5", "--line": "#333333" });
  if (custom) {
    if (hex(theme.bg)) vars["--bg"] = theme.bg!;
    if (hex(theme.surface)) vars["--surface"] = vars["--surface-2"] = theme.surface!;
    if (hex(theme.fg)) vars["--fg"] = theme.fg!;
    if (hex(theme.link)) vars["--link"] = theme.link!;
    if (theme.font && FONTS.includes(theme.font)) vars["--font"] = `"${theme.font}", system-ui, sans-serif`;
  }
  let css = `:root{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";")}}`;
  // Custom CSS can't close the style tag or load outside files.
  if (custom && theme.css) css += theme.css.replace(/<\/?style/gi, "").replace(/@import/gi, "").slice(0, 8000);
  return css;
}

export const fontHref = (theme: Theme | null | undefined, custom: boolean) =>
  custom && theme?.font && theme.font !== "Inter" && FONTS.includes(theme.font)
    ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.font).replace(/%20/g, "+")}:wght@400;600;700&display=swap`
    : null;
