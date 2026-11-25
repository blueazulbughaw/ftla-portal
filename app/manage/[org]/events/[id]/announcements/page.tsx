import Link from "next/link";
import Notice from "@/components/hub/Notice";
import { saveEventAnnouncement, setEventAnnouncementState } from "@/app/manage/actions";
import { manageContext } from "@/lib/manage";
import { laInput, laTime } from "@/lib/time";

type Ann = { id: string; title: string; body: string; publish_at: string; active: boolean };

export default async function Announcements({ params, searchParams }: { params: Promise<{ org: string; id: string }>; searchParams: Promise<{ ok?: string; error?: string; edit?: string }> }) {
  const [{ org: slug, id }, { ok, error, edit }] = await Promise.all([params, searchParams]);
  const { supabase, org } = await manageContext(slug);
  const { data } = await supabase.from("announcements").select("id,title,body,publish_at,active").eq("event_slug", id).eq("archived", false).order("publish_at", { ascending: false });
  const anns = (data ?? []) as Ann[];
  const editing = anns.find((a) => a.id === edit);
  const now = new Date().toISOString();
  const hidden = (
    <>
      <input type="hidden" name="org_slug" value={org.slug} />
      <input type="hidden" name="event_id" value={id} />
    </>
  );
  return (
    <div className="grid2">
      <form action={saveEventAnnouncement} className="block form" key={editing?.id ?? "new"}>
        {hidden}
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <h3 className="h3">{editing ? "Edit announcement" : "Post an announcement"}</h3>
        <p className="soft small">Shows at the top of this event&apos;s attendee hub.</p>
        <Notice ok={ok} error={error} />
        <label>Title<input name="title" required maxLength={140} defaultValue={editing?.title} placeholder="Doors open at 8:30" /></label>
        <label>Message<textarea name="body" rows={4} maxLength={2000} defaultValue={editing?.body} /></label>
        <fieldset className="when-field">
          <legend>When</legend>
          <label className="inline"><input type="radio" name="when" value="now" defaultChecked={!editing || editing.publish_at <= now} /> Show now</label>
          <label className="inline"><input type="radio" name="when" value="later" defaultChecked={Boolean(editing && editing.publish_at > now)} /> Schedule for (Los Angeles time)</label>
          <input type="datetime-local" name="publish_at" defaultValue={editing ? laInput(editing.publish_at) : ""} />
        </fieldset>
        <div className="row">
          <button className="btn">{editing ? "Save" : "Post"}</button>
          {editing && <Link href="?" className="btn ghost">Cancel</Link>}
        </div>
      </form>
      <div className="block">
        <h3 className="h3">Announcements <span className="count">{anns.length}</span></h3>
        {anns.length === 0 && <p className="soft">None yet.</p>}
        <ul className="res-list">
          {anns.map((a) => (
            <li key={a.id} className="ann-item">
              <div>
                <strong>{a.title}</strong>{" "}
                <span className={`pill ${a.active ? "" : "soon"}`}>{!a.active ? "Hidden" : a.publish_at > now ? `Scheduled ${laTime(a.publish_at)}` : `Live since ${laTime(a.publish_at)}`}</span>
                {a.body && <p className="soft small">{a.body}</p>}
              </div>
              <span className="row small">
                <Link href={`?edit=${a.id}`}>Edit</Link>
                {(["activate", "deactivate", "archive"] as const)
                  .filter((op) => (op === "activate" ? !a.active : op === "deactivate" ? a.active : true))
                  .map((op) => (
                    <form key={op} action={setEventAnnouncementState}>
                      {hidden}
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="op" value={op} />
                      <button className="linkbtn small">{op === "activate" ? "Show" : op === "deactivate" ? "Hide" : "Archive"}</button>
                    </form>
                  ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
