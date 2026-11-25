import Notice from "@/components/hub/Notice";
import { deleteType, saveType } from "@/app/manage/actions";
import { manageContext } from "@/lib/manage";
import { FEATURES, type FeatureKey } from "@/lib/features";
import type { Org } from "@/lib/data";

type Type = { id: string; name: string; features: FeatureKey[] };

function TypeForm({ org, t }: { org: Org; t?: Type }) {
  return (
    <form action={saveType} className="card form">
      <input type="hidden" name="org_slug" value={org.slug} />
      <input type="hidden" name="org_id" value={org.id} />
      {t && <input type="hidden" name="type_id" value={t.id} />}
      <label>{t ? "Name" : "New event type"}<input name="name" required maxLength={60} defaultValue={t?.name} placeholder="Prayer night" /></label>
      <div className="chips">
        {FEATURES.map((f) => (
          <label key={f.key} className="chip check" title={f.help}>
            <input type="checkbox" name="features" value={f.key} defaultChecked={t?.features.includes(f.key)} /> {f.label}
          </label>
        ))}
      </div>
      <div className="row">
        <button className="btn small">{t ? "Save" : "Add event type"}</button>
      </div>
    </form>
  );
}

export default async function Types({ params, searchParams }: { params: Promise<{ org: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ org: slug }, { ok, error }] = await Promise.all([params, searchParams]);
  const { supabase, org } = await manageContext(slug);
  const { data } = await supabase.from("event_types").select("id,name,features").eq("org_id", org.id).order("name");
  const types = (data ?? []) as Type[];
  return (
    <div className="block">
      <h2 className="h3">Event types</h2>
      <p className="soft small">Like post types in WordPress. Each type picks the sections its events get. Hover a section to see what it adds.</p>
      <Notice ok={ok} error={error} />
      <div className="grid">
        {types.map((t) => (
          <div key={t.id} className="type-item">
            <TypeForm org={org} t={t} />
            <form action={deleteType}>
              <input type="hidden" name="org_slug" value={org.slug} />
              <input type="hidden" name="type_id" value={t.id} />
              <button className="linkbtn small">Delete {t.name}</button>
            </form>
          </div>
        ))}
        <TypeForm org={org} />
      </div>
    </div>
  );
}
