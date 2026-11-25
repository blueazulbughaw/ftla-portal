export const dynamic = "force-dynamic"; // events now come from the database

import Link from "next/link";
import EventCard from "@/components/EventCard";
import { LEADERS, LINKS, formatLong } from "@/lib/events";
import { HOME_ORG_SLUG, allEvents, eventHref, past as pastOf, upcoming as upcomingOf } from "@/lib/data";

const STEPS = [
  { name: "Lament", cls: "t-lament", text: "Name what is broken in our city and in our world." },
  { name: "Discern", cls: "t-discern", text: "Listen to God and to the people closest to the problem." },
  { name: "Build", cls: "t-build", text: "Make something real, together, with the gifts we have." },
  { name: "Steward", cls: "t-steward", text: "Care for what we built and the people it serves." },
];

const PLUG_IN = [
  { title: "Join the Slack", text: "Say hi in the FaithTech LA channel.", url: LINKS.slack },
  { title: "Get the newsletter", text: "New dates land in your inbox first.", url: LINKS.mailing },
  { title: "Shape what we Create", text: "Tell us what you want to build.", url: LINKS.create },
  { title: "Give", text: "Our events are free. Help keep them that way.", url: LINKS.give },
];

export default async function Home() {
  const list = await allEvents({ orgSlug: HOME_ORG_SLUG });
  const upcomingFull = upcomingOf(list);
  const pastFull = pastOf(list);
  const upcoming = upcomingFull.map((f) => f.event);
  const past = pastFull.map((f) => f.event);
  const hrefFor = (slug: string) => {
    const f = list.find((x) => x.event.slug === slug);
    return f ? eventHref(f) : `/events/${slug}`;
  };
  const next = upcoming[0];

  return (
    <main>
      <section className="hero">
        <div className="wrap hero-in">
          <p className="kicker">Los Angeles · Community hub</p>
          <h1>Christians in tech, building together in LA.</h1>
          <p className="intro">
            We gather builders, designers, founders and dreamers across Los Angeles to practice redemptive
            technology. Come to an event, join the Slack and build something that serves people.
          </p>
          {next && (
            <Link href={hrefFor(next.slug)} className="next-chip">
              <span className="sq">→</span>
              <span>
                <b>Next: {next.title}</b>
                <span className="s">{formatLong(next.date)}</span>
              </span>
            </Link>
          )}
        </div>
      </section>

      <section id="events" className="wrap section">
        <p className="label">What&apos;s coming up</p>
        <h2 className="h2">Upcoming events</h2>
        <p className="soft">Every gathering is open to anyone curious about faith and technology. Bring a friend.</p>
        <div className="events">
          {upcoming.length ? (
            upcoming.map((e, i) => <EventCard key={e.slug} event={e} next={i === 0} href={hrefFor(e.slug)} />)
          ) : (
            <div className="block">New dates coming soon. Join the mailing list or Slack and you&apos;ll hear first.</div>
          )}
        </div>
        {past.length > 0 && (
          <details className="past">
            <summary>Past events ({past.length})</summary>
            <div className="events">
              {past.map((e) => (
                <EventCard key={e.slug} event={e} href={hrefFor(e.slug)} />
              ))}
            </div>
          </details>
        )}
      </section>

      <section className="wrap section">
        <div className="block">
          <p className="label">How we build</p>
          <h2 className="h2">The Create Cycle</h2>
          <p className="soft">Everything we make follows the same four steps, from a single evening meetup to a full hackathon.</p>
          <ol className="steps">
            {STEPS.map((s) => (
              <li key={s.name}>
                <span className={`pill ${s.cls}`}>{s.name}</span>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="connect" className="wrap section">
        <p className="label">Get involved</p>
        <h2 className="h2">How to plug in</h2>
        <div className="grid">
          {PLUG_IN.map((c) => (
            <a key={c.title} href={c.url} className="qlink" target="_blank" rel="noopener">
              <b>{c.title} →</b>
              <span>{c.text}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="wrap section">
        <p className="label">The team</p>
        <h2 className="h2">Meet our leaders</h2>
        <ul className="leaders">
          {LEADERS.map((l) => (
            <li key={l.name}>
              <span className="avatar">{l.name.split(" ").map((p) => p[0]).join("")}</span>
              <b>{l.name}</b>
              <span className="soft">{l.role}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
