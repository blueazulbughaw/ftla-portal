import Link from "next/link";
import { notFound } from "next/navigation";
import AddonGate from "@/components/manage/AddonGate";
import Notice from "@/components/hub/Notice";
import { addRegistration, toggleCheckIn } from "@/app/manage/actions";
import { manageContext } from "@/lib/manage";
import { formatLong } from "@/lib/events";
import type { EventDetails } from "@/lib/data";

type Report = { registered: number; going: number; checked_in: number; hub_people: number; meal_counts: Record<string, number>; session_counts: Record<string, number> };
type Reg = { id: string; name: string | null; email: string; status: string; checked_in: boolean; source: string };

export default async function EventReport({ params, searchParams }: { params: Promise<{ org: string; event: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ org: slug, event: id }, { ok, error }] = await Promise.all([params, searchParams]);
  const { supabase, org, hasAddon } = await manageContext(slug);
  if (!hasAddon("reporting")) return <AddonGate addon="reporting" org={org.slug} />;
  const { data: event } = await supabase.from("events").select("id,title,starts_on,details").eq("id", id).eq("org_id", org.id).maybeSingle();
  if (!event) notFound();
  const [{ data: rep }, { data: regData }] = await Promise.all([
    supabase.rpc("event_report", { event_key: id }),
    supabase.from("event_registrations").select("id,name,email,status,checked_in,source").eq("event_id", id).order("created_at"),
  ]);
  const r = ((Array.isArray(rep) ? rep[0] : rep) ?? { registered: 0, going: 0, checked_in: 0, hub_people: 0, meal_counts: {}, session_counts: {} }) as Report;
  const regs = (regData ?? []) as Reg[];
  const sessions = ((event.details as EventDetails)?.sessions ?? []);
  const hidden = (
    <>
      <input type="hidden" name="org_slug" value={org.slug} />
      <input type="hidden" name="event_id" value={id} />
    </>
  );
  return (
    <div className="grid2">
      <div className="block">
        <p><Link href={`/manage/${org.slug}/reports`}>← All reports</Link></p>
        <h2 className="h3">{event.title}</h2>
        <p className="soft">{formatLong(event.starts_on)}</p>
        <Notice ok={ok} error={error} />
        <dl className="stats">
          <div><dt>{r.registered}</dt><dd>registered</dd></div>
          <div><dt>{r.going}</dt><dd>going</dd></div>
          <div><dt>{r.checked_in}</dt><dd>checked in</dd></div>
          <div><dt>{r.hub_people}</dt><dd>built a schedule in the hub</dd></div>
        </dl>
        {Object.keys(r.meal_counts).length > 0 && (
          <>
            <h3 className="h4">Meal needs</h3>
            <ul>{Object.entries(r.meal_counts).map(([m, n]) => <li key={m}>{m}: {n}</li>)}</ul>
          </>
        )}
        {Object.keys(r.session_counts).length > 0 && (
          <>
            <h3 className="h4">Most saved sessions</h3>
            <ul>
              {Object.entries(r.session_counts).sort((a, b) => b[1] - a[1]).map(([s, n]) => (
                <li key={s}>{sessions.find((x) => x.id === s)?.title ?? s}: {n}</li>
              ))}
            </ul>
          </>
        )}
        <p><a href={`/manage/${org.slug}/reports/${id}/csv`} className="btn ghost small">Download CSV</a></p>
      </div>

      <div className="block">
        <h3 className="h3">Registrations</h3>
        <form action={addRegistration} className="row">
          {hidden}
          <input name="name" placeholder="Name" maxLength={120} />
          <input name="email" type="email" placeholder="Email" required />
          <button className="btn small">Add</button>
        </form>
        {regs.length === 0 ? (
          <p className="soft">No registrations yet. Add people here, sync from Luma, or send them in with a webhook.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Status</th><th>From</th><th>Check in</th></tr></thead>
              <tbody>
                {regs.map((g) => (
                  <tr key={g.id}>
                    <td><strong>{g.name || g.email}</strong><br /><span className="soft small">{g.email}</span></td>
                    <td>{g.status}</td>
                    <td>{g.source}</td>
                    <td>
                      <form action={toggleCheckIn}>
                        <input type="hidden" name="org_slug" value={org.slug} />
                        <input type="hidden" name="id" value={g.id} />
                        <input type="hidden" name="checked_in" value={g.checked_in ? "false" : "true"} />
                        <button className={`btn small ${g.checked_in ? "" : "ghost"}`}>{g.checked_in ? "Checked in" : "Check in"}</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
