import Link from "next/link";
import { saveEvent } from "@/app/manage/actions";
import { FEATURES, type FeatureKey } from "@/lib/features";
import type { EventDetails, EventRow, Org } from "@/lib/data";
import { DEFAULT_SESSION_KINDS, SPEAKER_KINDS } from "@/lib/hub";
import AgendaEditor from "./AgendaEditor";
import {
  FORMATS,
  listToText,
  mealsToText,
  pairsToText,
  parkingToText,
  artifactsToText,
} from "@/lib/details-format";

type Type = { id: string; name: string; features: FeatureKey[] };

// The add/edit event form. Each feature's boxes only show when the chosen event type
// has that feature. A small <style> block does this, so it works without JavaScript.

export default function EventForm({ org, types, event }: { org: Org; types: Type[]; event?: EventRow }) {
  const d: EventDetails = event?.details ?? {};
  const h = d.hackathon;
  const showRules = [
    ...types.flatMap((t) => t.features.map((f) => `.event-form:has(select[name=type_id] option[value="${t.id}"]:checked) .f-${f}`)),
    `.event-form:has(select[name=type_id] option[value=""]:checked) .f-location`,
    `.event-form:has(select[name=type_id] option[value=""]:checked) .f-registration`,
  ];
  const label = (k: FeatureKey) => FEATURES.find((f) => f.key === k)!.label;
  const Hint = ({ f }: { f: string }) => <span className="soft small hint">One per line: <code>{f}</code></span>;

  return (
    <form action={saveEvent} className="form event-form">
      <style>{`.event-form .feat{display:none}${showRules.join(",")}{display:grid}`}</style>
      <input type="hidden" name="org_slug" value={org.slug} />
      <input type="hidden" name="org_id" value={org.id} />
      {event && <input type="hidden" name="event_id" value={event.id} />}

      <fieldset className="block" id="basics">
        <legend className="h3">Basics</legend>
        <label>Title<input name="title" required maxLength={160} defaultValue={event?.title} /></label>
        <label>
          Event type
          <select name="type_id" defaultValue={event?.type_id ?? types[0]?.id ?? ""}>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            <option value="">No type (just the basics)</option>
          </select>
          <span className="soft small hint">The type decides which sections below appear. <Link href={`/${org.slug}/admin/types`}>Edit event types</Link></span>
        </label>
        <div className="form two">
          <label>Date<input name="starts_on" type="date" required defaultValue={event?.starts_on} /></label>
          <label>Time<input name="time_text" maxLength={80} placeholder="6:30 PM - 9:00 PM" defaultValue={event?.time_text} /></label>
        </div>
        <label>Venue<input name="place" maxLength={160} placeholder="Venue name" defaultValue={event?.place} /></label>
        <label>Address<input name="address" maxLength={240} defaultValue={event?.address ?? ""} /></label>
        <label>Short summary<textarea name="summary" rows={2} maxLength={400} defaultValue={event?.summary} /></label>
        <label>Full description<textarea name="description" rows={5} maxLength={5000} defaultValue={event?.description ?? ""} /></label>
        <label>Registration link<input name="register_url" placeholder="https://lu.ma/..." defaultValue={event?.register_url ?? ""} /></label>
        <label className="inline"><input type="checkbox" name="published" defaultChecked={event?.published} /> Published (shows on your public page)</label>
        {org.addons.includes("participant_hub") ? (
          <label className="inline">
            <input type="hidden" name="hub_field" value="1" />
            <input type="checkbox" name="hub_enabled" defaultChecked={event ? event.hub_enabled !== false : true} /> Create participant hub
            <span className="soft small hint">On: people sign in, add this event to their upcoming events, and get the full hub (agenda, schedule, check-in and more). Off: just a public landing page with the details.</span>
          </label>
        ) : (
          <p className="soft small">This event will be a public landing page. Turn on the Participant hub add-on to let people sign in and add it to their upcoming events.</p>
        )}
      </fieldset>

      <fieldset className="block feat f-location" id="getting-here">
        <legend className="h3">{label("location")}</legend>
        <label>Public transit<textarea name="d_transit" rows={2} defaultValue={d.transit} /></label>
        <label>Carpool<textarea name="d_carpool" rows={2} defaultValue={d.carpool} /></label>
        <label>Rideshare drop-off<textarea name="d_rideshare" rows={2} defaultValue={d.rideshare} /></label>
      </fieldset>

      <fieldset className="block feat f-parking">
        <legend className="h3">{label("parking")}</legend>
        <label>Parking options<textarea name="d_parking" rows={4} defaultValue={parkingToText(d.parking)} /><Hint f={FORMATS.parking} /></label>
      </fieldset>

      <fieldset className="block feat f-registration">
        <legend className="h3">{label("registration")}</legend>
        <label>What to know<textarea name="d_reg_body" rows={2} defaultValue={d.registration?.body} /></label>
        <label>Check-in steps<textarea name="d_reg_steps" rows={3} defaultValue={listToText(d.registration?.steps)} /><span className="soft small hint">One step per line.</span></label>
      </fieldset>

      <fieldset className="block feat f-agenda f-speakers" id="agenda">
        <legend className="h3">Agenda and speakers</legend>
        <label>
          Agenda types
          <input name="d_session_kinds" defaultValue={(d.sessionKinds ?? DEFAULT_SESSION_KINDS).join(", ")} placeholder="talk, workshop, panel, dining" />
          <span className="soft small hint">Separate with commas. These are the choices for each item&apos;s Type, and attendees can filter the agenda by them.</span>
        </label>
        <AgendaEditor
          initial={d.sessions ?? []}
          initialSpeakers={d.speakers ?? []}
          kinds={d.sessionKinds ?? DEFAULT_SESSION_KINDS}
          speakerKinds={SPEAKER_KINDS}
        />
      </fieldset>

      <fieldset className="block feat f-food" id="food">
        <legend className="h3">{label("food")}</legend>
        <label>What&apos;s included<input name="d_food_included" defaultValue={d.food?.included} placeholder="Lunch and snacks are free for everyone." /></label>
        <label>Meals<textarea name="d_meals" rows={4} defaultValue={mealsToText(d.food?.meals)} /><Hint f={FORMATS.meals} /></label>
      </fieldset>

      <fieldset className="block feat f-hackathon">
        <legend className="h3">{label("hackathon")}</legend>
        <div className="form two">
          <label>Theme<input name="d_hack_theme" defaultValue={h?.theme} /></label>
          <label>Team size<input name="d_hack_team" defaultValue={h?.teamSize} placeholder="2 to 5 people" /></label>
        </div>
        <label>Tracks<textarea name="d_tracks" rows={4} defaultValue={pairsToText(h?.tracks)} /><Hint f={FORMATS.tracks} /></label>
        <label>Rules<textarea name="d_rules" rows={4} defaultValue={listToText(h?.rules)} /><span className="soft small hint">One rule per line.</span></label>
        <label>Judging<textarea name="d_judging" rows={3} defaultValue={listToText(h?.judging)} /><span className="soft small hint">One judging point per line.</span></label>
        <div className="form two">
          <label>Submission link<input name="d_submission_url" defaultValue={h?.submissionUrl} placeholder="https://devpost.com/..." /></label>
          <label>Resources link<input name="d_resources_url" defaultValue={h?.resourcesUrl} /></label>
        </div>
      </fieldset>

      <fieldset className="block feat f-perks">
        <legend className="h3">{label("perks")}</legend>
        <label>Perks<textarea name="d_perks" rows={4} defaultValue={pairsToText(d.perks)} /><Hint f={FORMATS.perks} /></label>
      </fieldset>

      <fieldset className="block feat f-on_the_day" id="on-the-day">
        <legend className="h3">{label("on_the_day")}</legend>
        <div className="form two">
          <label>Wi-Fi network<input name="d_wifi_network" defaultValue={d.wifi?.network} /></label>
          <label>Wi-Fi password<input name="d_wifi_password" defaultValue={d.wifi?.password} /></label>
        </div>
        <label>Wi-Fi note<input name="d_wifi_note" defaultValue={d.wifi?.note} placeholder="Ask a volunteer if it doesn't connect." /></label>
        <label>Day-of checklist and notes<textarea name="d_on_the_day" rows={5} defaultValue={pairsToText(d.onTheDay)} /><Hint f={FORMATS.onTheDay} /></label>
      </fieldset>

      <fieldset className="block" id="links">
        <legend className="h3">Slides and links</legend>
        <p className="soft small">Shows on the event page, like the links on DevFest. Mark a line &quot;team&quot; to keep it to your team.</p>
        <label>Links<textarea name="d_artifacts" rows={4} defaultValue={artifactsToText(d.artifacts)} /><Hint f={FORMATS.artifacts} /></label>
      </fieldset>

      <fieldset className="block">
        <legend className="h3">Feedback survey</legend>
        <p className="soft small">Shows in the attendee hub checklist and on the On the day tab.</p>
        <label>Survey link<input name="d_survey_url" defaultValue={d.survey?.url} placeholder="https://forms.gle/..." /></label>
        <div className="form two">
          <label>Button text<input name="d_survey_label" defaultValue={d.survey?.label} placeholder="Share your feedback" /></label>
          <label>Short note<input name="d_survey_note" defaultValue={d.survey?.note} placeholder="Takes two minutes." /></label>
        </div>
      </fieldset>

      <div className="row sticky-save">
        <button className="btn">{event ? "Save event" : "Create event"}</button>
        <Link href={`/${org.slug}/admin`} className="btn ghost">Back to events</Link>
      </div>
    </form>
  );
}
