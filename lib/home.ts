// ============================================================
// An organization's homepage is a list of sections, like blocks in WordPress.
// The team adds, edits, hides, removes and reorders them in the admin.
// ============================================================

import sanitizeHtml from "sanitize-html";
import { LEADERS, LINKS } from "./events";
import type { Org } from "./data";

export type SectionType = "hero" | "events" | "text" | "cards" | "links" | "people" | "donate" | "html";

export type SectionItem = { title: string; body?: string; url?: string };

export type Section = {
  id: string;
  type: SectionType;
  hidden?: boolean;
  /** Small line above the heading. */
  label?: string;
  title?: string;
  body?: string;
  items?: SectionItem[];
  /** Custom HTML. Cleaned before it is saved and again before it is shown. */
  html?: string;
  /** Events section: also list past events. Hero: show the next event. */
  extra?: boolean;
};

export const SECTION_TYPES: { type: SectionType; name: string; help: string }[] = [
  { type: "hero", name: "Banner", help: "The big yellow block at the top, with your headline." },
  { type: "events", name: "Upcoming events", help: "Your published events, soonest first." },
  { type: "text", name: "Text (about us)", help: "A heading and a few paragraphs." },
  { type: "cards", name: "Cards", help: "A row of short cards, like steps or values." },
  { type: "links", name: "Links", help: "Buttons to your Slack, newsletter, forms or socials." },
  { type: "people", name: "Team", help: "Names and roles of your leaders." },
  { type: "donate", name: "Donate", help: "Your donate links from Settings (nonprofits)." },
  { type: "html", name: "Custom HTML", help: "Paste your own HTML, like an embed or a styled block." },
];

export const typeName = (t: SectionType) => SECTION_TYPES.find((x) => x.type === t)?.name ?? t;

const ALLOWED: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "img", "figure", "figcaption", "picture", "source", "video", "audio", "iframe", "span", "div", "section", "h1", "h2", "button", "details", "summary",
  ],
  allowedAttributes: {
    "*": ["class", "style", "id", "title", "aria-label", "role"],
    a: ["href", "name", "target", "rel"],
    img: ["src", "srcset", "alt", "width", "height", "loading"],
    source: ["src", "srcset", "type", "media"],
    video: ["src", "controls", "poster", "width", "height", "autoplay", "muted", "loop", "playsinline"],
    audio: ["src", "controls"],
    iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "loading", "title"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  // Embeds only from well-known video, map, form and calendar sites.
  allowedIframeHostnames: [
    "www.youtube.com", "www.youtube-nocookie.com", "player.vimeo.com", "www.google.com", "docs.google.com", "calendar.google.com",
    "maps.google.com", "lu.ma", "luma.com", "open.spotify.com", "w.soundcloud.com", "www.loom.com", "airtable.com", "form.typeform.com", "tally.so",
  ],
  transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener" }, true) },
};

/** Removes scripts, event handlers and anything else unsafe from custom HTML. */
export const cleanHtml = (html: string) => sanitizeHtml(html, ALLOWED);

const sid = (t: string, i: number) => `${t}-${i}`;

/** What an organization's homepage shows before its team edits it. */
export function defaultSections(org: Org): Section[] {
  if (org.slug === "ftla") {
    return [
      {
        id: sid("hero", 1),
        type: "hero",
        label: "Los Angeles · Community hub",
        title: "Christians in tech, building together in LA.",
        body: "We gather builders, designers, founders and dreamers across Los Angeles to practice redemptive technology. Come to an event, join the Slack and build something that serves people.",
        extra: true,
      },
      { id: sid("events", 2), type: "events", label: "What's coming up", title: "Upcoming events", body: "Every gathering is open to anyone curious about faith and technology. Bring a friend.", extra: true },
      {
        id: sid("cards", 3),
        type: "cards",
        label: "How we build",
        title: "The Create Cycle",
        body: "Everything we make follows the same four steps, from a single evening meetup to a full hackathon.",
        items: [
          { title: "Lament", body: "Name what is broken in our city and in our world." },
          { title: "Discern", body: "Listen to God and to the people closest to the problem." },
          { title: "Build", body: "Make something real, together, with the gifts we have." },
          { title: "Steward", body: "Care for what we built and the people it serves." },
        ],
      },
      {
        id: sid("links", 4),
        type: "links",
        label: "Get involved",
        title: "How to plug in",
        items: [
          { title: "Join the Slack", body: "Say hi in the FaithTech LA channel.", url: LINKS.slack },
          { title: "Get the newsletter", body: "New dates land in your inbox first.", url: LINKS.mailing },
          { title: "Shape what we Create", body: "Tell us what you want to build.", url: LINKS.create },
          { title: "Give", body: "Our events are free. Help keep them that way.", url: LINKS.give },
        ],
      },
      { id: sid("people", 5), type: "people", label: "The team", title: "Meet our leaders", items: LEADERS.map((l) => ({ title: l.name, body: l.role })) },
    ];
  }
  return [
    { id: sid("hero", 1), type: "hero", label: org.is_nonprofit ? "Nonprofit organization" : "Organization", title: org.name, body: org.about, extra: true },
    { id: sid("events", 2), type: "events", label: "What's on", title: "Upcoming events", extra: true },
    ...(org.is_nonprofit ? [{ id: sid("donate", 3), type: "donate" as const, label: "Support us", title: "Give" }] : []),
  ];
}

export function homeSections(org: Org & { home_sections?: Section[] | null }): Section[] {
  return Array.isArray(org.home_sections) ? org.home_sections : defaultSections(org);
}

const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const link = (u: string) => (!u ? undefined : /^(https?:|mailto:|tel:|\/)/i.test(u) ? u : `https://${u}`);

/** Checks and tidies sections sent from the homepage editor. */
export function readSections(json: string): Section[] {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];
  const types = SECTION_TYPES.map((t) => t.type);
  return raw.slice(0, 40).flatMap((r: Record<string, unknown>, i: number): Section[] => {
    const type = s(r.type, 20) as SectionType;
    if (!types.includes(type)) return [];
    const items = Array.isArray(r.items)
      ? r.items.slice(0, 40).map((x: Record<string, unknown>) => ({ title: s(x.title, 160), body: s(x.body, 600) || undefined, url: link(s(x.url, 500)) })).filter((x) => x.title)
      : undefined;
    return [
      {
        id: s(r.id, 60) || `${type}-${Date.now().toString(36)}-${i}`,
        type,
        hidden: r.hidden === true || undefined,
        label: s(r.label, 120) || undefined,
        title: s(r.title, 200) || undefined,
        body: s(r.body, 5000) || undefined,
        items: items?.length ? items : undefined,
        html: type === "html" ? cleanHtml(s(r.html, 50000)) : undefined,
        extra: r.extra === true || undefined,
      },
    ];
  });
}
