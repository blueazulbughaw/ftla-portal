import Link from "next/link";
import Icon from "@/components/Icon";
import Hero from "@/components/hub/Hero";
import Checklist from "@/components/hub/Checklist";
import { SetupNotice } from "@/components/hub/Notice";
import { dismissAnnouncement } from "./actions";
import { hubContext, displayName } from "@/lib/hub-server";
import { formatLong, mapsUrl } from "@/lib/events";

export const metadata = { title: "Hub" };

export default async function HubOverview() {
  const { supabase, user, profile, needsSetup, event, eventKey, hub, publicHref } = await hubContext("/hub");

  // Announcements for this event that you haven't dismissed.
  let announcements: { id: string; title: string; body: string; publish_at: string }[] = [];
  let savedCount = 0;
  if (!needsSetup) {
    const [{ data: ann }, { data: dismissed }, { count }] = await Promise.all([
      supabase
        .from("announcements")
        .select("id,title,body,publish_at")
        .eq("event_slug", eventKey)
        .eq("active", true)
        .eq("archived", false)
        .lte("publish_at", new Date().toISOString())
        .order("publish_at", { ascending: false }),
      supabase.from("announcement_dismissals").select("announcement_id").eq("user_id", user.id),
      supabase.from("saved_sessions").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("event_slug", eventKey),
    ]);
    const gone = new Set((dismissed ?? []).map((d) => d.announcement_id));
    announcements = (ann ?? []).filter((a) => !gone.has(a.id));
    savedCount = count ?? 0;
  }

  const autoDone = [
    ...((profile?.meal_prefs?.length ?? 0) > 0 ? ["meals"] : []),
    ...(savedCount > 0 ? ["schedule"] : []),
  ];

  const essentials = [
    { href: "/hub/experience/registration", icon: "ticket" as const, title: "My ticket", body: "Registration and check-in details." },
    { href: "/hub/experience/getting-here", icon: "pin" as const, title: "Getting there", body: "Parking, transit and directions." },
    { href: "/hub/experience/on-the-day", icon: "wifi" as const, title: "On the day", body: "Wi-Fi, what to bring and updates." },
    { href: "/hub/experience/perks", icon: "gift" as const, title: "Perks", body: "Credits, offers and giveaways." },
  ];

  return (
    <>
      <Hero
        kicker={event.title}
        title={`Hi ${displayName(profile, user.email).split(" ")[0]}, your day starts here.`}
        intro={event.summary}
      />
      <div className="hub-body">
        {needsSetup && <SetupNotice />}

        <div className="card">
          <div className="card-head">
            <div>
              <h2 className="h3">Announcements</h2>
              <p className="soft small">Updates from the organizers.</p>
            </div>
            <span className="card-ico"><Icon name="bell" /></span>
          </div>
          {announcements.length === 0 ? (
            <p className="soft">You&apos;re all caught up. No new announcements.</p>
          ) : (
            <ul className="ann-list">
              {announcements.map((a) => (
                <li key={a.id}>
                  <div>
                    <b>{a.title}</b>
                    {a.body && <p>{a.body}</p>}
                  </div>
                  <form action={dismissAnnouncement}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="btn ghost small">Dismiss</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hub-2col">
          <Checklist eventSlug={eventKey} items={hub.checklist} autoDone={autoDone} />

          <div className="card event-card">
            <div className="event-card-top">
              <p className="label">{event.label}</p>
              <h2>{event.title}</h2>
            </div>
            <ul className="facts">
              <li><Icon name="calendar" /> {formatLong(event.date)}</li>
              <li><Icon name="coffee" /> {event.time}</li>
              <li>
                <Icon name="pin" />
                <div>
                  {event.place}
                  {event.address && (
                    <>
                      <span className="soft small"> {event.address}</span>
                      <a className="cta" href={mapsUrl(event.address)} target="_blank" rel="noopener">
                        Open directions <Icon name="external" size={14} />
                      </a>
                    </>
                  )}
                </div>
              </li>
            </ul>
            {hub.theme && (
              <div className="theme">
                <Icon name="users" size={28} />
                <div>
                  <b>{hub.theme}</b>
                  <p className="soft small">{hub.themeBody}</p>
                </div>
              </div>
            )}
            <Link className="cta" href={publicHref}>Public event page <Icon name="arrow" size={14} /></Link>
          </div>
        </div>

        <section>
          <h2 className="h3">Event essentials</h2>
          <p className="soft small">Quick access to what you need most.</p>
          <div className="tiles">
            {essentials.map((e) => (
              <Link key={e.href} href={e.href} className="tile">
                <span className="card-ico"><Icon name={e.icon} /></span>
                <div>
                  <b>{e.title}</b>
                  <p className="soft small">{e.body}</p>
                </div>
                <Icon name="arrow" size={16} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
