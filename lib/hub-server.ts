import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, getUser, isAdminEmail, supabaseConfigured } from "./supabase/server";
import { HUB_EVENT_COOKIE, hubFor, pickHubEvent } from "./hub";

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
  const slug = (await cookies()).get(HUB_EVENT_COOKIE)?.value;
  const event = pickHubEvent(slug);
  const roles: string[] = (profile as Profile | null)?.roles ?? ["attendee"];
  const isAdmin = roles.includes("admin") || isAdminEmail(user.email);
  const isStaff = isAdmin || roles.includes("organizer");
  return {
    supabase,
    user,
    profile: profile as Profile | null,
    /** True when the database tables from supabase/schema.sql haven't been created yet. */
    needsSetup: Boolean(error) || !profile,
    event,
    hub: hubFor(event),
    roles,
    isAdmin,
    isStaff,
  };
}

export function displayName(p: Profile | null, email?: string | null): string {
  return p?.display_name || email?.split("@")[0] || "Friend";
}
