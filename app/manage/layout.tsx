import ManageSidebar from "@/components/manage/ManageSidebar";
import { myOrgs } from "@/lib/data";
import { ensureBuiltinsCopied } from "@/lib/builtins";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The admin: a sidebar on the left (like the attendee hub), the page on the right.
export default async function AdminShell({ children }: { children: React.ReactNode }) {
  const orgs = await myOrgs();
  let events: { id: string; org: string; title: string; starts_on: string }[] = [];
  if (supabaseConfigured() && orgs.length) {
    const supabase = await createClient();
    for (const o of orgs) if (o.builtins_imported === false) await ensureBuiltinsCopied(supabase, o);
    const { data } = await supabase.from("events").select("id,org_id,title,starts_on").in("org_id", orgs.map((o) => o.id)).order("starts_on", { ascending: false });
    const slugOf = new Map(orgs.map((o) => [o.id, o.slug]));
    events = (data ?? []).map((e) => ({ id: e.id as string, org: slugOf.get(e.org_id as string) ?? "", title: e.title as string, starts_on: e.starts_on as string }));
  }
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
  return (
    <div className="hub admin-shell">
      <ManageSidebar
        orgs={orgs.map((o) => ({ slug: o.slug, name: o.name, role: o.my_role, reporting: o.addons.includes("reporting") }))}
        events={events}
        today={today}
      />
      <div className="hub-main admin-main">{children}</div>
    </div>
  );
}
