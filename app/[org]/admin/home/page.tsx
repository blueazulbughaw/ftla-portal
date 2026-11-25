import Link from "next/link";
import Notice from "@/components/hub/Notice";
import HomeEditor from "@/components/manage/HomeEditor";
import { resetHome, saveHome } from "@/app/manage/actions";
import { manageContext } from "@/lib/manage";
import { homeSections } from "@/lib/home";

export const metadata = { title: "Homepage" };

export default async function HomePageEditor({ params, searchParams }: { params: Promise<{ org: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ org: slug }, { ok, error }] = await Promise.all([params, searchParams]);
  const { org } = await manageContext(slug);
  return (
    <div className="block">
      <div className="card-head">
        <div>
          <h2 className="h3">Homepage</h2>
          <p className="soft small">Build your page at <Link href={`/${org.slug}`}>/{org.slug}</Link> from sections. Move them up or down, hide them, or add your own HTML.</p>
        </div>
        <Link href={`/${org.slug}`} className="btn ghost small">View homepage</Link>
      </div>
      <Notice ok={ok} error={error} />
      <form action={saveHome} className="form">
        <input type="hidden" name="org_id" value={org.id} />
        <input type="hidden" name="org_slug" value={org.slug} />
        <HomeEditor initial={homeSections(org)} orgSlug={org.slug} />
        <div className="row sticky-save"><button className="btn">Save homepage</button></div>
      </form>
      <form action={resetHome} className="row">
        <input type="hidden" name="org_id" value={org.id} />
        <input type="hidden" name="org_slug" value={org.slug} />
        <details className="danger">
          <summary>Start over</summary>
          <label className="inline small"><input type="checkbox" name="confirm" value="yes" required /> Yes, put back the starter homepage</label>
          <button className="btn ghost small">Start over</button>
        </details>
      </form>
    </div>
  );
}
