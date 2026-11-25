import Link from "next/link";
import { redirect } from "next/navigation";
import Notice from "@/components/hub/Notice";
import { myOrgs } from "@/lib/data";
import { getUser, supabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Manage events" };
export const dynamic = "force-dynamic";

export default async function ManageHome({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!supabaseConfigured()) redirect("/login");
  if (!(await getUser())) redirect("/login?next=/manage");
  const orgs = await myOrgs();
  if (orgs.length === 1 && !error) redirect(`/manage/${orgs[0].slug}`);
  return (
    <div className="manage">
      <div className="block">
        <p className="label">Admin</p>
        <h1 className="h2">Your organizations</h1>
        <Notice error={error} />
        {orgs.length === 0 && <p className="soft">You&apos;re not on an organization&apos;s team yet. Start one, or ask an organization&apos;s owner to add you.</p>}
        <div className="grid">
          {orgs.map((o) => (
            <Link key={o.id} href={`/manage/${o.slug}`} className="card">
              <strong>{o.name}</strong>
              <span className="soft small">Your role: {o.my_role}</span>
            </Link>
          ))}
        </div>
        <p><Link href="/manage/new" className="btn">Start an organization</Link></p>
      </div>
    </div>
  );
}
