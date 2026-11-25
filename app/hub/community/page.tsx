import Icon from "@/components/Icon";
import Hero from "@/components/hub/Hero";
import { hubContext } from "@/lib/hub-server";

export const metadata = { title: "Community" };

export default async function CommunityPage() {
  const { hub } = await hubContext("/hub/community");
  return (
    <>
      <Hero kicker="Stay connected" title="The FaithTech LA community." intro="Find community groups and ways to keep in touch after the event." />
      <div className="hub-body">
        <div className="card">
          <div className="card-head">
            <div>
              <h2 className="h3">Explore communities</h2>
              <p className="soft small">Groups and channels to join.</p>
            </div>
            <span className="card-ico"><Icon name="message" /></span>
          </div>
          <div className="grid2">
            {hub.communities.map((c) => (
              <a key={c.name} className="mini link-card" href={c.url} target="_blank" rel="noopener">
                <span className="label">{c.kind}</span>
                <b>{c.name}</b>
                <p className="soft">{c.body}</p>
                <Icon name="external" size={16} className="corner" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
