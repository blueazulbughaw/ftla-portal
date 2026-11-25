import Link from "next/link";
import { notFound } from "next/navigation";
import EventForm from "@/components/manage/EventForm";
import Notice from "@/components/hub/Notice";
import { copyEvent } from "@/app/manage/actions";
import { manageContext, orgLists } from "@/lib/manage";
import type { EventRow } from "@/lib/data";
import type { FeatureKey } from "@/lib/features";

export default async function EditEvent({ params, searchParams }: { params: Promise<{ org: string; id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ org: slug, id }, { ok, error }] = await Promise.all([params, searchParams]);
  const { supabase, org } = await manageContext(slug);
  const lists = await orgLists(supabase, org.id);
  const [{ data: event }, { data: types }] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).eq("org_id", org.id).maybeSingle(),
    supabase.from("event_types").select("id,name,features").eq("org_id", org.id).order("name"),
  ]);
  if (!event) notFound();
  return (
    <>
      <div className="card-head">
        <h2 className="h3">Edit {event.title}</h2>
        <Link href={`/manage/${org.slug}/events/${event.id}/plan`} className="btn ghost small">Planning</Link>
      </div>
      <Notice ok={ok} error={error} />
      <details className="block copy-event">
        <summary><strong>Use as a template</strong> <span className="soft small">Copy this event, with all its sections, to a new date.</span></summary>
        <form action={copyEvent} className="form">
          <input type="hidden" name="org_slug" value={org.slug} />
          <input type="hidden" name="event_id" value={event.id} />
          <div className="form two">
            <label>New date<input type="date" name="starts_on" required /></label>
            <label>Title for the copy<input name="title" defaultValue={event.title} maxLength={160} /></label>
          </div>
          <label className="inline"><input type="checkbox" name="copy_plan" defaultChecked /> Also copy the planning to-dos, budget, promotion plan and shopping list (reset to not started)</label>
          <p><button className="btn small">Make a copy</button></p>
        </form>
      </details>
      <EventForm org={org} chapters={lists.chapters} series={lists.series} event={event as EventRow} types={(types ?? []) as { id: string; name: string; features: FeatureKey[] }[]} />
    </>
  );
}
