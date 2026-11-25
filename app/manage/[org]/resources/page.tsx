import Link from "next/link";
import Notice from "@/components/hub/Notice";
import { deleteResource, saveResource } from "@/app/manage/actions";
import { manageContext, orgLists } from "@/lib/manage";
import { RESOURCE_KINDS } from "@/lib/features";


type Res = { id: string; title: string; url: string; kind: string; topic: string; description: string; event_id: string | null; series_id: string | null; published: boolean };

export default async function Resources({ params, searchParams }: { params: Promise<{ org: string }>; searchParams: Promise<{ ok?: string; error?: string; edit?: string }> }) {
  const [{ org: slug }, { ok, error, edit }] = await Promise.all([params, searchParams]);
  const { supabase, org } = await manageContext(slug);
  const [{ series }, { data: resData }, { data: evData }] = await Promise.all([
    orgLists(supabase, org.id),
    supabase.from("resources").select("*").eq("org_id", org.id).order("topic").order("created_at", { ascending: false }),
    supabase.from("events").select("id,title,starts_on").eq("org_id", org.id).order("starts_on", { ascending: false }),
  ]);
  const resources = (resData ?? []) as Res[];
  const events = evData ?? [];
  const editing = resources.find((r) => r.id === edit);
  const topics = [...new Set(resources.map((r) => r.topic))];
  return (
    <div className="grid2">
      <form action={saveResource} className="block form" key={editing?.id ?? "new"}>
        <input type="hidden" name="org_slug" value={org.slug} />
        <input type="hidden" name="org_id" value={org.id} />
        {editing && <input type="hidden" name="resource_id" value={editing.id} />}
        <h2 className="h3">{editing ? "Edit resource" : "Add to the library"}</h2>
        <p className="soft small">Slides, recordings and links stay here after the event, sorted by topic, on your public <Link href={`/${org.slug}/resources`}>resource library</Link>.</p>
        <Notice ok={ok} error={error} />
        <label>Title<input name="title" required maxLength={160} defaultValue={editing?.title} /></label>
        <label>Link<input name="url" required defaultValue={editing?.url} placeholder="https://docs.google.com/..." /></label>
        <div className="form two">
          <label>
            Kind
            <select name="kind" defaultValue={editing?.kind ?? "slides"}>
              {RESOURCE_KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
            </select>
          </label>
          <label>
            Topic
            <input name="topic" list="topics" maxLength={60} defaultValue={editing?.topic} placeholder="AI and faith" />
            <datalist id="topics">{topics.map((t) => <option key={t} value={t} />)}</datalist>
          </label>
        </div>
        <label>Short note<textarea name="description" rows={2} maxLength={600} defaultValue={editing?.description} /></label>
        <div className="form two">
          <label>
            From event
            <select name="event_id" defaultValue={editing?.event_id ?? ""}>
              <option value="">None</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </label>
          <label>
            From series
            <select name="series_id" defaultValue={editing?.series_id ?? ""}>
              <option value="">None</option>
              {series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        </div>
        <label>
          Who can see it
          <select name="published" defaultValue={editing && !editing.published ? "off" : "on"}>
            <option value="on">Everyone</option>
            <option value="off">Only our team</option>
          </select>
        </label>
        <div className="row">
          <button className="btn">{editing ? "Save" : "Add resource"}</button>
          {editing && <Link href={`/manage/${org.slug}/resources`} className="btn ghost">Cancel</Link>}
        </div>
      </form>

      <div className="block">
        <h2 className="h3">Library</h2>
        {resources.length === 0 && <p className="soft">Nothing yet.</p>}
        {topics.map((t) => (
          <div key={t}>
            <p className="label">{t}</p>
            <ul className="res-list">
              {resources.filter((r) => r.topic === t).map((r) => (
                <li key={r.id}>
                  <a href={r.url} target="_blank" rel="noreferrer">{r.title}</a> <span className="pill soon">{RESOURCE_KINDS.find((k) => k.key === r.kind)?.label}</span>
                  {!r.published && <span className="pill soon">Team only</span>}
                  <span className="row small">
                    <Link href={`/manage/${org.slug}/resources?edit=${r.id}`}>Edit</Link>
                    <form action={deleteResource}>
                      <input type="hidden" name="org_slug" value={org.slug} />
                      <input type="hidden" name="resource_id" value={r.id} />
                      <button className="linkbtn small">Remove</button>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
