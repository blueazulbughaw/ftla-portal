"use client";

import { useState } from "react";
import { SECTION_TYPES, typeName, type Section, type SectionItem, type SectionType } from "@/lib/home";

const newId = (t: string) => `${t}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// Items are edited one per line as "Title | Details | Link", like the event form.
const itemsToText = (items: SectionItem[] = []) => items.map((x) => [x.title, x.body ?? "", x.url ?? ""].join(" | ").replace(/( \| )+$/, "")).join("\n");
const textToItems = (t: string): SectionItem[] =>
  t.split(/\r?\n/).map((l) => l.split("|").map((p) => p.trim())).filter((p) => p[0]).map(([title, body = "", url = ""]) => ({ title, body: body || undefined, url: url || undefined }));

const ITEM_HINT: Partial<Record<SectionType, string>> = {
  cards: "One card per line: Title | Details",
  links: "One link per line: Title | Short description | https://...",
  people: "One person per line: Name | Role",
};

// The homepage builder: every section can be edited, hidden, removed or moved.
export default function HomeEditor({ initial, orgSlug }: { initial: Section[]; orgSlug: string }) {
  const [rows, setRows] = useState<(Section & { itemsText?: string })[]>(() => initial.map((s) => ({ ...s, itemsText: itemsToText(s.items) })));
  const [adding, setAdding] = useState<SectionType>("text");

  const update = (i: number, patch: Partial<Section & { itemsText?: string }>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) =>
    setRows((r) => {
      const j = i + d;
      if (j < 0 || j >= r.length) return r;
      const c = [...r];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
  const add = () =>
    setRows((r) => [
      ...r,
      { id: newId(adding), type: adding, title: adding === "events" ? "Upcoming events" : typeName(adding), extra: adding === "events" || adding === "hero" ? true : undefined, itemsText: "" },
    ]);

  const saved = JSON.stringify(
    rows.map(({ itemsText, ...s }) => ({ ...s, items: ["cards", "links", "people"].includes(s.type) ? textToItems(itemsText ?? "") : undefined })),
  );

  return (
    <div className="home-editor">
      <input type="hidden" name="sections_json" value={saved} />
      {rows.length === 0 && <p className="soft">Your homepage is empty. Add a section below.</p>}
      {rows.map((s, i) => (
        <div key={s.id} className={`home-row ${s.hidden ? "is-hidden" : ""}`}>
          <div className="home-row-head">
            <span className="pill">{i + 1}</span>
            <b>{typeName(s.type)}</b>
            {s.hidden && <span className="pill soon small">Hidden</span>}
            <span className="grow" />
            <button type="button" className="btn ghost small" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
            <button type="button" className="btn ghost small" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Move down">↓</button>
            <button type="button" className="btn ghost small" onClick={() => update(i, { hidden: !s.hidden })}>{s.hidden ? "Show" : "Hide"}</button>
            <button type="button" className="btn ghost small" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button>
          </div>
          <details open={i === rows.length - 1 && !initial.some((x) => x.id === s.id)}>
            <summary className="small">Edit this section</summary>
            <div className="form">
              <div className="form two">
                <label>Small label<input value={s.label ?? ""} maxLength={120} onChange={(e) => update(i, { label: e.target.value })} placeholder="What's coming up" /></label>
                <label>Heading<input value={s.title ?? ""} maxLength={200} onChange={(e) => update(i, { title: e.target.value })} /></label>
              </div>
              {s.type !== "html" && (
                <label>{s.type === "text" ? "Text" : "Intro"}<textarea rows={s.type === "text" ? 6 : 3} value={s.body ?? ""} maxLength={5000} onChange={(e) => update(i, { body: e.target.value })} /></label>
              )}
              {ITEM_HINT[s.type] && (
                <label>
                  {s.type === "people" ? "People" : s.type === "links" ? "Links" : "Cards"}
                  <textarea rows={5} value={s.itemsText ?? ""} onChange={(e) => update(i, { itemsText: e.target.value })} />
                  <span className="soft small hint">{ITEM_HINT[s.type]}</span>
                </label>
              )}
              {s.type === "html" && (
                <label>
                  HTML
                  <textarea rows={10} className="mono" value={s.html ?? ""} maxLength={50000} onChange={(e) => update(i, { html: e.target.value })} placeholder="<div>...</div>" />
                  <span className="soft small hint">Scripts are removed for safety. Embeds work from YouTube, Vimeo, Google (Maps, Forms, Calendar), Luma, Spotify, Loom, Typeform and Tally.</span>
                </label>
              )}
              {s.type === "hero" && (
                <label className="inline"><input type="checkbox" checked={!!s.extra} onChange={(e) => update(i, { extra: e.target.checked })} /> Show the next event</label>
              )}
              {s.type === "events" && (
                <label className="inline"><input type="checkbox" checked={!!s.extra} onChange={(e) => update(i, { extra: e.target.checked })} /> Also list past events</label>
              )}
              {s.type === "donate" && <p className="soft small">Uses the donate links in <a href={`/${orgSlug}/admin/settings`}>Settings</a>.</p>}
            </div>
          </details>
        </div>
      ))}
      <div className="row home-add">
        <select value={adding} onChange={(e) => setAdding(e.target.value as SectionType)} aria-label="Section to add">
          {SECTION_TYPES.map((t) => <option key={t.type} value={t.type}>{t.name}</option>)}
        </select>
        <button type="button" className="btn ghost" onClick={add}>+ Add section</button>
        <span className="soft small">{SECTION_TYPES.find((t) => t.type === adding)?.help}</span>
      </div>
    </div>
  );
}
