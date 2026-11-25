import Link from "next/link";
import Notice from "@/components/hub/Notice";
import { deleteEvent, importStarterEvents } from "@/app/manage/actions";
import { manageContext } from "@/lib/manage";
import { HOME_ORG_SLUG } from "@/lib/data";
import { formatLong } from "@/lib/events";

type Row = { id: string; slug: string; title: string; starts_on: string; published: boolean; event_types: { name: string } | null };

export default async function OrgEvents({ params, searchParams }: { params: Promise<{ org: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ org: slug }, { ok, error }] = await Promise.all([params, searchParams]);
  const { supabase, org, hasAddon } = await manageContext(slug);
  const { data } = await supabase.from("events").select("id,slug,title,starts_on,published,event_types(name)").eq("org_id", org.id).order("starts_on", { ascending: false });
  const events = (data ?? []) as unknown as Row[];
  return (
    <div className="block">
      <div className="card-head">
        <div>
          <h2 className="h3">Events</h2>
          <p className="soft small">Drafts only show here. Tick Published on an event to put it on your public page.</p>
        </div>
        <Link href={`/${org.slug}/admin/events/new`} className="btn">Add an event</Link>
      </div>
      <Notice ok={ok} error={error} />
      {events.length === 0 ? (
        <p className="soft">No events yet. Add your first one.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Event</th><th>Date</th><th>Type</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td><Link href={`/${org.slug}/admin/events/${e.id}`}><strong>{e.title}</strong></Link></td>
                  <td>{formatLong(e.starts_on)}</td>
                  <td>{e.event_types?.name ?? "No type"}</td>
                  <td><span className={`pill ${e.published ? "" : "soon"}`}>{e.published ? "Published" : "Draft"}</span></td>
                  <td>
                    <div className="row">
                      <Link href={`/${org.slug}/admin/events/${e.id}`} className="btn ghost small">Edit</Link>
                      <Link href={`/${org.slug}/admin/events/${e.id}/plan`} className="btn ghost small">Planning</Link>
                      {e.published && <Link href={`/${org.slug}/events/${e.slug}`} className="btn ghost small">View</Link>}
                      {hasAddon("reporting") && <Link href={`/${org.slug}/admin/events/${e.id}/attendees`} className="btn ghost small">Attendees report</Link>}
                    </div>
                    <details className="danger">
                      <summary>Remove</summary>
                      <form action={deleteEvent} className="row">
                        <input type="hidden" name="org_slug" value={org.slug} />
                        <input type="hidden" name="event_id" value={e.id} />
                        <label className="inline small"><input type="checkbox" name="confirm" value="yes" required /> Yes, remove this event and its registrations</label>
                        <button className="btn ghost small">Remove</button>
                      </form>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {org.slug === HOME_ORG_SLUG && (
        <form action={importStarterEvents} className="card">
          <input type="hidden" name="org_id" value={org.id} />
          <strong>Restore the built-in FaithTech LA events</strong>
          <p className="soft small">The events the site shipped with (SoCal Hackathon, DevFest and the rest) were copied into this list so you can edit or remove them. This brings back any you removed. Events already here are left alone.</p>
          <p><button className="btn ghost small">Restore built-in events</button></p>
        </form>
      )}
    </div>
  );
}
