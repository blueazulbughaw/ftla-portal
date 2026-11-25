import Notice from "@/components/hub/Notice";
import { setAddons } from "@/app/manage/actions";
import { manageContext } from "@/lib/manage";
import { ADDONS, BASIC_PLAN } from "@/lib/features";

export default async function Addons({ params, searchParams }: { params: Promise<{ org: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ org: slug }, { ok, error }] = await Promise.all([params, searchParams]);
  const { org, siteAdmin, hasAddon } = await manageContext(slug);
  return (
    <form action={setAddons} className="block">
      <input type="hidden" name="org_slug" value={org.slug} />
      <input type="hidden" name="org_id" value={org.id} />
      <h2 className="h3">Add-ons</h2>
      <p className="soft small">{BASIC_PLAN} Online payment isn&apos;t connected yet, so a site admin switches add-ons on for now.</p>
      <Notice ok={ok} error={error} />
      <div className="grid">
        {ADDONS.map((a) => (
          <label key={a.key} className="card addon">
            <span className="row">
              <input type="checkbox" name="addons" value={a.key} defaultChecked={hasAddon(a.key)} disabled={!siteAdmin} />
              <strong>{a.label}</strong>
              <span className={`pill ${hasAddon(a.key) ? "" : "soon"}`}>{hasAddon(a.key) ? "On" : "Off"}</span>
            </span>
            <span className="soft small">{a.body}</span>
          </label>
        ))}
      </div>
      {siteAdmin ? (
        <p><button className="btn">Save add-ons</button></p>
      ) : (
        <p className="soft small">Want one switched on? Email the FaithTech LA team and we&apos;ll set it up.</p>
      )}
    </form>
  );
}
