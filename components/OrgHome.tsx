import Link from "next/link";
import EventCard from "@/components/EventCard";
import { formatLong } from "@/lib/events";
import { eventHref, past as pastOf, upcoming as upcomingOf, type FullEvent, type Org } from "@/lib/data";
import { cleanHtml, type Section } from "@/lib/home";

const Head = ({ s }: { s: Section }) => (
  <>
    {s.label && <p className="label">{s.label}</p>}
    {s.title && <h2 className="h2">{s.title}</h2>}
    {s.body && <p className="soft" style={{ whiteSpace: "pre-line" }}>{s.body}</p>}
  </>
);

// An organization's homepage, drawn section by section in the order its team chose.
export default function OrgHome({ org, sections, events }: { org: Org; sections: Section[]; events: FullEvent[] }) {
  const up = upcomingOf(events);
  const done = pastOf(events);
  const next = up[0];

  return (
    <main>
      {sections.filter((s) => !s.hidden).map((s) => {
        switch (s.type) {
          case "hero":
            return (
              <section key={s.id} className="hero">
                <div className="wrap hero-in">
                  {s.label && <p className="kicker">{s.label}</p>}
                  {org.addons.includes("custom_branding") && org.theme?.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={org.theme.logo} alt="" className="org-logo" />
                  )}
                  <h1>{s.title || org.name}</h1>
                  {s.body && <p className="intro" style={{ whiteSpace: "pre-line" }}>{s.body}</p>}
                  {s.extra && next && (
                    <Link href={eventHref(next)} className="next-chip">
                      <span className="sq">→</span>
                      <span>
                        <b>Next: {next.event.title}</b>
                        <span className="s">{formatLong(next.event.date)}</span>
                      </span>
                    </Link>
                  )}
                </div>
              </section>
            );
          case "events":
            return (
              <section key={s.id} id="events" className="wrap section">
                <Head s={s} />
                <div className="events">
                  {up.length ? (
                    up.map((e, i) => <EventCard key={e.key} event={e.event} next={i === 0} href={eventHref(e)} />)
                  ) : (
                    <div className="block">New dates coming soon.</div>
                  )}
                </div>
                {s.extra && done.length > 0 && (
                  <details className="past">
                    <summary>Past events ({done.length})</summary>
                    <div className="events">{done.map((e) => <EventCard key={e.key} event={e.event} href={eventHref(e)} />)}</div>
                  </details>
                )}
              </section>
            );
          case "text":
            return (
              <section key={s.id} className="wrap section">
                <div className="block"><Head s={s} /></div>
              </section>
            );
          case "cards":
            return (
              <section key={s.id} className="wrap section">
                <div className="block">
                  <Head s={s} />
                  <ol className="steps">
                    {(s.items ?? []).map((c, i) => (
                      <li key={i}>
                        <span className={`pill ${["t-lament", "t-discern", "t-build", "t-steward"][i % 4]}`}>{c.title}</span>
                        {c.body && <p>{c.body}</p>}
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            );
          case "links":
            return (
              <section key={s.id} id="connect" className="wrap section">
                <Head s={s} />
                <div className="grid">
                  {(s.items ?? []).map((c, i) =>
                    c.url ? (
                      <a key={i} href={c.url} className="qlink" target={c.url.startsWith("/") ? undefined : "_blank"} rel="noopener">
                        <b>{c.title} →</b>
                        {c.body && <span>{c.body}</span>}
                      </a>
                    ) : (
                      <div key={i} className="qlink"><b>{c.title}</b>{c.body && <span>{c.body}</span>}</div>
                    ),
                  )}
                </div>
              </section>
            );
          case "people":
            return (
              <section key={s.id} className="wrap section">
                <Head s={s} />
                <ul className="leaders">
                  {(s.items ?? []).map((l, i) => (
                    <li key={i}>
                      <span className="avatar">{l.title.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
                      <b>{l.title}</b>
                      {l.body && <span className="soft">{l.body}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            );
          case "donate":
            if (!org.is_nonprofit || !org.donation_links.length) return null;
            return (
              <section key={s.id} className="wrap section">
                <div className="block">
                  <Head s={s} />
                  <div className="row">
                    {org.donation_links.map((d) => (
                      <a key={d.url} className="btn" href={d.url} target="_blank" rel="noopener">{d.label} →</a>
                    ))}
                  </div>
                </div>
              </section>
            );
          case "html":
            return (
              <section key={s.id} className="wrap section">
                {s.title && <h2 className="h2">{s.title}</h2>}
                <div className="custom-html" dangerouslySetInnerHTML={{ __html: cleanHtml(s.html ?? "") }} />
              </section>
            );
          default:
            return null;
        }
      })}
      <section className="wrap section">
        <p className="soft small">
          {org.website && <><a href={org.website} target="_blank" rel="noopener">Website</a> · </>}
          {org.contact_email && <><a href={`mailto:${org.contact_email}`}>{org.contact_email}</a> · </>}
          Run this organization? <Link href={`/${org.slug}/admin`}>Admin</Link>
        </p>
      </section>
    </main>
  );
}
