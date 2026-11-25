import Link from "next/link";
import { formatLong, mapsUrl } from "@/lib/events";
import { to12 } from "@/lib/hub";
import { isPastEvent, type FullEvent } from "@/lib/data";
import { getUser, isAdminEmail } from "@/lib/supabase/server";

// The public page for one event. Each section only shows when the event's type has that feature on.
export default async function EventPublic({ full }: { full: FullEvent }) {
  const { event, hub, features } = full;
  const has = (f: string) => features.includes(f as never);
  const user = await getUser();
  const admin = isAdminEmail(user?.email);
  const past = isPastEvent(full);
  const files = (event.artifacts ?? []).filter((a) => !a.adminOnly || admin);
  const hiddenCount = (event.artifacts ?? []).length - files.length;
  const sessions = [...hub.sessions].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <main>
      <section className="hero">
        <div className="wrap hero-in">
          <p className="kicker">
            {formatLong(event.date)} {event.tentative && "· to be confirmed"} · {full.typeName}
          </p>
          <h1>{event.title}</h1>
          <p className="intro">{event.summary}</p>
          <div className="hero-facts">
            {has("location") && event.address ? (
              <a className="venue" href={mapsUrl(event.address)} target="_blank" rel="noopener">
                <b>{event.place}</b>
                <span>{event.address} · {event.time}</span>
              </a>
            ) : (
              <span className="venue">
                <b>{event.place}</b>
                <span>{event.time}</span>
              </span>
            )}
            {event.registerUrl && !past && (
              <a className="btn dark" href={event.registerUrl} target="_blank" rel="noopener">
                {event.registerLabel ?? "Register"} →
              </a>
            )}
            {full.hubEnabled && !past && (
              <Link className="btn ghost" href={user ? "/hub" : "/login?next=/hub"}>Open the attendee hub</Link>
            )}
            {past && <span className="pill soon dark">This event has ended</span>}
          </div>
        </div>
      </section>

      <div className="wrap section stack">
        {!full.published && <p className="notice">This event is a draft. Only your team can see it.</p>}

        {(event.description || event.organizer || event.price) && (
          <div className="block">
            <p className="label">About</p>
            {event.description && <p style={{ whiteSpace: "pre-line" }}>{event.description}</p>}
            <p className="soft">
              {event.organizer && <>Hosted by <Link href={`/o/${full.org.slug}`}>{event.organizer}</Link>. </>}
              {event.price && <>Price: {event.price}.</>}
            </p>
          </div>
        )}

        {has("agenda") && sessions.length > 0 && (
          <div className="block">
            <p className="label">The day</p>
            <h2 className="h2">Agenda</h2>
            <ol className="agenda">
              {sessions.map((s) => (
                <li key={s.id}>
                  <time>{to12(s.start)}</time>
                  <span>
                    <b>{s.title}</b>
                    {s.speaker && <span className="soft"> · {s.speaker}</span>}
                    {s.description && <span className="soft"> {s.description}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {has("speakers") && (hub.speakers ?? []).length > 0 && (
          <div className="block">
            <p className="label">Speakers</p>
            <ul className="leaders">
              {hub.speakers!.map((sp) => (
                <li key={sp.name}>
                  <span className="avatar">{sp.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                  <b>{sp.name}</b>
                  {sp.title && <span className="soft">{sp.title}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {has("hackathon") && hub.hackathon && hub.hackathon.tracks.length > 0 && (
          <div className="block">
            <p className="label">Hackathon</p>
            <h2 className="h2">{hub.hackathon.theme || "Tracks"}</h2>
            {hub.hackathon.teamSize && <p className="soft">Teams: {hub.hackathon.teamSize}</p>}
            <div className="grid">
              {hub.hackathon.tracks.map((t) => (
                <div key={t.name} className="qlink"><b>{t.name}</b><span>{t.body}</span></div>
              ))}
            </div>
          </div>
        )}

        {(has("parking") && (hub.gettingHere.parking ?? []).length > 0) && (
          <div className="block">
            <p className="label">Getting here</p>
            <h2 className="h2">Parking</h2>
            <div className="grid">
              {hub.gettingHere.parking!.map((p) => (
                <div key={p.name} className="qlink"><b>{p.name}</b><span>{p.price && <strong>{p.price} </strong>}{p.body}</span></div>
              ))}
            </div>
          </div>
        )}

        {has("food") && hub.food.meals.length > 0 && (
          <div className="block">
            <p className="label">Food</p>
            {hub.food.included && <p>{hub.food.included}</p>}
            <ul className="filelist">
              {hub.food.meals.map((m) => <li key={m.title}><b>{m.time}</b> · {m.title}</li>)}
            </ul>
          </div>
        )}

        {full.org.is_nonprofit && full.org.donation_links.length > 0 && (
          <div className="block">
            <p className="label">Support {full.org.name}</p>
            <div className="row">
              {full.org.donation_links.map((d) => (
                <a key={d.url} className="btn" href={d.url} target="_blank" rel="noopener">{d.label} →</a>
              ))}
            </div>
          </div>
        )}

        {(files.length > 0 || hiddenCount > 0) && (
          <div className="block">
            <p className="label">Files and links</p>
            <h2 className="h2">Artifacts</h2>
            <div className="grid">
              {files.map((a) => (
                <a key={a.url} href={a.url} className="qlink" target="_blank" rel="noopener">
                  <b>{a.title} → {a.adminOnly && <span className="pill t-discern">Admin</span>}</b>
                  {a.description && <span>{a.description}</span>}
                </a>
              ))}
            </div>
            {hiddenCount > 0 && !user && <p className="soft"><Link href="/login">Sign in</Link> to see organizer files.</p>}
          </div>
        )}

        <p><Link href={`/o/${full.org.slug}`}>← All {full.org.name} events</Link></p>
      </div>
    </main>
  );
}
