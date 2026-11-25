import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, getUser, isAdminEmail, supabaseConfigured } from "./supabase/server";
import { HUB_EVENT_COOKIE } from "./hub";
import { allEvents, eventHref, upcoming, type FullEvent } from "./data";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  contact_email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  meal_prefs: string[];
  roles: string[];
  share_token: string;
  share_name: boolean;
  share_photo: boolean;
  share_email: boolean;
  share_phone: boolean;
  share_linkedin: boolean;
  share_website: boolean;
  in_directory?: boolean;
  headline?: string | null;
  skills?: string[];
  interests?: string[];
};

/**
 * Everything a hub page needs: who is signed in, their profile, and which event the hub is showing.
 * Sends people to the sign-in page if they aren't signed in.
 */
export async function hubContext(nextPath = "/hub") {
  if (!supabaseConfigured()) redirect("/login");
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  const supabase = await createClient();
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const chosenKey = (await cookies()).get(HUB_EVENT_COOKIE)?.value;
  const hubEvents = await hubEventList();
  const full = hubEvents.find((e) => e.key === chosenKey) ?? upcoming(hubEvents)[0] ?? hubEvents[0];
  // No event has the attendee hub switched on yet.
  if (!full) redirect("/?error=" + encodeURIComponent("No event has the attendee hub turned on yet."));
  const roles: string[] = (profile as Profile | null)?.roles ?? ["attendee"];
  const isAdmin = roles.includes("admin") || isAdminEmail(user.email);
  // Site organizers, or the team of the organization running this event.
  let orgTeam = false;
  if (full.org.id) {
    const { data: m } = await supabase.from("org_members").select("role").eq("org_id", full.org.id).eq("user_id", user.id).maybeSingle();
    orgTeam = Boolean(m);
  }
  const isStaff = isAdmin || roles.includes("organizer") || orgTeam;
  return {
    supabase,
    user,
    profile: profile as Profile | null,
    /** True when the database tables from supabase/schema.sql haven't been created yet. */
    needsSetup: Boolean(error) || !profile,
    full,
    hubEvents,
    /** Saved schedules and announcements are stored under this id. */
    eventKey: full.key,
    event: full.event,
    hub: full.hub,
    features: full.features,
    publicHref: eventHref(full),
    roles,
    isAdmin,
    isStaff,
  };
}

export function displayName(p: Profile | null, email?: string | null): string {
  return p?.display_name || email?.split("@")[0] || "Friend";
}

/** Events that have the participant hub switched on, newest upcoming first. */
export async function hubEventList(): Promise<FullEvent[]> {
  const list = (await allEvents()).filter((e) => e.hubEnabled);
  const up = upcoming(list);
  const rest = list.filter((e) => !up.includes(e)).sort((a, b) => b.event.date.localeCompare(a.event.date));
  return [...up, ...rest];
}
