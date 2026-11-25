import DonationFields from "@/components/DonationFields";
import Notice from "@/components/hub/Notice";
import { updateOrg } from "@/app/manage/actions";
import { manageContext } from "@/lib/manage";

export const metadata = { title: "Organization details" };

export default async function Settings({ params, searchParams }: { params: Promise<{ org: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ org: slug }, { ok, error }] = await Promise.all([params, searchParams]);
  const { org, isOrgAdmin } = await manageContext(slug);
  const hidden = (
    <>
      <input type="hidden" name="org_slug" value={org.slug} />
      <input type="hidden" name="org_id" value={org.id} />
    </>
  );
  return (
    <div className="grid2">
      <Notice ok={ok} error={error} />
      <form action={updateOrg} className="block form">
        {hidden}
        <h2 className="h3">Organization details</h2>
        {!isOrgAdmin && <p className="notice">Only owners and admins can change these.</p>}
        <label>Name<input name="name" required maxLength={120} defaultValue={org.name} /></label>
        <label>About<textarea name="about" rows={3} maxLength={2000} defaultValue={org.about} /></label>
        <label>Website<input name="website" defaultValue={org.website ?? ""} /></label>
        <label>Contact email<input name="contact_email" type="email" defaultValue={org.contact_email ?? ""} /></label>
        <DonationFields isNonprofit={org.is_nonprofit} links={org.donation_links} />
        <p><button className="btn" disabled={!isOrgAdmin}>Save</button></p>
      </form>

    </div>
  );
}
