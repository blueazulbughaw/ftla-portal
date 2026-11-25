import { notFound, redirect } from "next/navigation";
import { createClient, getUser, supabaseConfigured } from "./supabase/server";
import type { Org } from "./data";

/** Loads an organization for its management pages. Only its team gets in. */
export async function manageContext(orgSlug: string) {
  if (!supabaseConfigured()) redirect("/login");
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/manage/${orgSlug}`)}`);
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("*").eq("slug", orgSlug).maybeSingle();
  if (!org) notFound();
  const { data: me } = await supabase.from("org_members").select("role").eq("org_id", org.id).eq("user_id", user.id).maybeSingle();
  const { data: profile } = await supabase.from("profiles").select("roles").eq("id", user.id).maybeSingle();
  const siteAdmin = ((profile?.roles as string[] | undefined) ?? []).includes("admin");
  if (!me) redirect(`/manage?error=${encodeURIComponent("You're not on that organization's team.")}`);
  const role = me.role as string;
  return {
    user,
    supabase,
    org: org as Org,
    role,
    isOrgAdmin: role === "owner" || role === "admin",
    siteAdmin,
    hasAddon: (a: string) => (org as Org).addons.includes(a),
  };
}

type Client = Awaited<ReturnType<typeof createClient>>;
export type Named = { id: string; name: string };

/** An organization's chapters and series, for the pickers on the event and resource forms. */
export async function orgLists(supabase: Client, orgId: string) {
  const [{ data: chapters }, { data: series }] = await Promise.all([
    supabase.from("chapters").select("id,name,city,slug").eq("org_id", orgId).order("name"),
    supabase.from("series").select("id,name,slug,description,chapter_id").eq("org_id", orgId).order("name"),
  ]);
  return {
    chapters: (chapters ?? []) as (Named & { city: string; slug: string })[],
    series: (series ?? []) as (Named & { slug: string; description: string; chapter_id: string | null })[],
  };
}
