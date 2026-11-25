"use server";

// Everything the hub saves goes through these server actions.
// Each one checks who is signed in, then writes to Supabase. The database rules in
// supabase/schema.sql stop anyone from changing data that isn't theirs.

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { HUB_EVENT_COOKIE, MEAL_OPTIONS } from "@/lib/hub";
import { findEvent } from "@/lib/data";

async function signedIn() {
  const user = await getUser();
  if (!user) redirect("/login?next=/hub");
  return { user, supabase: await createClient() };
}

function back(path: string, message: string, kind: "ok" | "error" = "ok"): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(message)}`);
}

/** Sidebar event picker. */
export async function setHubEvent(formData: FormData) {
  const slug = String(formData.get("event") || "");
  if (await findEvent(slug)) {
    (await cookies()).set(HUB_EVENT_COOKIE, slug, { path: "/", maxAge: 60 * 60 * 24 * 180, sameSite: "lax" });
  }
  revalidatePath("/hub", "layout");
}

/** Add or remove a session from My schedule. */
export async function toggleSession(eventSlug: string, sessionId: string, save: boolean) {
  const { user, supabase } = await signedIn();
  if (save) {
    await supabase.from("saved_sessions").upsert({ user_id: user.id, event_slug: eventSlug, session_id: sessionId });
  } else {
    await supabase.from("saved_sessions").delete().match({ user_id: user.id, event_slug: eventSlug, session_id: sessionId });
  }
  revalidatePath("/hub", "layout");
}

export async function saveMealPrefs(formData: FormData) {
  const { user, supabase } = await signedIn();
  const prefs = formData.getAll("meal").map(String).filter((m) => MEAL_OPTIONS.includes(m));
  const { error } = await supabase.from("profiles").update({ meal_prefs: prefs }).eq("id", user.id);
  if (error) back("/hub/experience/food", "Couldn't save. Has the database been set up?", "error");
  revalidatePath("/hub", "layout");
  back("/hub/experience/food", "Meal preferences saved.");
}

const clean = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").trim().slice(0, max) || null;
const cleanUrl = (v: FormDataEntryValue | null) => {
  const s = clean(v, 300);
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

/** "React, UX , react" -> ["React", "UX"] */
const tags = (v: FormDataEntryValue | null) => {
  const seen = new Set<string>();
  return String(v ?? "")
    .split(",")
    .map((t) => t.trim().slice(0, 40))
    .filter((t) => t && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()))
    .slice(0, 15);
};

export async function saveProfile(formData: FormData) {
  const { user, supabase } = await signedIn();
  const update: Record<string, unknown> = {
    display_name: clean(formData.get("display_name"), 80),
    contact_email: clean(formData.get("contact_email"), 120),
    phone: clean(formData.get("phone"), 40),
    linkedin_url: cleanUrl(formData.get("linkedin_url")),
    website_url: cleanUrl(formData.get("website_url")),
    share_name: formData.get("share_name") === "on",
    share_photo: formData.get("share_photo") === "on",
    share_email: formData.get("share_email") === "on",
    share_phone: formData.get("share_phone") === "on",
    share_linkedin: formData.get("share_linkedin") === "on",
    share_website: formData.get("share_website") === "on",
    in_directory: formData.get("in_directory") === "on",
    headline: clean(formData.get("headline"), 120),
    skills: tags(formData.get("skills")),
    interests: tags(formData.get("interests")),
  };

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 5 * 1024 * 1024) back("/hub/profile", "That photo is over 5 MB.", "error");
    if (!photo.type.startsWith("image/")) back("/hub/profile", "Choose an image file for your photo.", "error");
    const path = `${user.id}/avatar-${Date.now()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, photo, { contentType: photo.type, upsert: true });
    if (error) back("/hub/profile", `Photo didn't upload: ${error.message}`, "error");
    update.avatar_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) back("/hub/profile", "Couldn't save. Has the database been set up?", "error");
  revalidatePath("/hub", "layout");
  back("/hub/profile", "Profile saved.");
}

/** Save someone from their share card into My contacts. */
export async function saveContact(formData: FormData) {
  const token = String(formData.get("token") || "");
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/c/${token}`)}`);
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_share_card", { token });
  const card = Array.isArray(data) ? data[0] : null;
  if (!card || card.id === user.id) redirect("/hub/contacts");
  await supabase.from("contacts").upsert({ owner_id: user.id, contact_id: card.id });
  revalidatePath("/hub/contacts");
  redirect("/hub/contacts?ok=" + encodeURIComponent("Contact saved."));
}

export async function removeContact(formData: FormData) {
  const { user, supabase } = await signedIn();
  await supabase.from("contacts").delete().match({ owner_id: user.id, contact_id: String(formData.get("id")) });
  revalidatePath("/hub/contacts");
}

export async function dismissAnnouncement(formData: FormData) {
  const { user, supabase } = await signedIn();
  await supabase.from("announcement_dismissals").upsert({ user_id: user.id, announcement_id: String(formData.get("id")) });
  revalidatePath("/hub");
}

// ---------- Admin ----------

export async function publishAnnouncement(formData: FormData) {
  const { user, supabase } = await signedIn();
  const id = clean(formData.get("id"), 60);
  const title = clean(formData.get("title"), 140);
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  const eventSlug = String(formData.get("event_slug") || "");
  if (!title) back("/hub/admin", "Add a title for the announcement.", "error");
  let publishAt = new Date().toISOString();
  if (formData.get("when") === "later") {
    // The form sends Los Angeles local time, like 2026-12-12T09:00.
    const local = String(formData.get("publish_at") || "");
    if (!local) back("/hub/admin", "Pick a date and time, or choose Show immediately.", "error");
    publishAt = laLocalToIso(local);
  }
  const row = { title, body, event_slug: eventSlug, publish_at: publishAt };
  const { error } = id
    ? await supabase.from("announcements").update(row).eq("id", id)
    : await supabase.from("announcements").insert({ ...row, created_by: user.id, active: true });
  if (error) back("/hub/admin", `Couldn't save: ${error.message}`, "error");
  revalidatePath("/hub", "layout");
  back("/hub/admin", id ? "Announcement updated." : "Announcement published.");
}

export async function setAnnouncementState(formData: FormData) {
  const { supabase } = await signedIn();
  const id = String(formData.get("id"));
  const op = String(formData.get("op"));
  const patch = op === "archive" ? { archived: true } : { active: op === "activate" };
  await supabase.from("announcements").update(patch).eq("id", id);
  revalidatePath("/hub", "layout");
}

export async function setRoles(userId: string, roles: string[]) {
  const { supabase } = await signedIn();
  const allowed = roles.filter((r) => ["volunteer", "speaker", "organizer", "admin"].includes(r));
  const { error } = await supabase.rpc("set_user_roles", { target: userId, new_roles: allowed });
  revalidatePath("/hub/admin");
  return error ? error.message : null;
}

/** "2026-12-12T09:00" in Los Angeles time -> an ISO timestamp. */
function laLocalToIso(local: string): string {
  const asUtc = new Date(`${local}:00Z`);
  const laHour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hourCycle: "h23" }).format(asUtc),
  );
  let offset = asUtc.getUTCHours() - laHour;
  if (offset < 0) offset += 24;
  return new Date(asUtc.getTime() + offset * 3600_000).toISOString();
}
