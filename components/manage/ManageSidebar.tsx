"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Icon, { type AnyIcon } from "@/components/Icon";
import { signOut } from "@/app/login/actions";

export type SideOrg = { slug: string; name: string; role: string; reporting: boolean };
export type SideEvent = { id: string; org: string; slug: string; title: string; starts_on: string };

type Sub = { href: string; label: string; exact?: boolean; external?: boolean; deep?: Sub[] };
type Item = { href: string; label: string; icon: AnyIcon; children?: Sub[]; exact?: boolean; match?: string };

// The admin's left sidebar, laid out like the attendee hub's:
// Landing Page, Events (each event with its settings and pages), My Profile, Settings.
export default function ManageSidebar({ orgs, events }: { orgs: SideOrg[]; events: SideEvent[] }) {
  const path = usePathname();
  const router = useRouter();
  const [hash, setHash] = useState("");
  const [open, setOpen] = useState(false);

  const m = path.match(/^\/([^/]+)\/admin(?:\/events\/([^/]+))?/);
  const org = orgs.find((o) => o.slug === m?.[1]) ?? null;
  const base = org ? `/${org.slug}/admin` : "";
  const mine = events.filter((e) => e.org === org?.slug);
  const current = mine.find((e) => e.id === m?.[2]) ?? null;

  const isOn = (href: string, exact = false) => (exact ? path === href : path === href || path.startsWith(href + "/"));

  const eventPages = (e: SideEvent): Sub[] => {
    const eb = `${base}/events/${e.id}`;
    return [
      {
        href: eb,
        label: "Event Settings",
        exact: true,
        deep: [
          { href: `${eb}#basics`, label: "Details" },
          { href: `${eb}#agenda`, label: "Agenda and speakers" },
          { href: `${eb}#food`, label: "Food" },
          { href: `${eb}#getting-here`, label: "Getting here" },
          { href: `${eb}#on-the-day`, label: "On the day" },
          { href: `${eb}#links`, label: "Slides and links" },
        ],
      },
      { href: `${eb}/plan`, label: "Planning" },
      { href: `${eb}/announcements`, label: "Announcements" },
      ...(org?.reporting ? [{ href: `${eb}/attendees`, label: "Attendees report" }] : []),
      { href: `/${e.org}/events/${e.slug}`, label: "View Event Page", external: true },
    ];
  };

  const items: Item[] = org
    ? [
        { href: `${base}/home`, label: "Landing Page", icon: "grid" },
        {
          href: base,
          label: "Events",
          icon: "calendar",
          match: `${base}/events`,
          exact: true,
          children: [...mine.map((e) => ({ href: `${base}/events/${e.id}`, label: e.title })), { href: `${base}/events/new`, label: "+ Add an event" }],
        },
        { href: "/hub/profile", label: "My Profile", icon: "user" },
        {
          href: `${base}/settings`,
          label: "Settings",
          icon: "shield",
          children: [
            { href: `${base}/settings`, label: "Organization Details" },
            { href: `${base}/community`, label: "Community" },
            { href: `${base}/theme`, label: "Look and feel" },
            { href: `${base}/types`, label: "Event types" },
            { href: `${base}/addons`, label: "Add-ons" },
            { href: `${base}/integrations`, label: "Luma and webhooks" },
          ],
        },
      ]
    : [];

  const groupOn = (it: Item) =>
    isOn(it.href, it.exact) || (it.match ? path.startsWith(it.match) : false) || (it.children ?? []).some((c) => isOn(c.href));

  return (
    <aside className={`hub-side ${open ? "is-open" : ""}`}>
      <button className="hub-menu btn ghost small" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Icon name="grid" size={16} /> Admin menu
      </button>
      <div className="hub-side-in">
        <div className="hub-event">
          <label className="label" htmlFor="admin-org">Organization</label>
          <select
            id="admin-org"
            value={org?.slug ?? (path.startsWith("/manage/new") ? "__new" : "")}
            onChange={(e) => router.push(e.target.value === "__new" ? "/manage/new" : e.target.value ? `/${e.target.value}/admin` : "/manage")}
          >
            {!org && !path.startsWith("/manage/new") && <option value="">Choose one</option>}
            {orgs.map((o) => <option key={o.slug} value={o.slug}>{o.name}</option>)}
            <option value="__new">+ Create an organization</option>
          </select>
        </div>

        {org ? (
          <nav className="hub-nav">
            {items.map((it) => {
              const on = groupOn(it);
              return (
                <div key={it.label}>
                  <Link href={it.href} className={`hub-link ${on ? "on" : ""}`} aria-current={on && !it.children ? "page" : undefined} onClick={() => setOpen(false)}>
                    <Icon name={it.icon} /> <span>{it.label}</span>
                    {it.children && <Icon name="chevron" size={16} className="chev" />}
                  </Link>
                  {it.children && on && (
                    <div className="hub-sub">
                      {it.children.map((c) => {
                        const ev = it.label === "Events" ? mine.find((e) => c.href === `${base}/events/${e.id}`) : undefined;
                        const here = current && ev?.id === current.id;
                        return (
                          <div key={c.href}>
                            <Link href={c.href} className={path === c.href || here ? "on" : ""} aria-current={path === c.href ? "page" : undefined} onClick={() => setOpen(false)}>
                              {c.label}
                            </Link>
                            {here && ev && (
                              <div className="side-event">
                                {eventPages(ev).map((p) => (
                                  <div key={p.href}>
                                    {p.external ? (
                                      <a href={p.href} target="_blank" rel="noopener">{p.label} ↗</a>
                                    ) : (
                                      <Link href={p.href} className={(p.exact ? path === p.href : isOn(p.href)) ? "on" : ""} onClick={() => setOpen(false)}>{p.label}</Link>
                                    )}
                                    {p.deep && path === p.href && (
                                      <div className="side-deep">
                                        {p.deep.map((d) => (
                                          <a key={d.href} href={d.href} className={hash === d.href ? "on" : ""} onClick={() => { setHash(d.href); setOpen(false); }}>{d.label}</a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="side-foot">
              <Link href={`/${org.slug}`} className="hub-link"><Icon name="external" /> <span>View homepage</span></Link>
              <Link href="/hub" className="hub-link"><Icon name="users" /> <span>Attendee hub</span></Link>
              <SignOut />
            </div>
          </nav>
        ) : (
          <nav className="hub-nav">
            <Link href="/manage" className={`hub-link ${path === "/manage" ? "on" : ""}`}><Icon name="grid" /> <span>Your organizations</span></Link>
            <Link href="/manage/new" className={`hub-link ${path === "/manage/new" ? "on" : ""}`}><Icon name="plus" /> <span>Create an organization</span></Link>
            <div className="side-foot"><SignOut /></div>
          </nav>
        )}
      </div>
    </aside>
  );
}

export function SignOut() {
  return (
    <form action={signOut}>
      <button className="hub-link linkish"><Icon name="arrow" /> <span>Sign out</span></button>
    </form>
  );
}
