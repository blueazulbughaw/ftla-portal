import Icon from "@/components/Icon";
import Hero from "@/components/hub/Hero";
import Notice, { SetupNotice } from "@/components/hub/Notice";
import { removeContact } from "../actions";
import { hubContext } from "@/lib/hub-server";
import Avatar from "@/components/hub/Avatar";

export const metadata = { title: "My contacts" };

type Contact = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  contact_email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  website_url: string | null;
};

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const { supabase, needsSetup } = await hubContext("/hub/contacts");
  const { data } = needsSetup ? { data: [] } : await supabase.rpc("get_my_contacts");
  const contacts = (data ?? []) as Contact[];

  return (
    <>
      <Hero
        kicker="People you've met"
        title="Saved contacts."
        intro="A handy record of connections from events. Each card shows only the details that person chose to share."
      />
      <div className="hub-body">
        {needsSetup && <SetupNotice />}
        <Notice ok={ok} />
        <div className="card">
          <div className="card-head">
            <div>
              <h2 className="h3">Connections <span className="count">{contacts.length}</span></h2>
              <p className="soft small">Saved from attendee share cards.</p>
            </div>
            {contacts.length > 0 ? (
              <a className="btn ghost small" href="/hub/contacts/vcard" download>
                <Icon name="download" size={16} /> Download vCard
              </a>
            ) : (
              <span className="btn ghost small is-disabled" aria-disabled="true"><Icon name="download" size={16} /> Download vCard</span>
            )}
          </div>
          {contacts.length === 0 ? (
            <div className="empty">
              <span className="card-ico"><Icon name="users" /></span>
              <b>Your list is ready when you are.</b>
              <p className="soft small">Save a connection by scanning their share QR or opening their contact link.</p>
            </div>
          ) : (
            <ul className="people">
              {contacts.map((c) => (
                <li key={c.id}>
                  <Avatar name={c.display_name} url={c.avatar_url} />
                  <div className="who">
                    <b>{c.display_name ?? "Name not shared"}</b>
                    <div className="soft small links">
                      {c.contact_email && <a href={`mailto:${c.contact_email}`}>{c.contact_email}</a>}
                      {c.phone && <a href={`tel:${c.phone}`}>{c.phone}</a>}
                      {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noopener">LinkedIn</a>}
                      {c.website_url && <a href={c.website_url} target="_blank" rel="noopener">Website</a>}
                    </div>
                  </div>
                  <form action={removeContact}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="linkbtn save"><Icon name="trash" size={14} /> Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
