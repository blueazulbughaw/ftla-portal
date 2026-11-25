import Link from "next/link";
import Notice from "@/components/hub/Notice";
import { deleteSeries, saveSeries } from "@/app/manage/actions";
import { manageContext, orgLists } from "@/lib/manage";

export default async function SeriesPage({ params, searchParams }: { params: Promise<{ org: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ org: slug }, { ok, error }] = await Promise.all([params, searchParams]);
  const { supabase, org, hasAddon } = await manageContext(slug);
  const { chapters, series } = await orgLists(supabase, org.id);
  const { data: evs } = await supabase.from("events").select("series_id").eq("org_id", org.id).not("series_id", "is", null);
  const count = (id: string) => (evs ?? []).filter((e) => e.series_id === id).length;
  const hidden = (
    <>
      <input type="hidden" name="org_slug" value={org.slug} />
      <input type="hidden" name="org_id" value={org.id} />
    </>
  );
  const ChapterPick = ({ value }: { value?: string | null }) =>
    chapters.length ? (
      <label>
        Chapter
        <select name="chapter_id" defaultValue={value ?? ""}>
          <option value="">Whole organization</option>
          {chapters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
    ) : null;
  return (
    <div className="block">
      <h2 className="h3">Series and cohorts</h2>
      <p className="soft small">
        Group events that belong together: a cohort, a workshop series, a monthly meetup. Each event in a series is one session. Pick the series on each event,
        then check people in on the event&apos;s report to track attendance.
      </p>
      <Notice ok={ok} error={error} />
      <div className="grid">
        {series.map((s) => (
          <div key={s.id} className="type-item">
            <form action={saveSeries} className="card form">
              {hidden}
              <input type="hidden" name="series_id" value={s.id} />
              <label>Name<input name="name" defaultValue={s.name} required maxLength={120} /></label>
              <label>About<textarea name="description" rows={2} defaultValue={s.description} maxLength={2000} /></label>
              <ChapterPick value={s.chapter_id} />
              <span className="soft small">{count(s.id)} sessions{hasAddon("reporting") && <> · <Link href={`/manage/${org.slug}/reports#series-${s.id}`}>Attendance</Link></>}</span>
              <p><button className="btn small">Save</button></p>
            </form>
            <form action={deleteSeries}>
              {hidden}
              <input type="hidden" name="series_id" value={s.id} />
              <button className="linkbtn small">Delete {s.name}</button>
            </form>
          </div>
        ))}
        <form action={saveSeries} className="card form">
          {hidden}
          <label>New series<input name="name" required maxLength={120} placeholder="Spring 2027 builders cohort" /></label>
          <label>About<textarea name="description" rows={2} maxLength={2000} /></label>
          <ChapterPick />
          <p><button className="btn small">Add series</button></p>
        </form>
      </div>
    </div>
  );
}
