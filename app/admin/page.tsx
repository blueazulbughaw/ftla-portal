import Link from "next/link";
import { redirect } from "next/navigation";
import { EVENTS, LIBRARY, formatLong, isPast } from "@/lib/events";
import { guestSummary, lumaConfigured } from "@/lib/luma";
import { getUser, isAdminEmail, supabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!supabaseConfigured()) {
    return (
      <main className="wrap narrow section">
        <div className="block">
          <h1 className="h2">Admin</h1>
          <p className="notice">Sign in isn&apos;t switched on yet, so the admin area is locked. See the README.</p>
        </div>
      </main>
    );
  }
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) {
    return (
      <main className="wrap narrow section">
        <div className="block">
          <h1 className="h2">Admins only</h1>
          <p className="soft">
            You&apos;re signed in as {user.email}, which isn&apos;t on the admin list. Ask a FaithTech LA leader
            to add you.
          </p>
        </div>
      </main>
    );
  }

  const events = [...EVENTS].sort((a, b) => b.date.localeCompare(a.date));
  const stats = await Promise.all(events.map((e) => (e.lumaEventId ? guestSummary(e.lumaEventId) : null)));
  const allFiles = [
    ...LIBRARY.map((a) => ({ ...a, event: "Community" })),
    ...EVENTS.flatMap((e) => (e.artifacts ?? []).map((a) => ({ ...a, event: e.title }))),
  ];

  return (
    <main className="wrap section stack">
      <div>
        <p className="label">Organizers</p>
        <h1 className="h2">Admin</h1>
        <p className="soft">Signed in as {user.email}.</p>
      </div>

      <div className="block">
        <h2 className="h3">Events and guests</h2>
        {!lumaConfigured() && (
          <p className="notice">
            Guest numbers come from Luma. Add a <code>LUMA_API_KEY</code> to see them here (see the README).
          </p>
        )}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th className="num">Guests</th>
                <th className="num">Going</th>
                <th className="num">Checked in</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => {
                const s = stats[i];
                return (
                  <tr key={e.slug}>
                    <td>
                      <Link href={`/events/${e.slug}`}>{e.title}</Link>
                      {isPast(e) && <span className="pill soon"> Past</span>}
                    </td>
                    <td>{formatLong(e.date)}</td>
                    <td className="num">{s ? s.total : "—"}</td>
                    <td className="num">{s ? s.approved : "—"}</td>
                    <td className="num">{s ? s.checkedIn : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="soft small">A dash means the event isn&apos;t linked to Luma yet, or Luma isn&apos;t set up.</p>
      </div>

      <div className="block">
        <h2 className="h3">All artifacts</h2>
        <ul className="filelist">
          {allFiles.map((a) => (
            <li key={a.url + a.event}>
              <a href={a.url} target="_blank" rel="noopener">
                {a.title}
              </a>
              <span className="soft"> · {a.event}</span>
              {a.adminOnly && <span className="pill t-discern">Admin</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="block">
        <h2 className="h3">Coming next</h2>
        <p className="soft">Post-event retros and reports over time will live here.</p>
      </div>
    </main>
  );
}
