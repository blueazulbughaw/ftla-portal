export const dynamic = "force-dynamic";

import Link from "next/link";
import { getUser, createClient, supabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: { absolute: "Community Hub" }, description: "Event pages, attendee hubs and planning tools for communities and nonprofits." };

const FEATURES = [
  { title: "Your own homepage", body: "Build it from sections: upcoming events, about us, links, your team and custom HTML. Reorder anything." },
  { title: "Event pages", body: "Agenda, speakers, venue and parking, food, Wi-Fi and links, all on one page per event." },
  { title: "Attendee hub", body: "Turn it on for an event and people sign in, save sessions, swap contacts and get updates on the day." },
  { title: "Planning and reports", body: "Tasks, budget, venues and volunteers while you plan, then who registered and who came." },
  { title: "Ticket sync", body: "Connect Luma today, with more ticketing tools on the way, so registrations land in one place." },
  { title: "Your look", body: "Pick a theme for free, or fully customize colors, fonts and logo." },
];

// The platform's front page. Each organization has its own homepage at /<org>.
export default async function Landing() {
  const user = await getUser();
  let orgs: { slug: string; name: string; about: string }[] = [];
  if (supabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("organizations").select("slug,name,about").order("name").limit(24);
    orgs = data ?? [];
  }
  return (
    <main>
      <section className="hero">
        <div className="wrap hero-in">
          <p className="kicker">Community Hub</p>
          <h1>A home for your community and its events.</h1>
          <p className="intro">
            Community Hub gives churches, nonprofits and meetup groups one place for their homepage, event pages, an attendee hub,
            planning tools and attendee reports.
          </p>
          <div className="row">
            <Link href="/manage/new" className="btn dark">Set up your organization →</Link>
            {user ? <Link href="/manage" className="btn ghost">Go to your admin</Link> : <Link href="/login" className="btn ghost">Log in</Link>}
          </div>
        </div>
      </section>

      <section className="wrap section">
        <p className="label">What you get</p>
        <h2 className="h2">Everything an organizer needs</h2>
        <div className="grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="qlink"><b>{f.title}</b><span>{f.body}</span></div>
          ))}
        </div>
      </section>

      {orgs.length > 0 && (
        <section className="wrap section">
          <p className="label">On Community Hub</p>
          <h2 className="h2">Communities</h2>
          <div className="grid">
            {orgs.map((o) => (
              <Link key={o.slug} href={`/${o.slug}`} className="qlink"><b>{o.name} →</b>{o.about && <span>{o.about}</span>}</Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
