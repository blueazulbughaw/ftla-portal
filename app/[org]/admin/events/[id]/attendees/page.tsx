import Link from "next/link";
import AddonGate from "@/components/manage/AddonGate";
import Bars from "@/components/manage/Bars";
import CopyEmails from "@/components/manage/CopyEmails";
import Notice from "@/components/hub/Notice";
import { addRegistration, toggleCheckIn } from "@/app/manage/actions";
import { manageContext } from "@/lib/manage";
import type { EventDetails } from "@/lib/data";

type Report = { registered: number; going: number; checked_in: number; hub_people: number; meal_counts: Record<string, number>; session_counts: Record<string, number> };
type Reg = { id: string; name: string | null; email: string; status: string; checked_in: boolean; source: string; came_from: string | null; area: string | null; registered_at: string | null; created_at: string };

const SOURCE_LABEL: Record<string, string> = { luma: "Luma", webhook: "Webhook", manual: "Added by hand" };
const dayLA = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
const shortDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const count = (list: string[]) =>
  Object.entries(list.reduce<Record<string, number>>((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {}))
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

export default async function Attendees({
  params,
  searchParams,
}: {
  params: Promise<{ org: string; id: string }>;
  searchParams: Promise<{ ok?: string; error?: string; q?: string; status?: string; in?: string }>;
}) {
  const [{ org: slug, id }, sp] = await Promise.all([params, searchParams]);
  const { supabase, org, hasAddon } = await manageContext(slug);
  if (!hasAddon("reporting")) return <AddonGate addon="reporting" org={org.slug} />;
  const [{ data: event }, { data: rep }, { data: regData }] = await Promise.all([
    supabase.from("events").select("id,starts_on,details,luma_event_id").eq("id", id).single(),
    supabase.rpc("event_report", { event_key: id }),
    supabase.from("event_registrations").select("*").eq("event_id", id).order("created_at"),
  ]);
  const r = ((Array.isArray(rep) ? rep[0] : rep) ?? { registered: 0, going: 0, checked_in: 0, hub_people: 0, meal_counts: {}, session_counts: {} }) as Report;
  const regs = (regData ?? []) as Reg[];
  const sessions = (event?.details as EventDetails | undefined)?.sessions ?? [];

  // Numbers
  const going = regs.filter((g) => g.status === "going");
  const came = regs.filter((g) => g.checked_in);
  const showUp = going.length ? Math.round((came.length / going.length) * 100) : 0;
  const statuses = count(regs.map((g) => g.status));

  // Registrations per day, up to the event
  const perDay = count(regs.map((g) => dayLA(g.registered_at ?? g.created_at))).sort((a, b) => a.label.localeCompare(b.label));
  const maxDay = Math.max(...perDay.map((d) => d.value), 1);
  let running = 0;
  const cumulative = perDay.map((d) => (running += d.value));

  const sources = count(regs.map((g) => g.came_from || SOURCE_LABEL[g.source] || g.source));
  const areas = count(regs.filter((g) => g.area).map((g) => g.area!.trim()));

  // Guest list with search and filters
  const q = (sp.q ?? "").trim().toLowerCase();
  const shown = regs.filter(
    (g) =>
      (!q || `${g.name ?? ""} ${g.email} ${g.area ?? ""} ${g.came_from ?? ""}`.toLowerCase().includes(q)) &&
      (!sp.status || g.status === sp.status) &&
      (!sp.in || (sp.in === "yes" ? g.checked_in : !g.checked_in)),
  );
  const filterHref = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(Object.entries({ q: sp.q, status: sp.status, in: sp.in, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `?${next}`;
  };

  return (
    <div className="attendees">
      <Notice ok={sp.ok} error={sp.error} />

      <div className="tiles">
        <div className="tile t-reg"><b>{r.registered}</b><span>registered</span></div>
        <div className="tile"><b>{going.length}</b><span>going</span></div>
        <div className="tile t-in"><b>{came.length}</b><span>checked in</span></div>
        <div className="tile"><b>{showUp}%</b><span>show-up rate</span></div>
        <div className="tile"><b>{r.hub_people}</b><span>built a schedule in the hub</span></div>
      </div>

      <div className="grid2">
        <div className="block">
          <h3 className="h3">Registrations per day</h3>
          {perDay.length === 0 ? (
            <p className="soft small">No registrations yet. Sync from Luma, send a webhook, or add people below.</p>
          ) : (
            <div className="daychart" role="img" aria-label={`Registrations per day, ${perDay.length} days`}>
              {perDay.map((d, i) => (
                <div key={d.label} className="daycol" title={`${shortDay(d.label)}: ${d.value} new, ${cumulative[i]} total`}>
                  <span className="daybar" style={{ height: `${(d.value / maxDay) * 100}%` }} />
                  <span className="daylabel">{i === 0 || i === perDay.length - 1 || perDay.length < 10 ? shortDay(d.label) : ""}</span>
                </div>
              ))}
            </div>
          )}
          {perDay.length > 0 && <p className="soft small">Busiest day: {shortDay([...perDay].sort((a, b) => b.value - a.value)[0].label)}.</p>}
        </div>

        <div className="block">
          <h3 className="h3">From sign-up to the door</h3>
          <Bars
            rows={[
              { label: "Registered", value: regs.length },
              { label: "Going", value: going.length, note: regs.length ? `${Math.round((going.length / regs.length) * 100)}%` : "" },
              { label: "Checked in", value: came.length, note: going.length ? `${showUp}% of going` : "" },
            ]}
          />
          {statuses.length > 1 && <p className="soft small">By status: {statuses.map((s) => `${s.label} ${s.value}`).join(" · ")}</p>}
        </div>

        <div className="block">
          <h3 className="h3">How people found it</h3>
          <Bars rows={sources} empty="Nothing yet. Luma's tracking links and webhooks fill this in." />
        </div>

        <div className="block">
          <h3 className="h3">Where people are coming from</h3>
          <Bars rows={areas.slice(0, 12)} empty="Add an area or city question to your Luma registration to see this." />
        </div>

        {(Object.keys(r.meal_counts).length > 0 || Object.keys(r.session_counts).length > 0) && (
          <div className="block">
            <h3 className="h3">Meals and sessions</h3>
            {Object.keys(r.meal_counts).length > 0 && <Bars rows={Object.entries(r.meal_counts).map(([label, value]) => ({ label, value }))} />}
            {Object.keys(r.session_counts).length > 0 && (
              <>
                <p className="label">Most saved sessions</p>
                <Bars rows={Object.entries(r.session_counts).map(([s, value]) => ({ label: sessions.find((x) => x.id === s)?.title ?? s, value })).sort((a, b) => b.value - a.value).slice(0, 8)} />
              </>
            )}
          </div>
        )}
      </div>

      <div className="block">
        <div className="card-head">
          <div>
            <h3 className="h3">Everyone registered <span className="count">{regs.length}</span></h3>
            <p className="soft small">Search, filter, check people in, or download the list.</p>
          </div>
          <div className="row">
            <CopyEmails emails={shown.map((g) => g.email)} label="Copy shown emails" />
            <a href={`/${org.slug}/admin/reports/${id}/csv`} className="btn ghost small">Download CSV</a>
            {event?.luma_event_id && <Link href={`/${org.slug}/admin/integrations`} className="btn ghost small">Sync from Luma</Link>}
          </div>
        </div>
        <form className="row res-search">
          <input name="q" defaultValue={sp.q} placeholder="Search name, email, area" aria-label="Search guests" />
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          {sp.in && <input type="hidden" name="in" value={sp.in} />}
          <button className="btn small">Search</button>
        </form>
        <div className="chips">
          <Link href={filterHref({ status: undefined, in: undefined })} className={`chip ${!sp.status && !sp.in ? "on" : ""}`}>All</Link>
          {statuses.map((s) => (
            <Link key={s.label} href={filterHref({ status: s.label })} className={`chip ${sp.status === s.label ? "on" : ""}`}>{s.label} {s.value}</Link>
          ))}
          <Link href={filterHref({ in: "yes" })} className={`chip ${sp.in === "yes" ? "on" : ""}`}>Checked in {came.length}</Link>
          <Link href={filterHref({ in: "no" })} className={`chip ${sp.in === "no" ? "on" : ""}`}>Not yet {regs.length - came.length}</Link>
        </div>
        <form action={addRegistration} className="row add-guest">
          <input type="hidden" name="org_slug" value={org.slug} />
          <input type="hidden" name="event_id" value={id} />
          <input name="name" placeholder="Name" maxLength={120} aria-label="Name" />
          <input name="email" type="email" placeholder="Email" required aria-label="Email" />
          <input name="area" placeholder="Area (optional)" maxLength={80} aria-label="Area" />
          <button className="btn small">Add guest</button>
        </form>
        {shown.length === 0 ? (
          <p className="soft">{regs.length ? "No one matches." : "No registrations yet."}</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Signed up</th><th>Came from</th><th>Area</th><th>Status</th><th>Check in</th></tr></thead>
              <tbody>
                {shown.map((g) => (
                  <tr key={g.id}>
                    <td><strong>{g.name || g.email}</strong><br /><span className="soft small">{g.email}</span></td>
                    <td className="small">{shortDay(dayLA(g.registered_at ?? g.created_at))}</td>
                    <td className="small">{g.came_from || SOURCE_LABEL[g.source] || g.source}</td>
                    <td className="small">{g.area ?? ""}</td>
                    <td><span className="pill soon">{g.status}</span></td>
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
