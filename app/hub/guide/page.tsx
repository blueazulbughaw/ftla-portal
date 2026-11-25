import Link from "next/link";
import Icon from "@/components/Icon";
import Hero from "@/components/hub/Hero";
import { hubContext } from "@/lib/hub-server";

export const metadata = { title: "Hub Guide" };

export default async function GuidePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const faqs = tab === "faqs";
  const { hub } = await hubContext("/hub/guide");
  return (
    <>
      <Hero kicker="FaithTech LA" title="Hub Guide." intro="Quick videos, helpful answers and tips to get the most from the hub." />
      <div className="hub-body">
        <nav className="tabs" aria-label="Hub guide">
          <Link href="/hub/guide" className={!faqs ? "on" : ""}><Icon name="play" size={18} /> Video guides</Link>
          <Link href="/hub/guide?tab=faqs" className={faqs ? "on" : ""}><Icon name="help" size={18} /> FAQs</Link>
        </nav>
        {!faqs ? (
          <div className="card">
            <div className="card-head">
              <div>
                <h2 className="h3">Get started with the hub</h2>
                <p className="soft small">Short how-to videos will be added here to help you get ready.</p>
              </div>
              <span className="card-ico"><Icon name="book" /></span>
            </div>
            <div className="grid3">
              {hub.guides.map((g) => (
                <div key={g.title} className="guide">
                  <div className="thumb">
                    <Icon name={g.icon} size={44} />
                    <span className="play"><Icon name="play" size={14} /></span>
                  </div>
                  <b>{g.title}</b>
                  <p className="soft small">{g.body}</p>
                  {g.videoUrl ? (
                    <a className="cta" href={g.videoUrl} target="_blank" rel="noopener">Watch <Icon name="external" size={14} /></a>
                  ) : (
                    <p className="small label">Video guide coming soon</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card">
            <h2 className="h3">Frequently asked questions</h2>
            <div className="faqs">
              {hub.faqs.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p className="soft">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
