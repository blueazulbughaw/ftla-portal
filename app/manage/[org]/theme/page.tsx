import Link from "next/link";
import Notice from "@/components/hub/Notice";
import { saveTheme } from "@/app/manage/actions";
import { manageContext } from "@/lib/manage";
import { ACCENTS, FONTS, PRESETS, type Theme } from "@/lib/themes";

export default async function ThemePage({ params, searchParams }: { params: Promise<{ org: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ org: slug }, { ok, error }] = await Promise.all([params, searchParams]);
  const { org, isOrgAdmin, hasAddon } = await manageContext(slug);
  const t: Theme = org.theme ?? {};
  const custom = hasAddon("custom_branding");
  const preset = t.preset ?? "faithtech";
  return (
    <form action={saveTheme} className="block form theme-form">
      <input type="hidden" name="org_slug" value={org.slug} />
      <input type="hidden" name="org_id" value={org.id} />
      <h2 className="h3">Look and feel</h2>
      <p className="soft small">Your organization page, event pages and attendee hub use this theme.</p>
      <Notice ok={ok} error={error} />
      {!isOrgAdmin && <p className="notice">Only owners and admins can change the theme.</p>}

      <fieldset>
        <legend className="label">Theme</legend>
        <div className="swatches">
          {PRESETS.map((p) => (
            <label key={p.key} className="swatch">
              <input type="radio" name="preset" value={p.key} defaultChecked={preset === p.key} />
              <span className="swatch-chip" style={{ background: p.bg ?? "#fff", borderColor: p.accent }}>
                <i style={{ background: p.accent }} />
                <i style={{ background: p.soft }} />
                <i style={{ background: p.link }} />
              </span>
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Accent color</legend>
        <div className="swatches">
          <label className="swatch">
            <input type="radio" name="accent" value="" defaultChecked={!t.accent} /> The theme&apos;s own
          </label>
          {ACCENTS.map((a) => (
            <label key={a} className="swatch">
              <input type="radio" name="accent" value={a} defaultChecked={t.accent === a} />
              <span className="dot" style={{ background: a }} aria-label={a} />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="block">
        <legend className="h3">Custom branding</legend>
        {custom ? (
          <>
            <p className="soft small">Tick a color to use it instead of the theme&apos;s.</p>
            <div className="form two">
              {([
                ["accent", "Accent (any color)"],
                ["bg", "Background"],
                ["surface", "Panels"],
                ["fg", "Text"],
                ["link", "Links"],
              ] as const).map(([k, label]) => (
                <label key={k} className="color-row">
                  {k === "accent" ? (
                    <input type="radio" name="accent" value="custom" defaultChecked={Boolean(t.accent && !ACCENTS.includes(t.accent))} />
                  ) : (
                    <input type="checkbox" name={`use_${k}`} defaultChecked={Boolean(t[k])} />
                  )}
                  <input type="color" name={k === "accent" ? "accent_custom" : k} defaultValue={(k === "accent" ? t.accent : t[k]) ?? "#ffffff"} />
                  {label}
                </label>
              ))}
            </div>
            <label>
              Font
              <select name="font" defaultValue={t.font ?? "Inter"}>
                {FONTS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </label>
            <label>Logo link<input name="logo" defaultValue={t.logo ?? ""} placeholder="https://.../logo.png" /></label>
            <label>
              Extra CSS
              <textarea name="css" rows={5} defaultValue={t.css ?? ""} placeholder=".hero { background: linear-gradient(...); }" className="mono" />
              <span className="soft small hint">For full control. It only applies to your organization&apos;s pages.</span>
            </label>
          </>
        ) : (
          <p className="soft small">
            Want your own colors, font, logo and CSS? That comes with the Custom branding add-on. <Link href={`/manage/${org.slug}/addons`}>See add-ons</Link>
          </p>
        )}
      </fieldset>

      <div className="row">
        <button className="btn" disabled={!isOrgAdmin}>Save theme</button>
        <Link href={`/${org.slug}`} className="btn ghost">View public page</Link>
      </div>
    </form>
  );
}
