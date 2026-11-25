"use server";

// Organization tools: create an organization, manage its event types and events,
// team, add-ons and integrations. The database rules check that you're on the team.

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { STARTER_TYPES, ALL_FEATURES, type FeatureKey } from "@/lib/features";
import { EVENTS } from "@/lib/events";
import { HUBS, hubFor } from "@/lib/hub";
import { HOME_ORG_SLUG, type EventDetails } from "@/lib/data";
import { lumaGuests } from "@/lib/luma";
import { FONTS, PRESETS, hex, type Theme } from "@/lib/themes";
import { PLAN_TOOLS, money, planTool, type PlanTool } from "@/lib/planning";
import {
  parseList,
  parseMeals,
  parsePairs,
  parseParking,
  parseSessions,
  parseSpeakers,
} from "@/lib/details-format";

async function signedIn() {
  const user = await getUser();
  if (!user) redirect("/login?next=/manage");
  return { user, supabase: await createClient() };
}

function back(path: string, message: string, kind: "ok" | "error" = "ok"): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(message)}`);
}

const str = (f: FormData, k: string, max = 300) => String(f.get(k) ?? "").trim().slice(0, max);
const opt = (f: FormData, k: string, max = 300) => str(f, k, max) || null;
const url = (f: FormData, k: string) => {
  const s = str(f, k, 500);
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};
export async function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

function donationLinks(f: FormData) {
  const labels = f.getAll("donate_label").map(String);
  const urls = f.getAll("donate_url").map(String);
  return urls
    .map((u, i) => ({ label: (labels[i] || "Donate").trim().slice(0, 60), url: u.trim() }))
    .filter((d) => d.url)
    .map((d) => ({ ...d, url: /^https?:\/\//i.test(d.url) ? d.url : `https://${d.url}` }));
}

// ---------- Organizations ----------

export async function createOrg(formData: FormData) {
  const { user, supabase } = await signedIn();
  const name = str(formData, "name", 120);
  if (!name) back("/orgs/new", "Give your organization a name.", "error");
  const slug = (await slugify(str(formData, "slug", 60) || name)) || `org-${Date.now()}`;
  const nonprofit = formData.get("is_nonprofit") === "yes";
  const { data: org, error } = await supabase
    .from("organizations")
    .insert({
      slug,
      name,
      about: str(formData, "about", 2000),
      website: url(formData, "website"),
      contact_email: opt(formData, "contact_email", 200),
      is_nonprofit: nonprofit,
      donation_links: nonprofit ? donationLinks(formData) : [],
      created_by: user.id,
    })
    .select("id, slug")
    .single();
  if (error || !org) {
    const taken = error?.code === "23505";
    back("/orgs/new", taken ? `The web address "${slug}" is taken. Try another.` : `Couldn't create it: ${error?.message ?? "unknown error"}. Has the database been set up?`, "error");
  }
  await supabase.from("event_types").insert(STARTER_TYPES.map((t) => ({ org_id: org.id, name: t.name, features: t.features })));
  redirect(`/manage/${org.slug}?ok=${encodeURIComponent("Your organization is ready. Add your first event.")}`);
}

export async function updateOrg(formData: FormData) {
  const { supabase } = await signedIn();
  const id = str(formData, "org_id", 60);
  const slug = str(formData, "org_slug", 60);
  const nonprofit = formData.get("is_nonprofit") === "yes";
  const { error } = await supabase
    .from("organizations")
    .update({
      name: str(formData, "name", 120),
      about: str(formData, "about", 2000),
      website: url(formData, "website"),
      contact_email: opt(formData, "contact_email", 200),
      is_nonprofit: nonprofit,
      donation_links: nonprofit ? donationLinks(formData) : [],
    })
    .eq("id", id);
  if (error) back(`/manage/${slug}/settings`, `Couldn't save: ${error.message}`, "error");
  revalidatePath(`/o/${slug}`);
  back(`/manage/${slug}/settings`, "Saved.");
}

export async function addTeammate(formData: FormData) {
  const { supabase } = await signedIn();
  const slug = str(formData, "org_slug", 60);
  const { data, error } = await supabase.rpc("add_org_member", {
    o: str(formData, "org_id", 60),
    member_email: str(formData, "email", 200),
    member_role: str(formData, "role", 20) || "organizer",
    member_chapter: opt(formData, "chapter_id", 60),
  });
  if (error) back(`/manage/${slug}/settings`, error.message, "error");
  if (data === "not_found") back(`/manage/${slug}/settings`, "No account with that email yet. Ask them to sign in to the portal once, then try again.", "error");
  back(`/manage/${slug}/settings`, "Teammate added.");
}

export async function removeTeammate(formData: FormData) {
  const { supabase } = await signedIn();
  const slug = str(formData, "org_slug", 60);
  await supabase.from("org_members").delete().match({ org_id: str(formData, "org_id", 60), user_id: str(formData, "user_id", 60) }).neq("role", "owner");
  back(`/manage/${slug}/settings`, "Teammate removed.");
}

// ---------- Event types ----------

export async function saveType(formData: FormData) {
  const { supabase } = await signedIn();
  const slug = str(formData, "org_slug", 60);
  const id = str(formData, "type_id", 60);
  const name = str(formData, "name", 60);
  if (!name) back(`/manage/${slug}/types`, "Give the event type a name.", "error");
  const features = formData.getAll("features").map(String).filter((f) => ALL_FEATURES.includes(f as FeatureKey));
  const row = { name, features };
  const { error } = id
    ? await supabase.from("event_types").update(row).eq("id", id)
    : await supabase.from("event_types").insert({ ...row, org_id: str(formData, "org_id", 60) });
  if (error) back(`/manage/${slug}/types`, `Couldn't save: ${error.message}`, "error");
  back(`/manage/${slug}/types`, id ? `Saved "${name}".` : `Added "${name}".`);
}

export async function deleteType(formData: FormData) {
  const { supabase } = await signedIn();
  const slug = str(formData, "org_slug", 60);
  await supabase.from("event_types").delete().eq("id", str(formData, "type_id", 60));
  back(`/manage/${slug}/types`, "Event type removed. Its events keep their details but show only the basics until you pick a new type.");
}

// ---------- Events ----------

export async function saveEvent(formData: FormData) {
  const { supabase } = await signedIn();
  const orgSlug = str(formData, "org_slug", 60);
  const orgId = str(formData, "org_id", 60);
  const id = str(formData, "event_id", 60);
  const title = str(formData, "title", 160);
  const date = str(formData, "starts_on", 10);
  const formPath = id ? `/manage/${orgSlug}/events/${id}` : `/manage/${orgSlug}/events/new`;
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) back(formPath, "Add a title and a date.", "error");
  const slug = (await slugify(str(formData, "slug", 80) || title)) || `event-${Date.now()}`;

  // Keep details for features that aren't on the form right now, so switching types never loses data.
  let details: EventDetails = {};
  if (id) {
    const { data } = await supabase.from("events").select("details").eq("id", id).single();
    details = (data?.details as EventDetails) ?? {};
  }
  const has = (k: string) => formData.has(`d_${k}`);
  const text = (k: string) => String(formData.get(`d_${k}`) ?? "");
  if (has("transit")) Object.assign(details, { transit: text("transit") || undefined, carpool: text("carpool") || undefined, rideshare: text("rideshare") || undefined });
  if (has("parking")) details.parking = parseParking(text("parking"));
  if (has("reg_body")) details.registration = { body: text("reg_body") || undefined, steps: parseList(text("reg_steps")) };
  if (has("sessions")) details.sessions = parseSessions(text("sessions"));
  if (has("speakers")) details.speakers = parseSpeakers(text("speakers"));
  if (has("meals")) details.food = { included: text("food_included") || undefined, meals: parseMeals(text("meals")) };
  if (has("tracks"))
    details.hackathon = {
      theme: text("hack_theme") || undefined,
      teamSize: text("hack_team") || undefined,
      tracks: parsePairs(text("tracks")),
      rules: parseList(text("rules")),
      judging: parseList(text("judging")),
      submissionUrl: text("submission_url") || undefined,
      resourcesUrl: text("resources_url") || undefined,
    };
  if (has("perks")) details.perks = parsePairs(text("perks")).map((p) => ({ title: p.name, body: p.body }));
  if (has("on_the_day")) details.onTheDay = parsePairs(text("on_the_day")).map((p) => ({ title: p.name, body: p.body }));

  const row = {
    org_id: orgId,
    type_id: opt(formData, "type_id", 60),
    slug,
    title,
    starts_on: date,
    time_text: str(formData, "time_text", 80),
    place: str(formData, "place", 160),
    address: opt(formData, "address", 240),
    summary: str(formData, "summary", 400),
    description: opt(formData, "description", 5000),
    price: opt(formData, "price", 60),
    register_url: url(formData, "register_url"),
    register_label: opt(formData, "register_label", 60),
    luma_event_id: opt(formData, "luma_event_id", 60),
    chapter_id: opt(formData, "chapter_id", 60),
    series_id: opt(formData, "series_id", 60),
    published: formData.get("published") === "on",
    details,
  };
  const res = id
    ? await supabase.from("events").update(row).eq("id", id).select("id").single()
    : await supabase.from("events").insert(row).select("id").single();
  if (res.error) {
    const taken = res.error.code === "23505";
    back(formPath, taken ? `Another event already uses the address "${slug}".` : `Couldn't save: ${res.error.message}`, "error");
  }
  revalidatePath("/", "layout");
  back(`/manage/${orgSlug}/events/${res.data!.id}`, id ? "Event saved." : "Event created. Fill in the sections below, then tick Published.");
}

export async function deleteEvent(formData: FormData) {
  const { supabase } = await signedIn();
  const orgSlug = str(formData, "org_slug", 60);
  if (formData.get("confirm") !== "yes") back(`/manage/${orgSlug}`, "Tick the box to confirm before removing an event.", "error");
  const { error } = await supabase.from("events").delete().eq("id", str(formData, "event_id", 60));
  if (error) back(`/manage/${orgSlug}`, `Couldn't remove it: ${error.message}`, "error");
  revalidatePath("/", "layout");
  back(`/manage/${orgSlug}`, "Event removed.");
}

/** Copies FaithTech LA's built-in events (lib/events.ts and lib/hub.ts) into the database. */
export async function importStarterEvents(formData: FormData) {
  const { supabase } = await signedIn();
  const orgId = str(formData, "org_id", 60);
  const { data: types } = await supabase.from("event_types").select("id,name").eq("org_id", orgId);
  const typeFor = (label: string) =>
    types?.find((t) => label.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(label.toLowerCase().split(" ")[0]))?.id ??
    types?.find((t) => t.name === "Conference")?.id ??
    null;
  const rows = EVENTS.map((e) => {
    const h = HUBS[e.slug] ?? hubFor(e);
    const details: EventDetails = {
      transit: h.gettingHere.transit,
      carpool: h.gettingHere.carpool,
      rideshare: h.gettingHere.rideshare,
      parking: h.gettingHere.parking,
      registration: h.registration,
      sessions: h.sessions,
      food: h.food,
      perks: h.perks,
      onTheDay: h.onTheDay,
    };
    return {
      org_id: orgId,
      type_id: typeFor(e.label),
      slug: e.slug,
      title: e.title,
      starts_on: e.date,
      time_text: e.time,
      place: e.place,
      address: e.address ?? null,
      summary: e.summary,
      description: e.description ?? null,
      price: e.price ?? null,
      register_url: e.registerUrl ?? null,
      register_label: e.registerLabel ?? null,
      luma_event_id: e.lumaEventId ?? null,
      published: true,
      details: JSON.parse(JSON.stringify(details)),
    };
  });
  const { error } = await supabase.from("events").upsert(rows, { onConflict: "org_id,slug", ignoreDuplicates: true });
  if (error) back(`/manage/${HOME_ORG_SLUG}`, `Import failed: ${error.message}`, "error");
  revalidatePath("/", "layout");
  back(`/manage/${HOME_ORG_SLUG}`, `Imported ${rows.length} events. You can now edit or remove them here.`);
}

// ---------- Add-ons and integrations ----------

export async function setAddons(formData: FormData) {
  const { supabase } = await signedIn();
  const slug = str(formData, "org_slug", 60);
  const { error } = await supabase.rpc("set_org_addons", { o: str(formData, "org_id", 60), new_addons: formData.getAll("addons").map(String) });
  if (error) back(`/manage/${slug}/addons`, error.message, "error");
  revalidatePath("/", "layout");
  back(`/manage/${slug}/addons`, "Add-ons updated.");
}

export async function saveLumaKey(formData: FormData) {
  const { supabase } = await signedIn();
  const slug = str(formData, "org_slug", 60);
  const key = str(formData, "luma_api_key", 200);
  const { error } = await supabase.from("org_secrets").update({ luma_api_key: key || null }).eq("org_id", str(formData, "org_id", 60));
  if (error) back(`/manage/${slug}/integrations`, error.message, "error");
  back(`/manage/${slug}/integrations`, key ? "Luma key saved." : "Luma key removed.");
}

export async function newWebhookSecret(formData: FormData) {
  const { supabase } = await signedIn();
  const slug = str(formData, "org_slug", 60);
  await supabase.from("org_secrets").update({ webhook_secret: randomUUID().replace(/-/g, "") }).eq("org_id", str(formData, "org_id", 60));
  back(`/manage/${slug}/integrations`, "New webhook address made. Update it in any app that was using the old one.");
}

/** Pulls guests from Luma into each event that has a Luma event id. */
export async function syncLuma(formData: FormData) {
  const { supabase } = await signedIn();
  const slug = str(formData, "org_slug", 60);
  const orgId = str(formData, "org_id", 60);
  const { data: secret } = await supabase.from("org_secrets").select("luma_api_key").eq("org_id", orgId).single();
  if (!secret?.luma_api_key) back(`/manage/${slug}/integrations`, "Add your Luma API key first.", "error");
  const { data: events } = await supabase.from("events").select("id,title,luma_event_id").eq("org_id", orgId).not("luma_event_id", "is", null);
  let total = 0;
  const failed: string[] = [];
  for (const e of events ?? []) {
    const guests = await lumaGuests(secret!.luma_api_key!, e.luma_event_id!);
    if (!guests) {
      failed.push(e.title);
      continue;
    }
    if (guests.length) {
      await supabase.from("event_registrations").upsert(
        guests.map((g) => ({ event_id: e.id, name: g.name, email: g.email, status: g.status, checked_in: g.checkedIn, source: "luma" })),
        { onConflict: "event_id,email" },
      );
    }
    total += guests.length;
  }
  revalidatePath(`/manage/${slug}/reports`);
  if (!events?.length) back(`/manage/${slug}/integrations`, "None of your events has a Luma event id yet. Add one on the event's page.", "error");
  back(`/manage/${slug}/integrations`, `Synced ${total} guests from Luma.${failed.length ? ` Couldn't reach Luma for: ${failed.join(", ")}.` : ""}`, failed.length ? "error" : "ok");
}

export async function addRegistration(formData: FormData) {
  const { supabase } = await signedIn();
  const slug = str(formData, "org_slug", 60);
  const eventId = str(formData, "event_id", 60);
  const page = `/manage/${slug}/reports/${eventId}`;
  const email = str(formData, "email", 200).toLowerCase();
  if (!email.includes("@")) back(page, "Enter an email address.", "error");
  const { error } = await supabase.from("event_registrations").upsert(
    { event_id: eventId, name: opt(formData, "name", 120), email, status: "going", source: "manual" },
    { onConflict: "event_id,email" },
  );
  if (error) back(page, error.message, "error");
  back(page, "Added.");
}

export async function toggleCheckIn(formData: FormData) {
  const { supabase } = await signedIn();
  await supabase.from("event_registrations").update({ checked_in: formData.get("checked_in") === "true" }).eq("id", str(formData, "id", 60));
  revalidatePath(`/manage/${str(formData, "org_slug", 60)}/reports`, "layout");
}

// ---------- Templates: copy an event to a new date ----------

export async function copyEvent(formData: FormData) {
  const { supabase } = await signedIn();
  const orgSlug = str(formData, "org_slug", 60);
  const id = str(formData, "event_id", 60);
  const date = str(formData, "starts_on", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) back(`/manage/${orgSlug}/events/${id}`, "Pick a date for the copy.", "error");
  const { data: src } = await supabase.from("events").select("*").eq("id", id).single();
  if (!src) back(`/manage/${orgSlug}`, "Couldn't find that event.", "error");
  const { id: _id, created_at: _c, ...rest } = src;
  const title = str(formData, "title", 160) || src.title;
  const base = (await slugify(`${title}-${date}`)).slice(0, 80);
  const res = await supabase.from("events").insert({ ...rest, title, slug: base, starts_on: date, published: false }).select("id").single();
  if (res.error) back(`/manage/${orgSlug}/events/${id}`, res.error.code === "23505" ? "There's already a copy on that date." : `Couldn't copy: ${res.error.message}`, "error");
  if (formData.get("copy_plan") === "on") {
    const { data: items } = await supabase.from("plan_items").select("tool,position,data").eq("event_id", id).in("tool", ["tasks", "budget", "promotion", "shopping"]);
    if (items?.length) {
      await supabase.from("plan_items").insert(
        items.map((it) => {
          const d = { ...(it.data as Record<string, unknown>) };
          if (it.tool === "tasks") Object.assign(d, { status: "Not started", due: undefined });
          if (it.tool === "promotion") Object.assign(d, { status: "Planned", date: undefined, post_url: undefined });
          if (it.tool === "shopping") Object.assign(d, { bought: false, actual: undefined });
          if (it.tool === "budget") Object.assign(d, { actual: undefined });
          return { event_id: res.data!.id, tool: it.tool, position: it.position, data: JSON.parse(JSON.stringify(d)) };
        }),
      );
    }
  }
  back(`/manage/${orgSlug}/events/${res.data!.id}`, "Copied as a draft. Check the details, then tick Published.");
}

// ---------- Chapters ----------

export async function saveChapter(formData: FormData) {
  const { supabase } = await signedIn();
  const orgSlug = str(formData, "org_slug", 60);
  const id = str(formData, "chapter_id", 60);
  const name = str(formData, "name", 80);
  if (!name) back(`/manage/${orgSlug}/chapters`, "Give the chapter a name.", "error");
  const row = { name, city: str(formData, "city", 80), slug: (await slugify(str(formData, "slug", 60) || name)) || `chapter-${Date.now()}` };
  const { error } = id
    ? await supabase.from("chapters").update(row).eq("id", id)
    : await supabase.from("chapters").insert({ ...row, org_id: str(formData, "org_id", 60) });
  if (error) back(`/manage/${orgSlug}/chapters`, error.code === "23505" ? "Another chapter uses that web address." : `Couldn't save: ${error.message}`, "error");
  revalidatePath(`/o/${orgSlug}`, "layout");
  back(`/manage/${orgSlug}/chapters`, id ? "Chapter saved." : `Added ${name}. Add its team under Settings and team.`);
}

export async function deleteChapter(formData: FormData) {
  const { supabase } = await signedIn();
  const orgSlug = str(formData, "org_slug", 60);
  await supabase.from("chapters").delete().eq("id", str(formData, "chapter_id", 60));
  back(`/manage/${orgSlug}/chapters`, "Chapter removed. Its events and teammates now belong to the whole organization.");
}

// ---------- Series ----------

export async function saveSeries(formData: FormData) {
  const { supabase } = await signedIn();
  const orgSlug = str(formData, "org_slug", 60);
  const id = str(formData, "series_id", 60);
  const name = str(formData, "name", 120);
  if (!name) back(`/manage/${orgSlug}/series`, "Give the series a name.", "error");
  const row = {
    name,
    description: str(formData, "description", 2000),
    chapter_id: opt(formData, "chapter_id", 60),
    slug: (await slugify(str(formData, "slug", 60) || name)) || `series-${Date.now()}`,
  };
  const { error } = id
    ? await supabase.from("series").update(row).eq("id", id)
    : await supabase.from("series").insert({ ...row, org_id: str(formData, "org_id", 60) });
  if (error) back(`/manage/${orgSlug}/series`, error.code === "23505" ? "Another series uses that web address." : `Couldn't save: ${error.message}`, "error");
  revalidatePath(`/o/${orgSlug}`, "layout");
  back(`/manage/${orgSlug}/series`, id ? "Series saved." : `Added ${name}. Pick it on each event that belongs to it.`);
}

export async function deleteSeries(formData: FormData) {
  const { supabase } = await signedIn();
  const orgSlug = str(formData, "org_slug", 60);
  await supabase.from("series").delete().eq("id", str(formData, "series_id", 60));
  back(`/manage/${orgSlug}/series`, "Series removed. Its events are kept.");
}

// ---------- Resource library ----------

export async function saveResource(formData: FormData) {
  const { supabase } = await signedIn();
  const orgSlug = str(formData, "org_slug", 60);
  const id = str(formData, "resource_id", 60);
  const title = str(formData, "title", 160);
  const link = url(formData, "url");
  if (!title || !link) back(`/manage/${orgSlug}/resources`, "Add a title and a link.", "error");
  const kinds = ["slides", "recording", "link", "doc", "code"];
  const kind = str(formData, "kind", 20);
  const row = {
    title,
    url: link,
    kind: kinds.includes(kind) ? kind : "link",
    topic: str(formData, "topic", 60) || "General",
    description: str(formData, "description", 600),
    event_id: opt(formData, "event_id", 60),
    series_id: opt(formData, "series_id", 60),
    published: formData.get("published") !== "off",
  };
  const { error } = id
    ? await supabase.from("resources").update(row).eq("id", id)
    : await supabase.from("resources").insert({ ...row, org_id: str(formData, "org_id", 60) });
  if (error) back(`/manage/${orgSlug}/resources`, `Couldn't save: ${error.message}`, "error");
  revalidatePath(`/o/${orgSlug}`, "layout");
  back(`/manage/${orgSlug}/resources`, id ? "Saved." : `Added "${title}".`);
}

export async function deleteResource(formData: FormData) {
  const { supabase } = await signedIn();
  const orgSlug = str(formData, "org_slug", 60);
  await supabase.from("resources").delete().eq("id", str(formData, "resource_id", 60));
  revalidatePath(`/o/${orgSlug}`, "layout");
  back(`/manage/${orgSlug}/resources`, "Removed.");
}

// ---------- Event planning ----------

const planPath = (org: string, eventId: string, tool: string) => `/manage/${org}/events/${eventId}/plan?tool=${tool}`;

function planData(formData: FormData, tool: PlanTool) {
  const data: Record<string, string | boolean> = {};
  for (const f of tool.fields) {
    const raw = formData.get(`f_${f.key}`);
    if (f.type === "check") {
      data[f.key] = raw === "on";
      continue;
    }
    let v = String(raw ?? "").trim().slice(0, f.type === "long" ? 2000 : 300);
    if (f.type === "select" && v && f.options && !f.options.includes(v)) v = "";
    if (f.type === "url" && v && !/^https?:\/\//i.test(v)) v = `https://${v}`;
    if (v) data[f.key] = v;
  }
  // Shopping: work out the estimated total from quantity and price when it's left empty.
  if (tool.key === "shopping" && !data.total && data.qty && data.price) {
    data.total = (money(data.qty) * money(data.price)).toFixed(2);
  }
  return data;
}

export async function savePlanItem(formData: FormData) {
  const { user, supabase } = await signedIn();
  const org = str(formData, "org_slug", 60);
  const eventId = str(formData, "event_id", 60);
  const tool = planTool(str(formData, "tool", 20));
  if (!tool) back(`/manage/${org}`, "Unknown planning tool.", "error");
  const id = str(formData, "item_id", 60);
  const data = planData(formData, tool);
  const row = { data, updated_by: user.id, updated_at: new Date().toISOString() };
  const { error } = id
    ? await supabase.from("plan_items").update(row).eq("id", id)
    : await supabase.from("plan_items").insert({ ...row, event_id: eventId, tool: tool.key, position: Date.now() % 2_000_000_000 });
  if (error) back(planPath(org, eventId, tool.key), `Couldn't save: ${error.message}`, "error");
  revalidatePath(`/manage/${org}/events/${eventId}/plan`);
  if (!id) back(planPath(org, eventId, tool.key), "Added.");
}

export async function deletePlanItem(formData: FormData) {
  const { supabase } = await signedIn();
  const org = str(formData, "org_slug", 60);
  const eventId = str(formData, "event_id", 60);
  await supabase.from("plan_items").delete().eq("id", str(formData, "item_id", 60));
  revalidatePath(`/manage/${org}/events/${eventId}/plan`);
}

export async function addStarterRows(formData: FormData) {
  const { user, supabase } = await signedIn();
  const org = str(formData, "org_slug", 60);
  const eventId = str(formData, "event_id", 60);
  const tool = planTool(str(formData, "tool", 20));
  if (!tool?.starter) back(`/manage/${org}`, "That tool has no starter rows.", "error");
  const base = Date.now() % 1_000_000_000;
  const { error } = await supabase
    .from("plan_items")
    .insert(tool.starter.map((data, i) => ({ event_id: eventId, tool: tool.key, position: base + i, data, updated_by: user.id })));
  if (error) back(planPath(org, eventId, tool.key), `Couldn't add them: ${error.message}`, "error");
  back(planPath(org, eventId, tool.key), `Added ${tool.starter.length} starter rows. Edit or remove any you don't need.`);
}

/** Owners and admins choose which planning tools an event uses. */
export async function setPlanningTools(formData: FormData) {
  const { user, supabase } = await signedIn();
  const org = str(formData, "org_slug", 60);
  const eventId = str(formData, "event_id", 60);
  const { data: me } = await supabase.from("org_members").select("role").eq("org_id", str(formData, "org_id", 60)).eq("user_id", user.id).maybeSingle();
  if (!me || !["owner", "admin"].includes(me.role)) back(planPath(org, eventId, "tasks"), "Only owners and admins can change which tools this event uses.", "error");
  const tools = formData.getAll("tools").map(String).filter((t) => PLAN_TOOLS.some((p) => p.key === t));
  const { error } = await supabase.from("events").update({ planning_tools: tools }).eq("id", eventId);
  if (error) back(planPath(org, eventId, "tasks"), error.message, "error");
  back(`/manage/${org}/events/${eventId}/plan?tool=${tools[0] ?? "tasks"}`, "Planning tools updated.");
}

// ---------- Theme ----------

export async function saveTheme(formData: FormData) {
  const { supabase } = await signedIn();
  const slug = str(formData, "org_slug", 60);
  const { data: org } = await supabase.from("organizations").select("addons").eq("id", str(formData, "org_id", 60)).single();
  const custom = (org?.addons as string[] | undefined)?.includes("custom_branding");
  const theme: Theme = {
    preset: PRESETS.some((p) => p.key === str(formData, "preset", 20)) ? str(formData, "preset", 20) : undefined,
    accent: hex(str(formData, "accent", 7)),
  };
  if (custom && str(formData, "accent", 7) === "custom") theme.accent = hex(str(formData, "accent_custom", 7));
  if (custom) {
    for (const k of ["bg", "surface", "fg", "link"] as const) if (formData.get(`use_${k}`) === "on") theme[k] = hex(str(formData, k, 7));
    const font = str(formData, "font", 40);
    if (FONTS.includes(font)) theme.font = font;
    const logo = url(formData, "logo");
    if (logo) theme.logo = logo;
    const css = String(formData.get("css") ?? "").slice(0, 8000).trim();
    if (css) theme.css = css;
  }
  const { error } = await supabase.from("organizations").update({ theme: JSON.parse(JSON.stringify(theme)) }).eq("id", str(formData, "org_id", 60));
  if (error) back(`/manage/${slug}/theme`, `Couldn't save: ${error.message}`, "error");
  revalidatePath("/", "layout");
  back(`/manage/${slug}/theme`, "Theme saved. Open your public page to see it.");
}
