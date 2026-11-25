import Link from "next/link";
import { notFound } from "next/navigation";
import Icon, { type AnyIcon } from "@/components/Icon";
import Hero from "@/components/hub/Hero";
import Notice, { SetupNotice } from "@/components/hub/Notice";
import { saveMealPrefs } from "../../actions";
import { hubContext } from "@/lib/hub-server";
import { MEAL_OPTIONS } from "@/lib/hub";
import { formatLong, mapsUrl } from "@/lib/events";

const TABS: { slug: string; label: string; icon: AnyIcon }[] = [
  { slug: "registration", label: "Registration", icon: "ticket" },
  { slug: "getting-here", label: "Getting here", icon: "pin" },
  { slug: "food", label: "Food & drinks", icon: "food" },
  { slug: "perks", label: "Perks", icon: "gift" },
  { slug: "on-the-day", label: "On the day", icon: "calendar" },
];

export const metadata = { title: "Event experience" };

export default async function ExperiencePage({
  params,
  searchParams,
}: {
  params: Promise<{ tab: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { tab } = await params;
  const { ok, error } = await searchParams;
  if (!TABS.some((t) => t.slug === tab)) notFound();
  const { profile, needsSetup, event, hub } = await hubContext(`/hub/experience/${tab}`);
  const title = TABS.find((t) => t.slug === tab)!.label;

  return (
    <>
      <Hero kicker={event.title} title="Your event experience." intro="Everything you need to know before you arrive." />
      <div className="hub-body">
        <nav className="tabs" aria-label="Event experience">
          {TABS.map((t) => (
            <Link key={t.slug} href={`/hub/experience/${t.slug}`} className={t.slug === tab ? "on" : ""} aria-current={t.slug === tab ? "page" : undefined}>
              <Icon name={t.icon} size={18} /> {t.label}
            </Link>
          ))}
        </nav>
        <Notice ok={ok} error={error} />

        {tab === "registration" && (
          <Card title={title} sub={`Your ticket and check-in for ${event.title}.`} icon="ticket">
            <div className="callout">
              <Icon name="ticket" />
              <div>
                <b>{formatLong(event.date)} · {event.time}</b>
                <p className="soft">{hub.registration.body}</p>
              </div>
            </div>
            {hub.registration.steps && (
              <ol className="steps-list">
                {hub.registration.steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
            )}
            {event.registerUrl && (
              <p><a className="btn" href={event.registerUrl} target="_blank" rel="noopener">{event.registerLabel ?? "Register"} <Icon name="external" size={16} /></a></p>
            )}
          </Card>
        )}

        {tab === "getting-here" && (
          <Card title={title} sub={`Venue address and directions for ${event.title}.`} icon="pin">
            <div className="callout">
              <Icon name="pin" />
              <div>
                <b>{event.place}</b>
                {event.address && <p className="soft">{event.address}</p>}
                {event.address && (
                  <a className="cta" href={mapsUrl(event.address)} target="_blank" rel="noopener">Open Google Maps <Icon name="external" size={14} /></a>
                )}
              </div>
            </div>
            {event.address && (
              <iframe
                className="map"
                title={`Map of ${event.place}`}
                loading="lazy"
                src={`https://www.google.com/maps?q=${encodeURIComponent(`${event.place}, ${event.address}`)}&output=embed`}
              />
            )}
            <div className="grid3">
              {hub.gettingHere.transit && <Mini icon="train" title="Transit" body={hub.gettingHere.transit} />}
              {hub.gettingHere.carpool && <Mini icon="car" title="Carpool" body={hub.gettingHere.carpool} />}
              {hub.gettingHere.rideshare && <Mini icon="car" title="Rideshare" body={hub.gettingHere.rideshare} />}
            </div>
            {hub.gettingHere.parking && (
              <>
                <h3 className="h3 mt">Parking</h3>
                <p className="soft small">Options near {event.place}.</p>
                <div className="grid2">
                  {hub.gettingHere.parking.map((p) => (
                    <div key={p.name} className="mini">
                      <b>{p.name}</b>
                      <p className="soft">{p.price && <strong>{p.price} </strong>}{p.body}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        )}

        {tab === "food" && (
          <Card title={title} sub="Meal information for your event day." icon="food">
            {hub.food.included && (
              <div className="callout"><Icon name="food" /><p>{hub.food.included}</p></div>
            )}
            <div className="grid2">
              <div className="stack-sm">
                {hub.food.meals.length === 0 && <p className="soft">Meal details will be posted here.</p>}
                {hub.food.meals.map((m) => (
                  <div key={m.title} className="mini">
                    <b><Icon name="coffee" size={16} /> {m.time} · {m.title}</b>
                    <p className="soft">{m.body}</p>
                  </div>
                ))}
              </div>
              <form action={saveMealPrefs} className="mini">
                <b>Meal preferences</b>
                <p className="soft small">Select all that apply. This stays private to your account and the organizers, and helps plan the food.</p>
                {needsSetup && <SetupNotice />}
                <div className="chips">
                  {MEAL_OPTIONS.map((m) => (
                    <label key={m} className="chip check">
                      <input type="checkbox" name="meal" value={m} defaultChecked={profile?.meal_prefs?.includes(m)} />
                      {m}
                    </label>
                  ))}
                </div>
                <button className="btn wide" disabled={needsSetup}>Save preferences</button>
              </form>
            </div>
          </Card>
        )}

        {tab === "perks" && (
          hub.perks.length === 0 ? (
            <Card title={title} sub="Credits, offers and giveaways." icon="gift">
              <p className="soft">No perks have been posted for this event yet.</p>
            </Card>
          ) : (
            <div className="grid2">
              {hub.perks.map((p) => (
                <div key={p.title} className="card">
                  <span className="card-ico"><Icon name="gift" /></span>
                  <h2 className="h3">{p.title}</h2>
                  {p.stats && (
                    <dl className="stats">
                      {p.stats.map((s) => (
                        <div key={s.label}><dt>{s.value}</dt><dd className="soft">{s.label}</dd></div>
                      ))}
                    </dl>
                  )}
                  <p className="soft">{p.body}</p>
                  {p.steps && (
                    <>
                      <b>How to claim</b>
                      <ul className="bullets">{p.steps.map((s) => <li key={s}>{s}</li>)}</ul>
                    </>
                  )}
                  {p.link && <a className="cta" href={p.link.url} target="_blank" rel="noopener">{p.link.label} <Icon name="external" size={14} /></a>}
                </div>
              ))}
            </div>
          )
        )}

        {tab === "on-the-day" && (
          <Card title={title} sub={`Everything you need to know for ${formatLong(event.date)} will be posted here.`} icon="calendar">
            {hub.onTheDay.length === 0 ? (
              <p className="soft">Day-of details will be posted here closer to the event.</p>
            ) : (
              <div className="grid3">
                {hub.onTheDay.map((c) => (
                  <div key={c.title} className="mini">
                    <b>{c.icon && <Icon name={c.icon} size={18} />} {c.title}</b>
                    {c.body && <p className="soft">{c.body}</p>}
                    {c.items && <ul className="bullets">{c.items.map((i) => <li key={i}>{i}</li>)}</ul>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </>
  );
}

function Card({ title, sub, icon, children }: { title: string; sub: string; icon: AnyIcon; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2 className="h3">{title}</h2>
          <p className="soft small">{sub}</p>
        </div>
        <span className="card-ico"><Icon name={icon} /></span>
      </div>
      {children}
    </div>
  );
}

function Mini({ icon, title, body }: { icon: AnyIcon; title: string; body: string }) {
  return (
    <div className="mini">
      <b><Icon name={icon} size={18} /> {title}</b>
      <p className="soft">{body}</p>
    </div>
  );
}
