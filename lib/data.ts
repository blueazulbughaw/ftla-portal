// ============================================================
// One place that loads organizations and events.
// Events come from the Supabase database. Until FaithTech LA's events have been
// imported there, the built-in ones in lib/events.ts are shown instead.
// ============================================================

import { createClient, supabaseConfigured } from "./supabase/server";
import { EVENTS, type PortalEvent } from "./events";
import {
  DEFAULT_FAQS,
  DEFAULT_GUIDES,
  FTLA_COMMUNITIES,
  hubFor,
  type HubInfo,
  type Session,
  type Speaker,
  type Hackathon,
} from "./hub";
import { ALL_FEATURES, type FeatureKey } from "./features";
import type { Theme } from "./themes";

export const HOME_ORG_SLUG = "faithtech-la";

export type DonationLink = { label: string; url: string };

export type Org = {
  id: string;
  slug: string;
  name: string;
  about: string;
  website: string | null;
  contact_email: string | null;
  is_nonprofit: boolean;
  donation_links: DonationLink[];
  plan: string;
  addons: string[];
  theme?: Theme | null;
};

/** What a database event keeps in its `details` column. Each feature reads its own part. */
export type EventDetails = {
  transit?: string;
  carpool?: string;
  rideshare?: string;
  parking?: { name: string; price?: string; body: string }[];
  registration?: { body?: string; steps?: string[] };
  sessions?: Session[];
  speakers?: Speaker[];
  food?: { included?: string; meals: { time: string; title: string; body: string }[] };
  perks?: HubInfo["perks"];
  hackathon?: Hackathon;
  onTheDay?: HubInfo["onTheDay"];
};

export type EventRow = {
  id: string;
  org_id: string;
  type_id: string | null;
  slug: string;
  title: string;
  starts_on: string;
  time_text: string;
  place: string;
  address: string | null;
  summary: string;
  description: string | null;
  price: string | null;
  register_url: string | null;
  register_label: string | null;
  luma_event_id: string | null;
  chapter_id?: string | null;
  series_id?: string | null;
  published: boolean;
  details: EventDetails;
  organizations?: Org;
  event_types?: { id: string; name: string; features: FeatureKey[] } | null;
};

/** An event with everything the pages need, whether it came from the database or lib/events.ts. */
export type FullEvent = {
  /** Stable id: the database id, or the slug for built-in events. Saved schedules use it. */
  key: string;
  fromDb: boolean;
  org: { slug: string; name: string; id?: string; addons: string[]; is_nonprofit: boolean; donation_links: DonationLink[]; theme?: Theme | null };
  typeName: string;
  features: FeatureKey[];
  /** Whether this event gets the signed-in participant hub (a paid add-on). */
  hubEnabled: boolean;
  published: boolean;
  event: PortalEvent;
  hub: HubInfo;
};

const slugWord = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "event";

function builtIn(e: PortalEvent): FullEvent {
  return {
    key: e.slug,
    fromDb: false,
    org: { slug: HOME_ORG_SLUG, name: "FaithTech LA", addons: ["participant_hub", "integrations", "reporting"], is_nonprofit: true, donation_links: [{ label: "Give to FaithTech", url: "https://www.faithtech.com/donate" }] },
    typeName: e.label,
    features: ALL_FEATURES,
    hubEnabled: true,
    published: true,
    event: e,
    hub: hubFor(e),
  };
}

export function fromRow(r: EventRow): FullEvent {
  const org = r.organizations!;
  const features = (r.event_types?.features ?? ["location", "registration"]) as FeatureKey[];
  const typeName = r.event_types?.name ?? "Event";
  const d = r.details ?? {};
  const has = (f: FeatureKey) => features.includes(f);
  const event: PortalEvent = {
    slug: r.slug,
    title: r.title,
    date: r.starts_on,
    time: r.time_text,
    category: slugWord(typeName),
    label: typeName,
    price: r.price ?? undefined,
    place: r.place,
    address: r.address ?? undefined,
    summary: r.summary,
    description: r.description ?? undefined,
    organizer: org.name,
    registerUrl: r.register_url ?? undefined,
    registerLabel: r.register_label ?? undefined,
    lumaEventId: r.luma_event_id ?? undefined,
    agenda: has("agenda") ? (d.sessions ?? []).map((s) => ({ time: s.start, title: s.title, note: s.speaker })) : undefined,
  };

  const checklist: HubInfo["checklist"] = [];
  if (has("registration") && r.register_url)
    checklist.push({ id: "ticket", title: "Get your ticket", body: `Register for ${r.title}.`, icon: "ticket", cta: r.register_label || "Register", href: r.register_url, external: true });
  if (has("food")) checklist.push({ id: "meals", title: "Save meal preferences", body: "Add dietary preferences or food allergies to your profile.", icon: "food", cta: "Add preferences", href: "/hub/experience/food" });
  if (has("agenda")) checklist.push({ id: "schedule", title: "Build your schedule", body: "Save the sessions you want to attend.", icon: "calendar", cta: "Browse agenda", href: "/hub/agenda" });
  if (has("location")) checklist.push({ id: "arrival", title: "Plan your arrival", body: "Check the venue address and open directions.", icon: "car", cta: "Getting here", href: "/hub/experience/getting-here" });
  if (has("hackathon")) checklist.push({ id: "team", title: "Find a team", body: "Read the tracks and think about who to build with.", icon: "users", cta: "Hackathon", href: "/hub/experience/hackathon" });
  checklist.push({ id: "profile", title: "Set up your profile", body: "Choose what to share when you meet people.", icon: "user", cta: "My profile", href: "/hub/profile" });

  const hub: HubInfo = {
    checklist,
    sessions: has("agenda") ? d.sessions ?? [] : [],
    registration: { body: d.registration?.body || (r.register_url ? `Register for ${r.title} using the link below.` : "No registration needed. Just come."), steps: d.registration?.steps },
    gettingHere: { transit: d.transit, carpool: d.carpool, rideshare: d.rideshare, parking: has("parking") ? d.parking : undefined },
    food: has("food") ? d.food ?? { meals: [] } : { meals: [] },
    perks: has("perks") ? d.perks ?? [] : [],
    onTheDay: has("on_the_day") ? d.onTheDay ?? [] : [],
    communities: org.slug === HOME_ORG_SLUG ? FTLA_COMMUNITIES : org.website ? [{ kind: "Organization", name: org.name, body: org.about || "Visit our website.", url: org.website }] : [],
    guides: DEFAULT_GUIDES,
    faqs: DEFAULT_FAQS,
    speakers: has("speakers") ? d.speakers ?? [] : undefined,
    hackathon: has("hackathon") ? d.hackathon ?? { tracks: [] } : undefined,
  };

  return {
    key: r.id,
    fromDb: true,
    org: { slug: org.slug, name: org.name, id: org.id, addons: org.addons, is_nonprofit: org.is_nonprofit, donation_links: org.donation_links ?? [], theme: org.theme },
    typeName,
    features,
    hubEnabled: org.addons.includes("participant_hub"),
    published: r.published,
    event,
    hub,
  };
}

const EVENT_SELECT = "*, organizations(*), event_types(id,name,features)";

/** Events from the database you are allowed to see. Returns null when the tables aren't set up. */
async function dbEvents(filter?: { orgSlug?: string }): Promise<FullEvent[] | null> {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  let q = supabase.from("events").select(EVENT_SELECT).order("starts_on", { ascending: true });
  if (filter?.orgSlug) {
    const { data: org } = await supabase.from("organizations").select("id").eq("slug", filter.orgSlug).maybeSingle();
    if (!org) return [];
    q = q.eq("org_id", org.id);
  }
  const { data, error } = await q;
  if (error) return null;
  return (data as EventRow[]).map(fromRow);
}

/**
 * Every event to show. Database events first; FaithTech LA's built-in events fill in
 * until they've been imported (see "Import starter events" on the manage page).
 */
export async function allEvents(opts: { includeDrafts?: boolean; orgSlug?: string } = {}): Promise<FullEvent[]> {
  const db = (await dbEvents({ orgSlug: opts.orgSlug })) ?? [];
  const homeImported = db.some((e) => e.org.slug === HOME_ORG_SLUG);
  const wantHome = !opts.orgSlug || opts.orgSlug === HOME_ORG_SLUG;
  const builtins = wantHome && !homeImported ? EVENTS.map(builtIn) : [];
  return [...db.filter((e) => opts.includeDrafts || e.published), ...builtins];
}

export async function findEvent(key: string): Promise<FullEvent | undefined> {
  const list = await allEvents({ includeDrafts: true });
  return list.find((e) => e.key === key) ?? list.find((e) => e.event.slug === key);
}

export async function findEventBySlugs(orgSlug: string, slug: string): Promise<FullEvent | undefined> {
  return (await allEvents({ orgSlug, includeDrafts: true })).find((e) => e.event.slug === slug);
}

export async function getOrg(slug: string): Promise<Org | null> {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("organizations").select("*").eq("slug", slug).maybeSingle();
  return (data as Org) ?? null;
}

/** Organizations you are on the team of. */
export async function myOrgs(): Promise<(Org & { my_role: string })[]> {
  if (!supabaseConfigured()) return [];
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data } = await supabase.from("org_members").select("role, organizations(*)").eq("user_id", auth.user.id);
  return ((data ?? []) as unknown as { role: string; organizations: Org }[])
    .filter((m) => m.organizations)
    .map((m) => ({ ...m.organizations, my_role: m.role }));
}

const todayLA = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
export const isPastEvent = (e: FullEvent) => e.event.date < todayLA();
export const upcoming = (list: FullEvent[]) => list.filter((e) => !isPastEvent(e)).sort((a, b) => a.event.date.localeCompare(b.event.date));
export const past = (list: FullEvent[]) => list.filter(isPastEvent).sort((a, b) => b.event.date.localeCompare(a.event.date));

/** The public page for an event. */
export const eventHref = (e: FullEvent) => (e.fromDb ? `/o/${e.org.slug}/${e.event.slug}` : `/events/${e.event.slug}`);

export type Resource = { id: string; title: string; url: string; kind: string; topic: string; description: string; event_id: string | null; series_id: string | null };

/** An organization's public resource library: slides, recordings and links. */
export async function orgResources(orgId: string): Promise<Resource[]> {
  if (!supabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("resources").select("id,title,url,kind,topic,description,event_id,series_id").eq("org_id", orgId).eq("published", true).order("topic").order("created_at", { ascending: false });
  return (data ?? []) as Resource[];
}
