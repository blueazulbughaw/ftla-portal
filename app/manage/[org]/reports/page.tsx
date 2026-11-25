import Link from "next/link";
import AddonGate from "@/components/manage/AddonGate";
import { manageContext, orgLists } from "@/lib/manage";
import { formatLong } from "@/lib/events";

type Report = { registered: number; going: number; checked_in: number; hub_people: number };

export default async function Reports({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const { supabase, org, hasAddon } = await manageContext(slug);
  if (!hasAddon("reporting")) return <AddonGate addon="reporting" org={org.slug} />;
  const [{ data }, { series }] = await Promise.all([
    supabase.from("events").select("id,title,starts_on,series_id").eq("org_id", org.id).order("starts_on", { ascending: false }),
    orgLists(supabase, org.id),
  ]);
  const events = data ?? [];
  const seriesEventIds = events.filter((e) => e.series_id).map((e) => e.id);
  const { data: regData } = seriesEventIds.length
    ? await supabase.from("event_registrations").select("event_id,email,name,checked_in").in("event_id", seriesEventIds)
    : { data: [] as { event_id: string; email: string; name: string | null; checked_in: boolean }[] };
  const programs = series
    .map((s) => {
      const sessions = events.filter((e) => e.series_id === s.id).sort((a, b) => a.starts_on.localeCompare(b.starts_on));
      const regs = (regData ?? []).filter((r) => sessions.some((e) => e.id === r.event_id));
      const people = new Map<string, { name: string; came: Set<string> }>();
      for (const r of regs) {
        const p = people.get(r.email) ?? { name: r.name || r.email, came: new Set<string>() };
        if (r.checked_in) p.came.add(r.event_id);
        people.set(r.email, p);
      }
      const list = [...people.values()].sort((a, b) => b.came.size - a.came.size || a.name.localeCompare(b.name));
      const attended = list.filter((p) => p.came.size > 0);
      return {
        s,
        sessions,
        list,
        attended: attended.length,
        repeat: attended.filter((p) => p.came.size >= 2).length,
        all: sessions.length ? attended.filter((p) => p.came.size === sessions.length).length : 0,
        perSession: sessions.map((e) => regs.filter((r) => r.event_id === e.id && r.checked_in).length),
      };
    })
    .filter((p) => p.sessions.length > 0);
  const reports = await Promise.all(
    events.map(async (e) => {
      const { data: r } = await supabase.rpc("event_report", { event_key: e.id });
      return ((Array.isArray(r) ? r[0] : r) ?? null) as Report | null;
    }),
  );
  const total = reports.reduce((n, r) => n + Number(r?.registered ?? 0), 0);
  const came = reports.reduce((n, r) => n + Number(r?.checked_in ?? 0), 0);
  return (
    <div className="block">
      <h2 className="h3">Reports</h2>
      <dl className="stats">
        <div><dt>{events.length}</dt><dd>events</dd></div>
        <div><dt>{total}</dt><dd>registrations across all events</dd></div>
        <div><dt>{came}</dt><dd>checked in</dd></div>
      </dl>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Event</th><th>Date</th><th className="num">Registered</th><th className="num">Going</th><th className="num">Checked in</th><th className="num">Using the hub</th></tr></thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={e.id}>
                <td><Link href={`/manage/${org.slug}/reports/${e.id}`}>{e.title}</Link></td>
                <td>{formatLong(e.starts_on)}</td>
                <td className="num">{reports[i]?.registered ?? 0}</td>
                <td className="num">{reports[i]?.going ?? 0}</td>
                <td className="num">{reports[i]?.checked_in ?? 0}</td>
                <td className="num">{reports[i]?.hub_people ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="h3">Program reports</h2>
      {programs.length === 0 && <p className="soft small">Group events into a series to see attendance and repeat attendance across sessions.</p>}
      {programs.map((p) => (
        <div key={p.s.id} id={`series-${p.s.id}`} className="card">
          <strong>{p.s.name}</strong>
          <dl className="stats">
            <div><dt>{p.sessions.length}</dt><dd>sessions</dd></div>
            <div><dt>{p.attended}</dt><dd>people came to at least one</dd></div>
            <div><dt>{p.repeat}</dt><dd>came back for two or more{p.attended ? ` (${Math.round((p.repeat / p.attended) * 100)}%)` : ""}</dd></div>
            <div><dt>{p.all}</dt><dd>came to every session</dd></div>
          </dl>
          <details>
            <summary>Attendance by session and person</summary>
            <div className="table-wrap">
              <table className="table attendance">
                <thead>
                  <tr>
                    <th>Person</th>
                    {p.sessions.map((e, i) => <th key={e.id} className="num" title={e.title}>#{i + 1}</th>)}
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="soft">Checked in</td>
                    {p.perSession.map((n, i) => <td key={i} className="num"><strong>{n}</strong></td>)}
                    <td></td>
                  </tr>
                  {p.list.slice(0, 300).map((person, i) => (
                    <tr key={i}>
                      <td>{person.name}</td>
                      {p.sessions.map((e) => <td key={e.id} className="num">{person.came.has(e.id) ? "✓" : ""}</td>)}
                      <td className="num">{person.came.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="soft small">{p.sessions.map((e, i) => `#${i + 1} ${e.title} (${formatLong(e.starts_on)})`).join(" · ")}</p>
          </details>
        </div>
      ))}
    </div>
  );
}
