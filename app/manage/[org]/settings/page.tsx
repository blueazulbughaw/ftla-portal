import DonationFields from "@/components/DonationFields";
import Notice from "@/components/hub/Notice";
import { addTeammate, removeTeammate, updateOrg } from "@/app/manage/actions";
import { manageContext, orgLists } from "@/lib/manage";

type Member = { user_id: string; role: string; display_name: string | null; email: string | null; chapter_id: string | null };

export default async function Settings({ params, searchParams }: { params: Promise<{ org: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ org: slug }, { ok, error }] = await Promise.all([params, searchParams]);
  const { supabase, org, isOrgAdmin } = await manageContext(slug);
  const [{ data }, { chapters }] = await Promise.all([supabase.rpc("org_team", { o: org.id }), orgLists(supabase, org.id)]);
  const chapterName = (id: string | null) => chapters.find((c) => c.id === id)?.name;
  const team = (data ?? []) as Member[];
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
        <h2 className="h3">Organization</h2>
        {!isOrgAdmin && <p className="notice">Only owners and admins can change these.</p>}
        <label>Name<input name="name" required maxLength={120} defaultValue={org.name} /></label>
        <label>About<textarea name="about" rows={3} maxLength={2000} defaultValue={org.about} /></label>
        <label>Website<input name="website" defaultValue={org.website ?? ""} /></label>
        <label>Contact email<input name="contact_email" type="email" defaultValue={org.contact_email ?? ""} /></label>
        <DonationFields isNonprofit={org.is_nonprofit} links={org.donation_links} />
        <p><button className="btn" disabled={!isOrgAdmin}>Save</button></p>
      </form>

      <div className="block">
        <h2 className="h3">Team</h2>
        <p className="soft small">Organizers can add and edit events. Admins can also change settings and the team.</p>
        <div className="table-wrap">
          <table className="table">
            <tbody>
              {team.map((m) => (
                <tr key={m.user_id}>
                  <td><strong>{m.display_name ?? m.email}</strong><br /><span className="soft small">{m.email}</span></td>
                  <td>{m.role}{m.chapter_id && <><br /><span className="soft small">{chapterName(m.chapter_id)}</span></>}</td>
                  <td>
                    {isOrgAdmin && m.role !== "owner" && (
                      <form action={removeTeammate}>
                        {hidden}
                        <input type="hidden" name="user_id" value={m.user_id} />
                        <button className="linkbtn small">Remove</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isOrgAdmin && (
          <form action={addTeammate} className="form">
            {hidden}
            <label>Add someone by email<input name="email" type="email" required placeholder="They need to have signed in once" /></label>
            <label>
              Role
              <select name="role" defaultValue="organizer">
                <option value="organizer">Organizer</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            {chapters.length > 0 && (
              <label>
                Chapter
                <select name="chapter_id" defaultValue="">
                  <option value="">Whole organization</option>
                  {chapters.map((c) => <option key={c.id} value={c.id}>{c.name} only</option>)}
                </select>
              </label>
            )}
            <p><button className="btn small">Add to team</button></p>
          </form>
        )}
      </div>
    </div>
  );
}
