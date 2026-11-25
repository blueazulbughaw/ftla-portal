import Link from "next/link";
import Icon from "@/components/Icon";
import Hero from "@/components/hub/Hero";
import Avatar from "@/components/hub/Avatar";
import RoleRow from "@/components/hub/RoleRow";
import Notice, { SetupNotice } from "@/components/hub/Notice";
import { publishAnnouncement, setAnnouncementState } from "../actions";
import { hubContext } from "@/lib/hub-server";
import { EVENTS, LIBRARY, formatLong, isPast } from "@/lib/events";
import { guestSummary, lumaConfigured } from "@/lib/luma";

export const metadata = { title: "Admin Panel" };

type Ann = { id: string; title: string; body: string; publish_at: string; active: boolean; created_at: string };
type Person = { id: string; display_name: string | null; email: string | null; avatar_url: string | null; roles: string[] };

const laTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

/** An ISO time as the value an <input type="datetime-local"> wants, in LA time. */
const laInput = (iso: string) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

export default async function AdminPanel({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; edit?: string }> }) {
  const { ok, error, edit } = await searchParams;
  const { supabase, user, needsSetup, event, eventKey, isStaff, isAdmin, roles } = await hubContext("/hub/admin");

  if (!isStaff) {
    return (
      <>
        <Hero kicker="Organizers" title="Admins only." />
        <div className="hub-body">
          <p className="notice">You&apos;re signed in as {user.email}, which doesn&apos;t have the organizer or admin role. Ask a FaithTech LA leader to add you.</p>
        </div>
      </>
    );
  }

  const [{ data: annData }, { data: peopleData }] = needsSetup
    ? [{ data: [] }, { data: [] }]
    : await Promise.all([
        supabase.from("announcements").select("*").eq("event_slug", eventKey).eq("archived", false).order("created_at", { ascending: false }),
        supabase.from("profiles").select("id,display_name,email,avatar_url,roles").order("display_name"),
      ]);
  const anns = (annData ?? []) as Ann[];
  const people = (peopleData ?? []) as Person[];
  const editing = anns.find((a) => a.id === edit);
  const canEditRoles = roles.includes("admin");

  const events = [...EVENTS].sort((a, b) => b.date.localeCompare(a.date));
  const stats = await Promise.all(events.map((e) => (e.lumaEventId ? guestSummary(e.lumaEventId) : null)));
  const allFiles = [
    ...LIBRARY.map((a) => ({ ...a, event: "Community" })),
    ...EVENTS.flatMap((e) => (e.artifacts ?? []).map((a) => ({ ...a, event: e.title }))),
  ];

  return (
    <>
      <Hero kicker={`${event.title} operations`} title="Admin Panel." intro="Coordinate event updates and hub access." />
      <div className="hub-body">
        {needsSetup && <SetupNotice />}
        <Notice ok={ok} error={error} />

        <div className="card">
          <div className="card-head">
            <div>
              <h2 className="h3">{editing ? "Edit announcement" : "Announcements"}</h2>
              <p className="soft small">Publish a note for {event.title} attendees. Each person dismisses it on their own.</p>
            </div>
            <span className="card-ico"><Icon name="megaphone" /></span>
          </div>
          <form action={publishAnnouncement} className="form" key={editing?.id ?? "new"}>
            <input type="hidden" name="event_slug" value={eventKey} />
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <label>Announcement title<input name="title" required maxLength={140} placeholder="A clear, useful headline" defaultValue={editing?.title} /></label>
            <label>Message<textarea name="body" rows={4} maxLength={2000} placeholder="Share the details attendees need…" defaultValue={editing?.body} /></label>
            <fieldset className="when-field">
              <legend>When should attendees see it?</legend>
              <label className="inline"><input type="radio" name="when" value="now" defaultChecked={!editing || new Date(editing.publish_at) <= new Date()} /> Show immediately</label>
              <label className="inline"><input type="radio" name="when" value="later" defaultChecked={!!editing && new Date(editing.publish_at) > new Date()} /> Schedule for later</label>
              <label className="inline">
                Date and time (LA)
                <input type="datetime-local" name="publish_at" defaultValue={editing ? laInput(editing.publish_at) : undefined} />
              </label>
            </fieldset>
            <div className="row">
              <button className="btn" disabled={needsSetup}><Icon name="megaphone" size={16} /> {editing ? "Save changes" : "Publish announcement"}</button>
              {editing && <Link className="btn ghost" href="/hub/admin">Cancel</Link>}
            </div>
          </form>

          <h3 className="h3 mt">Published and scheduled</h3>
          {anns.length === 0 ? (
            <p className="soft">No announcements yet.</p>
          ) : (
            <ul className="ann-admin">
              {anns.map((a) => {
                const scheduled = new Date(a.publish_at) > new Date();
                const state = !a.active ? "Inactive" : scheduled ? `Scheduled for ${laTime(a.publish_at)}` : "Published";
                return (
                  <li key={a.id}>
                    <span className={`dot ${a.active ? "live" : ""}`} />
                    <div>
                      <b>{a.title}</b>
                      {a.body && <p className="soft">{a.body}</p>}
                      <p className="soft small">{laTime(a.created_at)} · {state}</p>
                    </div>
                    <div className="ann-actions">
                      <Link href={`/hub/admin?edit=${a.id}`}>Edit</Link>
                      <form action={setAnnouncementState}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="op" value={a.active ? "deactivate" : "activate"} />
                        <button className="linkbtn">{a.active ? "Deactivate" : "Reactivate"}</button>
                      </form>
                      <form action={setAnnouncementState}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="op" value="archive" />
                        <button className="linkbtn"><Icon name="trash" size={14} /> Archive</button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h2 className="h3">Attendee roles</h2>
              <p className="soft small">
                Assign one or more roles. Every account keeps attendee access.
                {!canEditRoles && " Only admins can change roles."}
                {isAdmin && !roles.includes("admin") && " Your email is on the admin list, but your account needs the admin role in the database to change roles (see the README)."}
              </p>
            </div>
            <span className="card-ico"><Icon name="shield" /></span>
          </div>
          {people.length === 0 ? (
            <p className="soft">People appear here after they sign in.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Attendee</th><th>Roles</th></tr></thead>
                <tbody>
                  {people.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="person">
                          <Avatar name={p.display_name} url={p.avatar_url} size={36} />
                          <div><b>{p.display_name ?? "No name"}</b><div className="soft small">{p.email}</div></div>
                        </div>
                      </td>
                      <td><RoleRow userId={p.id} roles={p.roles} canEdit={canEditRoles} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="h3">Events and guests</h2>
          {!lumaConfigured() && (
            <p className="notice">Guest numbers come from Luma. Add a <code>LUMA_API_KEY</code> to see them here (see the README).</p>
          )}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Event</th><th>Date</th><th className="num">Guests</th><th className="num">Going</th><th className="num">Checked in</th></tr>
              </thead>
              <tbody>
                {events.map((e, i) => {
                  const s = stats[i];
                  return (
                    <tr key={e.slug}>
                      <td><Link href={`/events/${e.slug}`}>{e.title}</Link>{isPast(e) && <span className="pill soon"> Past</span>}</td>
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
        </div>

        <div className="card">
          <h2 className="h3">All artifacts</h2>
          <ul className="filelist">
            {allFiles.map((a) => (
              <li key={a.url + a.event}>
                <a href={a.url} target="_blank" rel="noopener">{a.title}</a>
                <span className="soft"> · {a.event}</span>
                {a.adminOnly && <span className="pill t-discern">Admin</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
