import Link from "next/link";
import Hero from "@/components/hub/Hero";
import Avatar from "@/components/hub/Avatar";
import { SetupNotice } from "@/components/hub/Notice";
import { hubContext } from "@/lib/hub-server";

export const metadata = { title: "Member directory" };

type Member = { display_name: string; avatar_url: string | null; headline: string | null; skills: string[]; interests: string[]; share_token: string; linkedin_url: string | null; website_url: string | null };

export default async function Directory({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const { supabase, needsSetup, profile } = await hubContext("/hub/directory");
  const { data } = needsSetup ? { data: [] } : await supabase.rpc("directory_search", { q: q.trim().slice(0, 60) });
  const people = (data ?? []) as Member[];
  const Tag = ({ t }: { t: string }) => <Link href={`/hub/directory?q=${encodeURIComponent(t)}`} className="chip">{t}</Link>;
  return (
    <>
      <Hero kicker="Community" title="Member directory." intro="Find people by skills and interests. Everyone here chose to be listed, and shows only what they chose to share." />
      <div className="hub-body">
        {needsSetup && <SetupNotice />}
        {!profile?.in_directory && (
          <p className="notice">You&apos;re not listed yet. <Link href="/hub/profile">Turn it on in My profile</Link> and add your skills and interests.</p>
        )}
        <form className="row res-search">
          <input name="q" defaultValue={q} placeholder="Search a skill, interest or name" aria-label="Search the directory" />
          <button className="btn small">Search</button>
          {q && <Link href="/hub/directory" className="btn ghost small">Clear</Link>}
        </form>
        <p className="soft small">{people.length} {people.length === 1 ? "person" : "people"}{q ? ` matching "${q}"` : ""}</p>
        <div className="grid">
          {people.map((p) => (
            <div key={p.share_token} className="card">
              <div className="row" style={{ alignItems: "center" }}>
                <Avatar name={p.display_name} url={p.avatar_url} />
                <div>
                  <strong>{p.display_name}</strong>
                  {p.headline && <div className="soft small">{p.headline}</div>}
                </div>
              </div>
              {p.skills.length > 0 && <div className="chips"><span className="label">Skills</span>{p.skills.map((t) => <Tag key={t} t={t} />)}</div>}
              {p.interests.length > 0 && <div className="chips"><span className="label">Interests</span>{p.interests.map((t) => <Tag key={t} t={t} />)}</div>}
              <div className="row small">
                <Link href={`/c/${p.share_token}`}>Contact card</Link>
                {p.linkedin_url && <a href={p.linkedin_url} target="_blank" rel="noopener">LinkedIn</a>}
                {p.website_url && <a href={p.website_url} target="_blank" rel="noopener">Website</a>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
