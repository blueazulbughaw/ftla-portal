import Link from "next/link";
import { notFound } from "next/navigation";
import { EVENTS, formatLong, getEvent, isPast, mapsUrl } from "@/lib/events";
import { getUser, isAdminEmail } from "@/lib/supabase/server";

export const revalidate = 3600; // re-check past/upcoming every hour

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const event = getEvent((await params).slug);
  return event ? { title: event.title, description: event.summary } : {};
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const event = getEvent((await params).slug);
  if (!event) notFound();

  const user = await getUser();
  const admin = isAdminEmail(user?.email);
  const past = isPast(event);
  const files = (event.artifacts ?? []).filter((a) => !a.adminOnly || admin);
  const hiddenCount = (event.artifacts ?? []).length - files.length;

  return (
    <main>
      <section className="hero">
        <div className="wrap hero-in">
          <p className="kicker">
            {formatLong(event.date)} {event.tentative && "· to be confirmed"}
          </p>
          <h1>{event.title}</h1>
          <p className="intro">{event.summary}</p>
          <div className="hero-facts">
            {event.address ? (
              <a className="venue" href={mapsUrl(event.address)} target="_blank" rel="noopener">
                <b>{event.place}</b>
                <span>
                  {event.address} · {event.time}
                </span>
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
            {past && <span className="pill soon dark">This event has ended</span>}
          </div>
        </div>
      </section>

      <div className="wrap section stack">
        {(event.description || event.organizer || event.price) && (
          <div className="block">
            <p className="label">About</p>
            {event.description && <p>{event.description}</p>}
            <p className="soft">
              {event.organizer && <>Hosted by {event.organizer}. </>}
              {event.price && <>Price: {event.price}.</>}
            </p>
          </div>
        )}

        {event.agenda && (
          <div className="block">
            <p className="label">The day</p>
            <h2 className="h2">Agenda</h2>
            <ol className="agenda">
              {event.agenda.map((a) => (
                <li key={a.time + a.title}>
                  <time>{a.time}</time>
                  <span>
                    <b>{a.title}</b>
                    {a.note && <span className="soft"> {a.note}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="block">
          <p className="label">Files and links</p>
          <h2 className="h2">Artifacts</h2>
          {files.length ? (
            <div className="grid">
              {files.map((a) => (
                <a key={a.url} href={a.url} className="qlink" target="_blank" rel="noopener">
                  <b>
                    {a.title} → {a.adminOnly && <span className="pill t-discern">Admin</span>}
                  </b>
                  {a.description && <span>{a.description}</span>}
                </a>
              ))}
            </div>
          ) : (
            <p className="soft">Nothing here yet.</p>
          )}
          {hiddenCount > 0 && !user && (
            <p className="soft">
              <Link href="/login">Sign in</Link> to see organizer files.
            </p>
          )}
        </div>

        <p>
          <Link href="/#events">← All events</Link>
        </p>
      </div>
    </main>
  );
}
