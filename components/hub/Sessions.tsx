import Link from "next/link";
import Icon from "@/components/Icon";
import Hero from "./Hero";
import { SetupNotice } from "./Notice";
import SaveButton from "./SaveButton";
import { hubContext } from "@/lib/hub-server";
import { to12, type SessionKind } from "@/lib/hub";
import { formatLong } from "@/lib/events";

const KINDS: { value: "" | SessionKind; label: string }[] = [
  { value: "", label: "All" },
  { value: "talk", label: "Talks" },
  { value: "workshop", label: "Workshops" },
  { value: "community", label: "Community" },
];

// Shared by the Agenda page (all sessions) and My Schedule (saved only).
export default async function Sessions({ mine, kind }: { mine: boolean; kind?: string }) {
  const base = mine ? "/hub/schedule" : "/hub/agenda";
  const { supabase, user, needsSetup, event, eventKey, hub } = await hubContext(base);

  let savedIds: string[] = [];
  if (!needsSetup) {
    const { data } = await supabase.from("saved_sessions").select("session_id").eq("user_id", user.id).eq("event_slug", eventKey);
    savedIds = (data ?? []).map((r) => r.session_id);
  }
  const all = [...hub.sessions].sort((a, b) => a.start.localeCompare(b.start));
  const savedCount = all.filter((s) => savedIds.includes(s.id)).length;
  const list = all.filter((s) => (!mine || savedIds.includes(s.id)) && (!kind || s.kind === kind));

  return (
    <>
      <Hero
        kicker={mine ? "Your day" : "Build your day"}
        title={mine ? "My schedule." : "The agenda."}
        intro={`${formatLong(event.date)}. All times Pacific Time.${mine ? " Your saved sessions in time order." : " Add the sessions you want to catch."}`}
      />
      <div className="hub-body">
        {needsSetup && <SetupNotice />}
        <div className="seg" role="tablist">
          <Link href={`/hub/agenda${kind ? `?kind=${kind}` : ""}`} className={!mine ? "on" : ""} role="tab" aria-selected={!mine}>
            All sessions <span>{all.length}</span>
          </Link>
          <Link href={`/hub/schedule${kind ? `?kind=${kind}` : ""}`} className={mine ? "on" : ""} role="tab" aria-selected={mine}>
            My schedule <span>{savedCount}</span>
          </Link>
        </div>
        <div className="chips">
          {KINDS.map((k) => (
            <Link key={k.label} href={k.value ? `${base}?kind=${k.value}` : base} className={`chip ${(kind ?? "") === k.value ? "on" : ""}`}>
              {k.label}
            </Link>
          ))}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h2 className="h3">{mine ? "Saved sessions" : "Sessions"} <span className="count">{list.length}</span></h2>
              <p className="soft small">{mine ? "Saved to your account." : `${savedCount} saved to your schedule.`}</p>
            </div>
            <span className="card-ico"><Icon name="calendar" /></span>
          </div>
          {all.length === 0 ? (
            <p className="soft">The agenda for this event hasn&apos;t been posted yet.</p>
          ) : list.length === 0 ? (
            <div className="empty">
              <span className="card-ico"><Icon name="calendar" /></span>
              <b>{mine ? "Nothing saved yet." : "No sessions of this kind."}</b>
              {mine && <p className="soft small">Open <Link href="/hub/agenda">All sessions</Link> and press Add to Schedule.</p>}
            </div>
          ) : (
            <ul className="sessions">
              {list.map((s) => {
                const saved = savedIds.includes(s.id);
                return (
                  <li key={s.id} className={saved ? "is-saved" : ""}>
                    <div className="when">
                      <b>{to12(s.start)}</b>
                      {s.end && <span className="soft small">to {to12(s.end)} PT</span>}
                    </div>
                    <div className="what">
                      <h3>{s.title}</h3>
                      {s.description && <p className="soft">{s.description}</p>}
                      <div className="meta">
                        <span className={`kind k-${s.kind}`}>{s.kind[0].toUpperCase() + s.kind.slice(1)}</span>
                        {s.room && <span className="soft">{s.room}</span>}
                        {s.speaker && (
                          <span className="speaker">
                            <span className="mini-avatar">{s.speaker.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                            {s.speaker}
                          </span>
                        )}
                      </div>
                    </div>
                    {!needsSetup && <SaveButton eventSlug={eventKey} sessionId={s.id} saved={saved} mode={mine ? "remove" : "toggle"} />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
