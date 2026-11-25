import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EventCard from "@/components/EventCard";
import OrgTheme from "@/components/OrgTheme";
import { HOME_ORG_SLUG, allEvents, eventHref, getOrg, past, upcoming } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ org: string }> }) {
  const org = await getOrg((await params).org);
  return org ? { title: org.name, description: org.about } : {};
}

// An organization's public page: who they are, how to give, and their events.
export default async function OrgPage({ params }: { params: Promise<{ org: string }> }) {
  const slug = (await params).org;
  const org = await getOrg(slug);
  if (!org) {
    if (slug === "faithtech-la") redirect(`/${HOME_ORG_SLUG}`);
    notFound();
  }
  const list = await allEvents({ orgSlug: slug });
  const up = upcoming(list);
  const done = past(list);

  return (
    <main>
      <OrgTheme theme={org.theme} addons={org.addons} />
      <section className="hero">
        <div className="wrap hero-in">
          <p className="kicker">{org.is_nonprofit ? "Nonprofit organization" : "Organization"}</p>
          {org.addons.includes("custom_branding") && org.theme?.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.theme.logo} alt="" className="org-logo" />
          )}
          <h1>{org.name}</h1>
          {org.about && <p className="intro">{org.about}</p>}
          <div className="hero-facts">
            {org.is_nonprofit && org.donation_links.map((d) => (
              <a key={d.url} className="btn dark" href={d.url} target="_blank" rel="noopener">{d.label} →</a>
            ))}
            <Link className="venue" href={`/${org.slug}/resources`}><b>Resources</b><span>Slides, recordings, links</span></Link>
            {org.website && <a className="venue" href={org.website} target="_blank" rel="noopener"><b>Website</b><span>{org.website.replace(/^https?:\/\//, "")}</span></a>}
            {org.contact_email && <a className="venue" href={`mailto:${org.contact_email}`}><b>Contact</b><span>{org.contact_email}</span></a>}
          </div>
        </div>
      </section>
      <section className="wrap section">
        <p className="label">What&apos;s on</p>
        <h2 className="h2">Upcoming events</h2>
        <div className="events">
          {up.length ? up.map((e, i) => <EventCard key={e.key} event={e.event} next={i === 0} href={eventHref(e)} />) : <p className="soft">No upcoming events yet.</p>}
        </div>
        {done.length > 0 && (
          <details className="past">
            <summary>Past events ({done.length})</summary>
            <div className="events">{done.map((e) => <EventCard key={e.key} event={e.event} href={eventHref(e)} />)}</div>
          </details>
        )}
        <p className="soft small" style={{ marginTop: 24 }}>Run this organization? <Link href={`/manage/${org.slug}`}>Manage events</Link></p>
      </section>
    </main>
  );
}
