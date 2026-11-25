import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import Avatar from "@/components/hub/Avatar";
import { saveContact } from "@/app/hub/actions";
import { createClient, getUser, supabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Contact card", robots: { index: false } };
export const dynamic = "force-dynamic";

// What people see after scanning someone's QR code.
export default async function ShareCard({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!supabaseConfigured() || !/^[a-z0-9]{10,64}$/i.test(token)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_share_card", { token });
  const card = Array.isArray(data) ? data[0] : null;
  if (!card) notFound();
  const user = await getUser();
  const isMe = user?.id === card.id;

  return (
    <main className="wrap narrow section">
      <div className="block share-card">
        <p className="label">FaithTech LA contact card</p>
        <div className="who-row">
          <Avatar name={card.display_name} url={card.avatar_url} size={72} />
          <h1 className="h2">{card.display_name ?? "A FaithTech LA attendee"}</h1>
        </div>
        <ul className="facts">
          {card.contact_email && <li><Icon name="message" /> <a href={`mailto:${card.contact_email}`}>{card.contact_email}</a></li>}
          {card.phone && <li><Icon name="user" /> <a href={`tel:${card.phone}`}>{card.phone}</a></li>}
          {card.linkedin_url && <li><Icon name="briefcase" /> <a href={card.linkedin_url} target="_blank" rel="noopener">LinkedIn</a></li>}
          {card.website_url && <li><Icon name="external" /> <a href={card.website_url} target="_blank" rel="noopener">{card.website_url.replace(/^https?:\/\//, "")}</a></li>}
        </ul>
        {isMe ? (
          <p className="notice">This is how your card looks to others. <Link href="/hub/profile">Edit what you share</Link>.</p>
        ) : (
          <form action={saveContact}>
            <input type="hidden" name="token" value={token} />
            <button className="btn">{user ? "Save to my contacts" : "Sign in to save this contact"}</button>
          </form>
        )}
      </div>
    </main>
  );
}
