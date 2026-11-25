"use client";

import { useState } from "react";
import type { Session, Speaker } from "@/lib/hub";

type Row = Session & { speakers: string[] };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const newId = () => `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const toMin = (t: string) => (t ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) : NaN);
const to12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
// Every 15 minutes from 6:00 AM to 11:45 PM.
const TIMES = Array.from({ length: 72 }, (_, i) => {
  const mins = 6 * 60 + i * 15;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
});

function TimeSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const options = value && !TIMES.includes(value) ? [value, ...TIMES].sort() : TIMES;
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {options.map((t) => <option key={t} value={t}>{to12(t)}</option>)}
      </select>
    </label>
  );
}

// The event's speakers and agenda, edited together so the agenda's speaker
// dropdown always matches the speaker list. Drag items (or use the arrows) to
// reorder; items can overlap. Everything goes into two hidden fields on save.
export default function AgendaEditor({
  initial,
  initialSpeakers,
  kinds,
  speakerKinds,
}: {
  initial: Session[];
  initialSpeakers: Speaker[];
  kinds: string[];
  speakerKinds: string[];
}) {
  const [speakers, setSpeakers] = useState<Speaker[]>(initialSpeakers);
  const [rows, setRows] = useState<Row[]>(() =>
    initial.map((s) => ({ ...s, speakers: s.speakers ?? (s.speaker ? s.speaker.split(/\s*,\s*/).filter(Boolean) : []) })),
  );
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  // Only the ⠿ handle starts a drag, so selecting text in a box still works.
  const [armed, setArmed] = useState<number | null>(null);
  const kindList = [...new Set([...kinds, ...rows.map((r) => r.kind)])].filter(Boolean);
  const names = speakers.map((s) => s.name.trim()).filter(Boolean);

  const update = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const moveTo = (from: number, to: number) =>
    setRows((rs) => {
      if (to < 0 || to >= rs.length || from === to) return rs;
      const c = [...rs];
      const [x] = c.splice(from, 1);
      c.splice(to, 0, x);
      return c;
    });
  const add = () => {
    const last = rows[rows.length - 1];
    setRows([...rows, { id: newId(), start: last?.end || "09:00", end: "", title: "", kind: kindList[0] ?? "talk", speakers: [] }]);
  };

  const setSpeaker = (i: number, patch: Partial<Speaker>) => {
    const old = speakers[i]?.name ?? "";
    setSpeakers((sp) => sp.map((s, j) => (j === i ? { ...s, ...patch } : s)));
    // Renaming a speaker updates the agenda items they are on.
    if (patch.name !== undefined && old && patch.name !== old)
      setRows((rs) => rs.map((r) => ({ ...r, speakers: r.speakers.map((n) => (n === old ? patch.name! : n)) })));
  };
  const removeSpeaker = (i: number) => {
    const name = speakers[i]?.name;
    setSpeakers((sp) => sp.filter((_, j) => j !== i));
    setRows((rs) => rs.map((r) => ({ ...r, speakers: r.speakers.filter((n) => n !== name) })));
  };

  const overlaps = (i: number) => {
    const a = rows[i];
    if (!a.start) return [];
    const a1 = toMin(a.start), a2 = toMin(a.end) || a1 + 1;
    return rows.filter((b, j) => {
      if (j === i || !b.start) return false;
      const b1 = toMin(b.start), b2 = toMin(b.end) || b1 + 1;
      return a1 < b2 && b1 < a2;
    });
  };

  const savedSessions = JSON.stringify(
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
  const savedSpeakers = JSON.stringify(speakers.filter((s) => s.name.trim()));

  return (
    <div className="agenda-editor">
      <input type="hidden" name="d_speakers_json" value={savedSpeakers} />
      <input type="hidden" name="d_sessions_json" value={savedSessions} />

      <div className="label-like"><b>Speakers for this event</b></div>
      {speakers.length === 0 && <p className="soft small">No speakers yet. Add them here, then pick them on agenda items.</p>}
      {speakers.map((sp, i) => (
        <div key={i} className="speaker-row">
          <label>Name<input value={sp.name} maxLength={120} onChange={(e) => setSpeaker(i, { name: e.target.value })} /></label>
          <label>Title or company<input value={sp.title ?? ""} maxLength={160} onChange={(e) => setSpeaker(i, { title: e.target.value })} /></label>
          <label>Link<input value={sp.url ?? ""} maxLength={300} placeholder="https://" onChange={(e) => setSpeaker(i, { url: e.target.value })} /></label>
          <label className="wide">Short bio<textarea rows={2} value={sp.bio ?? ""} maxLength={1000} onChange={(e) => setSpeaker(i, { bio: e.target.value })} /></label>
          <div className="row"><span className="grow" /><button type="button" className="btn ghost small" onClick={() => removeSpeaker(i)}>Remove speaker</button></div>
        </div>
      ))}
      <p><button type="button" className="btn ghost small" onClick={() => setSpeakers([...speakers, { name: "" }])}>+ Add speaker</button></p>

      <div className="label-like"><b>Agenda</b> <span className="soft small">Drag to reorder. Items can overlap, like two workshops in different rooms.</span></div>
      {rows.length === 0 && <p className="soft small">No agenda items yet.</p>}
      {rows.map((r, i) => {
        const same = overlaps(i);
        const canSpeak = speakerKinds.includes(r.kind);
        const left = names.filter((n) => !r.speakers.includes(n));
        return (
          <div
            key={r.id}
            className={`agenda-row ${drag === i ? "is-drag" : ""} ${over === i && drag !== i ? "is-over" : ""}`}
            draggable={armed === i}
            onDragStart={(e) => {
              setDrag(i);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(i);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (drag !== null) moveTo(drag, i);
              setDrag(null);
              setOver(null);
            }}
            onDragEnd={() => {
              setDrag(null);
              setOver(null);
              setArmed(null);
            }}
          >
            <div className="row agenda-row-head">
              <span className="drag-handle" aria-hidden="true" onMouseDown={() => setArmed(i)} onMouseUp={() => setArmed(null)} title="Drag to move">⠿</span>
              <b>{r.title || "New item"}</b>
              <span className="grow" />
              <button type="button" className="btn ghost small" onClick={() => moveTo(i, i - 1)} disabled={i === 0} aria-label="Move up">↑</button>
              <button type="button" className="btn ghost small" onClick={() => moveTo(i, i + 1)} disabled={i === rows.length - 1} aria-label="Move down">↓</button>
            </div>
            <div className="agenda-grid">
              <label>
                Type
                <select value={r.kind} onChange={(e) => update(i, { kind: e.target.value })}>
                  {kindList.map((k) => <option key={k} value={k}>{cap(k)}</option>)}
                </select>
              </label>
              <TimeSelect label="Starts" value={r.start} onChange={(v) => update(i, { start: v })} />
              <TimeSelect label="Ends" value={r.end} onChange={(v) => update(i, { end: v })} />
              <label className="wide">Title<input value={r.title} maxLength={160} onChange={(e) => update(i, { title: e.target.value })} placeholder={r.kind === "dining" ? "Lunch" : "Session title"} /></label>
              <label>Room<input value={r.room ?? ""} maxLength={80} onChange={(e) => update(i, { room: e.target.value })} placeholder="Main hall" /></label>
            </div>
            <label>Description<textarea rows={2} value={r.description ?? ""} maxLength={1000} onChange={(e) => update(i, { description: e.target.value })} /></label>
            {canSpeak && (
              <div className="speaker-pick">
                <span className="small"><b>Speakers</b></span>
                <div className="chips">
                  {r.speakers.map((n) => (
                    <button type="button" key={n} className="chip on" onClick={() => update(i, { speakers: r.speakers.filter((x) => x !== n) })} aria-label={`Remove ${n}`}>
                      {n} ×
                    </button>
                  ))}
                  <select
                    value=""
                    onChange={(e) => e.target.value && update(i, { speakers: [...r.speakers, e.target.value] })}
                    aria-label="Add a speaker"
                    disabled={left.length === 0}
                  >
                    <option value="">{names.length === 0 ? "Add speakers above first" : left.length ? "+ Add a speaker" : "Everyone is added"}</option>
                    {left.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div className="row">
              {same.length > 0 && <span className="pill soon small">Same time as {same.map((s) => s.title || "another item").join(", ")}</span>}
              <span className="grow" />
              <button type="button" className="btn ghost small" onClick={() => setRows([...rows.slice(0, i + 1), { ...r, id: newId(), title: `${r.title} (copy)` }, ...rows.slice(i + 1)])}>Duplicate</button>
              <button type="button" className="btn ghost small" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button>
            </div>
          </div>
        );
      })}
      <p><button type="button" className="btn ghost small" onClick={add}>+ Add agenda item</button></p>
    </div>
  );
}
