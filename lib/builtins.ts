// ============================================================
// FaithTech LA's built-in events (lib/events.ts and lib/hub.ts) are copied into the
// database the first time a team member opens the admin, so they become ordinary
// events that can be edited, unpublished or removed like any other.
// ============================================================

import { createClient } from "./supabase/server";
import { EVENTS } from "./events";
import { HUBS, hubFor } from "./hub";
import { HOME_ORG_SLUG, type EventDetails } from "./data";

type Client = Awaited<ReturnType<typeof createClient>>;

/** Copies every built-in event into the home organization. Events already there are left alone. */
export async function copyBuiltins(supabase: Client, orgId: string): Promise<{ count: number; error?: string }> {
  const { data: types } = await supabase.from("event_types").select("id,name").eq("org_id", orgId);
  const typeFor = (label: string) =>
    types?.find((t) => label.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(label.toLowerCase().split(" ")[0]))?.id ??
    types?.find((t) => t.name === "Conference")?.id ??
    null;
  const rows = EVENTS.map((e) => {
    const h = HUBS[e.slug] ?? hubFor(e);
    // Everything the DevFest-style page shows, so nothing is lost in the copy.
    const details: EventDetails = {
      transit: h.gettingHere.transit,
      carpool: h.gettingHere.carpool,
      rideshare: h.gettingHere.rideshare,
      parking: h.gettingHere.parking,
      registration: h.registration,
      sessions: h.sessions,
      sessionKinds: h.sessionKinds,
      speakers: h.speakers,
      wifi: h.wifi,
      survey: h.survey,
      food: h.food,
      perks: h.perks,
      hackathon: h.hackathon,
      onTheDay: h.onTheDay,
      artifacts: e.artifacts,
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
      hub_enabled: true,
      details: JSON.parse(JSON.stringify(details)),
    };
  });
  const { error } = await supabase.from("events").upsert(rows, { onConflict: "org_id,slug", ignoreDuplicates: true });
  if (error) return { count: 0, error: error.message };
  await supabase.rpc("mark_builtins_imported", { o: orgId });
  return { count: rows.length };
}

/** Runs the copy once, the first time FaithTech LA's admin is opened after setup. */
export async function ensureBuiltinsCopied(supabase: Client, org: { id: string; slug: string; builtins_imported?: boolean }) {
  if (org.slug !== HOME_ORG_SLUG || org.builtins_imported !== false) return;
  await copyBuiltins(supabase, org.id);
}
