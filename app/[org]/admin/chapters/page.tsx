import Notice from "@/components/hub/Notice";
import { deleteChapter, saveChapter } from "@/app/manage/actions";
import { manageContext, orgLists } from "@/lib/manage";

export default async function Chapters({ params, searchParams }: { params: Promise<{ org: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ org: slug }, { ok, error }] = await Promise.all([params, searchParams]);
  const { supabase, org, isOrgAdmin } = await manageContext(slug);
  const { chapters } = await orgLists(supabase, org.id);
  const hidden = (
    <>
      <input type="hidden" name="org_slug" value={org.slug} />
      <input type="hidden" name="org_id" value={org.id} />
    </>
  );
  return (
    <div className="block">
      <h2 className="h3">Chapters</h2>
      <p className="soft small">
        One organization, several cities. Give each chapter its own team under Settings and team: someone added to a chapter can only add and edit that chapter&apos;s events.
      </p>
      <Notice ok={ok} error={error} />
      {!isOrgAdmin && <p className="notice">Only owners and admins can add chapters.</p>}
      <div className="grid">
        {chapters.map((c) => (
          <div key={c.id} className="type-item">
            <form action={saveChapter} className="card form">
              {hidden}
              <input type="hidden" name="chapter_id" value={c.id} />
              <label>Name<input name="name" defaultValue={c.name} required maxLength={80} /></label>
              <label>City<input name="city" defaultValue={c.city} maxLength={80} /></label>
              <label>Web address<input name="slug" defaultValue={c.slug} maxLength={60} /></label>
              {isOrgAdmin && <p><button className="btn small">Save</button></p>}
            </form>
            {isOrgAdmin && (
              <form action={deleteChapter}>
                {hidden}
                <input type="hidden" name="chapter_id" value={c.id} />
                <button className="linkbtn small">Delete {c.name}</button>
              </form>
            )}
          </div>
        ))}
        {isOrgAdmin && (
          <form action={saveChapter} className="card form">
            {hidden}
            <label>New chapter<input name="name" required maxLength={80} placeholder="FaithTech Orange County" /></label>
            <label>City<input name="city" maxLength={80} placeholder="Irvine" /></label>
            <p><button className="btn small">Add chapter</button></p>
          </form>
        )}
      </div>
    </div>
  );
}
