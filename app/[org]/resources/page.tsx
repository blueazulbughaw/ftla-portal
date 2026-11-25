import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrg, orgResources } from "@/lib/data";
import { RESOURCE_KINDS } from "@/lib/features";
import OrgTheme from "@/components/OrgTheme";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ org: string }> }) {
  const org = await getOrg((await params).org);
  return org ? { title: `${org.name} resources` } : {};
}

// Slides, recordings and links from past events, by topic. ?q= searches, ?topic= filters.
export default async function OrgResources({ params, searchParams }: { params: Promise<{ org: string }>; searchParams: Promise<{ q?: string; topic?: string }> }) {
  const [{ org: slug }, { q = "", topic }] = await Promise.all([params, searchParams]);
  const org = await getOrg(slug);
  if (!org) notFound();
  const all = await orgResources(org.id);
  const topics = [...new Set(all.map((r) => r.topic))];
  const needle = q.trim().toLowerCase();
  const shown = all.filter((r) => (!topic || r.topic === topic) && (!needle || `${r.title} ${r.description} ${r.topic}`.toLowerCase().includes(needle)));
  return (
    <main className="wrap section">
      <OrgTheme theme={org.theme} addons={org.addons} />
      <p className="label"><Link href={`/${org.slug}`}>{org.name}</Link></p>
      <h1 className="h2">Resource library</h1>
      <p className="soft">Slides, recordings and links from our events, kept here after they end.</p>
      <form className="row res-search">
        <input name="q" defaultValue={q} placeholder="Search resources" aria-label="Search resources" />
        {topic && <input type="hidden" name="topic" value={topic} />}
        <button className="btn small">Search</button>
      </form>
      <div className="chips">
        <Link href={`/${org.slug}/resources`} className={`chip ${!topic ? "on" : ""}`}>All</Link>
        {topics.map((t) => <Link key={t} href={`/${org.slug}/resources?topic=${encodeURIComponent(t)}`} className={`chip ${topic === t ? "on" : ""}`}>{t}</Link>)}
      </div>
      {shown.length === 0 && <p className="soft" style={{ marginTop: 16 }}>Nothing here yet.</p>}
      {(topic ? [topic] : topics).map((t) => {
        const items = shown.filter((r) => r.topic === t);
        if (!items.length) return null;
        return (
          <section key={t} style={{ marginTop: 24 }}>
            <h2 className="h3">{t}</h2>
            <div className="grid">
              {items.map((r) => (
                <a key={r.id} href={r.url} target="_blank" rel="noopener" className="card">
                  <span className="pill soon">{RESOURCE_KINDS.find((k) => k.key === r.kind)?.label ?? "Link"}</span>
                  <strong>{r.title}</strong>
                  {r.description && <span className="soft small">{r.description}</span>}
                </a>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
