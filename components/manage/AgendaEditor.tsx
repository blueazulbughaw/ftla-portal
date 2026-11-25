"use client";

import { useMemo, useState } from "react";
import type { Session } from "@/lib/hub";

type Row = Session & { speakers: string[] };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const newId = () => `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const toMin = (t: string) => (t ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) : NaN);

// The agenda builder on the event form. Each item has a type, a start and end time
// (items can overlap) and, for talks, workshops and panels, one or more speakers.
// It writes everything into one hidden field that the save action reads.
export default function AgendaEditor({
  initial,
  kinds,
  speakerKinds,
  speakerNames,
}: {
  initial: Session[];
  kinds: string[];
  speakerKinds: string[];
  speakerNames: string[];
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    initial.map((s) => ({ ...s, speakers: s.speakers ?? (s.speaker ? s.speaker.split(/\s*,\s*/).filter(Boolean) : []) })),
  );
  const [extraNames, setExtraNames] = useState<string[]>([]);
  const allNames = useMemo(
    () => [...new Set([...speakerNames, ...extraNames, ...rows.flatMap((r) => r.speakers)])].filter(Boolean),
    [speakerNames, extraNames, rows],
  );
  const kindList = [...new Set([...kinds, ...rows.map((r) => r.kind)])].filter(Boolean);

  const update = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const add = () => {
    const last = rows[rows.length - 1];
    setRows([...rows, { id: newId(), start: last?.end ?? "09:00", end: "", title: "", kind: kindList[0] ?? "talk", speakers: [] }]);
  };
  const remove = (i: number) => setRows(rows.filter((_, j) => j !== i));
  const duplicate = (i: number) => setRows([...rows.slice(0, i + 1), { ...rows[i], id: newId(), title: `${rows[i].title} (copy)` }, ...rows.slice(i + 1)]);

  const overlaps = (i: number) => {
    const a = rows[i];
    const a1 = toMin(a.start), a2 = toMin(a.end) || a1 + 1;
    return rows.filter((b, j) => {
      if (j === i || !b.start) return false;
      const b1 = toMin(b.start), b2 = toMin(b.end) || b1 + 1;
      return a1 < b2 && b1 < a2;
    });
  };

  const saved = JSON.stringify(
    rows
      .filter((r) => r.title.trim() || r.start)
      .map((r) => ({
        id: r.id,
        start: r.start,
        end: r.end,
        title: r.title.trim() || "Session",
        kind: r.kind,
        room: r.room?.trim() || undefined,
        description: r.description?.trim() || undefined,
        speakers: speakerKinds.includes(r.kind) && r.speakers.length ? r.speakers : undefined,
      })),
  );

  return (
    <div className="agenda-editor">
      <input type="hidden" name="d_sessions_json" value={saved} />
      {rows.length === 0 && <p className="soft small">No agenda items yet.</p>}
      {rows.map((r, i) => {
        const same = overlaps(i);
        const canSpeak = speakerKinds.includes(r.kind);
        return (
          <div key={r.id} className="agenda-row">
            <div className="agenda-grid">
              <label>
                Type
                <select value={r.kind} onChange={(e) => update(i, { kind: e.target.value })}>
                  {kindList.map((k) => <option key={k} value={k}>{cap(k)}</option>)}
                </select>
              </label>
              <label>Starts<input type="time" value={r.start} onChange={(e) => update(i, { start: e.target.value })} /></label>
              <label>Ends<input type="time" value={r.end} onChange={(e) => update(i, { end: e.target.value })} /></label>
              <label className="wide">Title<input value={r.title} maxLength={160} onChange={(e) => update(i, { title: e.target.value })} placeholder={r.kind === "dining" ? "Lunch" : "Session title"} /></label>
              <label>Room<input value={r.room ?? ""} maxLength={80} onChange={(e) => update(i, { room: e.target.value })} placeholder="Main hall" /></label>
            </div>
            <label>Description<textarea rows={2} value={r.description ?? ""} maxLength={1000} onChange={(e) => update(i, { description: e.target.value })} /></label>
            {canSpeak && (
              <fieldset className="speaker-pick">
                <legend className="small"><b>Speakers</b></legend>
                <div className="chips">
                  {allNames.map((n) => {
                    const on = r.speakers.includes(n);
                    return (
                      <button
                        type="button"
                        key={n}
                        className={`chip ${on ? "on" : ""}`}
                        aria-pressed={on}
                        onClick={() => update(i, { speakers: on ? r.speakers.filter((x) => x !== n) : [...r.speakers, n] })}
                      >
                        {on ? "✓ " : "+ "}{n}
                      </button>
                    );
                  })}
                  <AddName
                    onAdd={(n) => {
                      setExtraNames((x) => [...x, n]);
                      update(i, { speakers: [...new Set([...r.speakers, n])] });
                    }}
                  />
                </div>
                <span className="soft small hint">New names are added to the Speakers section when you save.</span>
              </fieldset>
            )}
            <div className="row">
              {same.length > 0 && <span className="pill soon small">At the same time as {same.map((s) => s.title || "another item").join(", ")}</span>}
              <span className="grow" />
              <button type="button" className="btn ghost small" onClick={() => duplicate(i)}>Duplicate</button>
              <button type="button" className="btn ghost small" onClick={() => remove(i)}>Remove</button>
            </div>
          </div>
        );
      })}
      <p><button type="button" className="btn ghost small" onClick={add}>+ Add agenda item</button></p>
      <p className="soft small">Items can overlap, for example two workshops in different rooms. They show in time order.</p>
    </div>
  );
}

function AddName({ onAdd }: { onAdd: (name: string) => void }) {
  const [v, setV] = useState("");
  const go = () => {
    const n = v.trim();
    if (n) onAdd(n.slice(0, 120));
    setV("");
  };
  return (
    <span className="add-name">
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            go();
          }
        }}
        placeholder="Add a speaker"
        aria-label="Add a speaker"
      />
      <button type="button" className="btn ghost small" onClick={go}>Add</button>
    </span>
  );
}
