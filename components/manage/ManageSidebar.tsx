"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Icon, { type AnyIcon } from "@/components/Icon";

export type SideOrg = { slug: string; name: string; role: string; reporting: boolean };
export type SideEvent = { id: string; org: string; title: string; starts_on: string };

type Item = { href: string; label: string; icon: AnyIcon; children?: { href: string; label: string }[]; exact?: boolean };

// The admin's left sidebar, laid out like the attendee hub's. Open an event from the
// Events list and its pages (details, planning, attendees report) show under it.
export default function ManageSidebar({ orgs, events }: { orgs: SideOrg[]; events: SideEvent[] }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const m = path.match(/^\/([^/]+)\/admin(?:\/events\/([^/]+))?/);
  const orgSlug = m ? m[1] : null;
  const org = orgs.find((o) => o.slug === orgSlug) ?? null;
  const base = org ? `/${org.slug}/admin` : "";
  const mine = events.filter((e) => e.org === org?.slug);
  const pathEvent = m?.[2] && m[2] !== "new" ? m[2] : null;
  const current = mine.find((e) => e.id === pathEvent) ?? null;

  const isOn = (href: string, exact = false) => (exact ? path === href : path === href || path.startsWith(href + "/"));

  const orgItems: Item[] = org
    ? [
        { href: `${base}/home`, label: "Homepage", icon: "grid" },
        {
          href: base,
          label: "Events",
          icon: "calendar",
          exact: true,
          children: [
            { href: base, label: "All events" },
            { href: `${base}/events/new`, label: "Add an event" },
          ],
        },
        { href: `${base}/reports`, label: "Program reports", icon: "users" },
        {
          href: `${base}/types`,
          label: "Program",
          icon: "book",
          children: [
            { href: `${base}/types`, label: "Event types" },
            { href: `${base}/series`, label: "Series" },
            { href: `${base}/chapters`, label: "Chapters" },
            { href: `${base}/resources`, label: "Resources" },
          ],
        },
        {
          href: `${base}/settings`,
          label: "Organization",
          icon: "shield",
          children: [
            { href: `${base}/settings`, label: "Settings and team" },
            { href: `${base}/theme`, label: "Look and feel" },
            { href: `${base}/addons`, label: "Add-ons" },
            { href: `${base}/integrations`, label: "Luma and webhooks" },
          ],
        },
      ]
    : [];

  const groupOn = (it: Item) =>
    isOn(it.href, it.exact) || (it.children ?? []).some((c) => isOn(c.href)) || (it.label === "Events" && path.startsWith(`${base}/events`));

  // Open an event from the Events list and its pages show here, under its name.
  const eventLinks = current
    ? [
        { href: `${base}/events/${current.id}`, label: "Details", exact: true },
        { href: `${base}/events/${current.id}/plan`, label: "Planning" },
        { href: `${base}/events/${current.id}/announcements`, label: "Announcements" },
        ...(org?.reporting ? [{ href: `${base}/events/${current.id}/attendees`, label: "Attendees report" }] : []),
      ]
    : [];

  const Nav = ({ items }: { items: Item[] }) => (
    <>
      {items.map((it) => {
        const on = groupOn(it);
        return (
          <div key={it.label}>
            <Link href={it.href} className={`hub-link ${on ? "on" : ""}`} aria-current={on && !it.children ? "page" : undefined}>
              <Icon name={it.icon} /> <span>{it.label}</span>
              {it.children && <Icon name="chevron" size={16} className="chev" />}
            </Link>
            {it.children && on && (
              <div className="hub-sub">
                {it.children.map((c) => (
                  <Link key={c.href} href={c.href} className={path === c.href ? "on" : ""} aria-current={path === c.href ? "page" : undefined}>
                    {c.label}
                  </Link>
                ))}
                {it.label === "Events" && current && (
                  <div className="side-event">
                    <span className="side-event-name">{current.title}</span>
                    {eventLinks.map((c) => {
                      const here = c.exact ? path === c.href : isOn(c.href);
                      return (
                        <Link key={c.href} href={c.href} className={here ? "on" : ""} aria-current={here ? "page" : undefined}>
                          {c.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );

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
            <option value="__new">+ Start an organization</option>
          </select>
        </div>

        {org && (
          <nav className="hub-nav" onClick={() => setOpen(false)}>
            <Nav items={orgItems} />
          </nav>
        )}

        {org && (
          <nav className="hub-nav side-foot">
            <Link href={`/${org.slug}`} className="hub-link"><Icon name="external" /> <span>View homepage</span></Link>
            <Link href="/hub" className="hub-link"><Icon name="user" /> <span>Attendee hub</span></Link>
          </nav>
        )}
        {!org && (
          <nav className="hub-nav">
            <Link href="/manage" className={`hub-link ${path === "/manage" ? "on" : ""}`}><Icon name="grid" /> <span>Your organizations</span></Link>
            <Link href="/manage/new" className={`hub-link ${path === "/manage/new" ? "on" : ""}`}><Icon name="plus" /> <span>Start an organization</span></Link>
          </nav>
        )}
      </div>
    </aside>
  );
}
