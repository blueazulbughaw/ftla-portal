// The event form uses plain text boxes: one item per line, parts separated by " | ".
// These helpers turn those lines into the event's details and back again.

import type { EventDetails } from "./data";
import type { SessionKind } from "./hub";

const lines = (s: string) => s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const parts = (l: string) => l.split("|").map((p) => p.trim());
const id = (s: string, i: number) => (s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "item") + "-" + i;

/** "9:30" or "9:30 AM" or "13:30" -> "09:30" / "13:30". */
function hhmm(t: string): string {
  const m = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return "";
  let h = Number(m[1]);
  if (m[3]) h = (h % 12) + (m[3].toLowerCase() === "pm" ? 12 : 0);
  return `${String(h).padStart(2, "0")}:${m[2] ?? "00"}`;
}

export const FORMATS = {
  sessions: "9:00 AM - 9:30 AM | Title | talk, workshop or community | Room | Speaker | Short description",
  speakers: "Name | Title or company | Short bio | Link",
  parking: "Lot name | Price | Details",
  meals: "12:30 PM | Lunch | Details",
  tracks: "Track name | What teams build",
  perks: "Perk name | Details",
  onTheDay: "Title | Details",
};

export function parseSessions(text: string): EventDetails["sessions"] {
  return lines(text).map((l, i) => {
    const [time = "", title = "", kind = "", room = "", speaker = "", description = ""] = parts(l);
    const [a = "", b = ""] = time.split(/\s*[-–]\s*/);
    const k = kind.toLowerCase();
    return {
      id: id(title, i),
      start: hhmm(a),
      end: hhmm(b),
      title: title || "Session",
      kind: (["talk", "workshop", "community"].includes(k) ? k : "community") as SessionKind,
      room: room || undefined,
      speaker: speaker || undefined,
      description: description || undefined,
    };
  });
}

export function sessionsToText(s: EventDetails["sessions"] = []): string {
  const t = (x: string) => {
    if (!x) return "";
    const [h, m] = x.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  };
  return s.map((x) => [`${t(x.start)}${x.end ? ` - ${t(x.end)}` : ""}`, x.title, x.kind, x.room ?? "", x.speaker ?? "", x.description ?? ""].join(" | ").replace(/( \| )+$/, "")).join("\n");
}

export const parseSpeakers = (text: string) =>
  lines(text).map((l) => {
    const [name = "", title = "", bio = "", url = ""] = parts(l);
    return { name, title: title || undefined, bio: bio || undefined, url: url || undefined };
  });
export const speakersToText = (s: EventDetails["speakers"] = []) => s.map((x) => [x.name, x.title ?? "", x.bio ?? "", x.url ?? ""].join(" | ").replace(/( \| )+$/, "")).join("\n");

export const parseParking = (text: string) =>
  lines(text).map((l) => {
    const [name = "", price = "", body = ""] = parts(l);
    return { name, price: price || undefined, body };
  });
export const parkingToText = (s: EventDetails["parking"] = []) => s.map((x) => [x.name, x.price ?? "", x.body].join(" | ")).join("\n");

export const parseMeals = (text: string) =>
  lines(text).map((l) => {
    const [time = "", title = "", body = ""] = parts(l);
    return { time, title, body };
  });
export const mealsToText = (s: { time: string; title: string; body: string }[] = []) => s.map((x) => [x.time, x.title, x.body].join(" | ")).join("\n");

export const parsePairs = (text: string) =>
  lines(text).map((l) => {
    const [name = "", ...rest] = parts(l);
    return { name, body: rest.join(" | ") };
  });
export const pairsToText = (s: { name?: string; title?: string; body: string }[] = []) => s.map((x) => [x.name ?? x.title ?? "", x.body].join(" | ")).join("\n");

export const parseList = (text: string) => lines(text);
export const listToText = (s: string[] = []) => s.join("\n");
