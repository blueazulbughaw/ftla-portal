import Link from "next/link";
import { notFound } from "next/navigation";
import EventTabs from "@/components/manage/EventTabs";
import { manageContext } from "@/lib/manage";
import { formatLong } from "@/lib/events";

// Every event's admin pages share this header: its name, date, links, and the tabs.
export default async function EventAdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ org: string; id: string }> }) {
  const { org: slug, id } = await params;
  const { supabase, org } = await manageContext(slug);
  const { data: event } = await supabase.from("events").select("id,slug,title,starts_on,published").eq("id", id).eq("org_id", org.id).maybeSingle();
  if (!event) notFound();
  return (
    <div className="event-admin">
      <div className="card-head">
        <div>
          <p className="label"><Link href={`/${org.slug}/admin`}>← All events</Link></p>
          <h2 className="h2">{event.title}</h2>
          <p className="soft small">
            {formatLong(event.starts_on)} · <span className={`pill ${event.published ? "" : "soon"}`}>{event.published ? "Published" : "Draft"}</span>
          </p>
        </div>
        <div className="row">
          {event.published && <Link href={`/${org.slug}/events/${event.slug}`} className="btn ghost small">Public page</Link>}
          {org.addons.includes("participant_hub") && <Link href="/hub" className="btn ghost small">Attendee hub</Link>}
        </div>
      </div>
      <EventTabs base={`/${org.slug}/admin/events/${id}`} />
      {children}
    </div>
  );
}
