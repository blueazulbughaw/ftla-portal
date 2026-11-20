import Link from "next/link";
import { type PortalEvent, isPast, monthDay } from "@/lib/events";

export default function EventCard({ event, next }: { event: PortalEvent; next?: boolean }) {
  const { mo, dd } = monthDay(event.date);
  const past = isPast(event);
  return (
    <Link href={`/events/${event.slug}`} className={`event${next ? " is-next" : ""}`}>
      <div className="date-tile">
        <span className="mo">{mo}</span>
        <span className="dd">{dd}</span>
      </div>
      <div className="body">
        <h3>
          {next && <span className="next-flag">Next up</span>}
          {event.title}
        </h3>
        <p className="desc">{event.summary}</p>
        <p className="meta">
          {event.tentative && <span className="tbc">Date to be confirmed</span>}
          <span>{event.time}</span>
          <span>{event.place}</span>
        </p>
      </div>
      <div className="side">
        <span className={`cat ${event.category}`}>{event.label}</span>
        {event.price && <span className="price">{event.price}</span>}
        {past && <span className="pill soon">Past</span>}
      </div>
    </Link>
  );
}
