import { fontHref, themeCss, type Theme } from "@/lib/themes";

/** Applies an organization's theme to the page it's on. */
export default function OrgTheme({ theme, addons }: { theme?: Theme | null; addons: string[] }) {
  const custom = addons.includes("custom_branding");
  const css = themeCss(theme, custom);
  const font = fontHref(theme, custom);
  if (!css && !font) return null;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      {font && <link rel="stylesheet" href={font} />}
      {css && <style>{css}</style>}
    </>
  );
}
