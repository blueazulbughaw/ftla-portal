"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import Icon, { type AnyIcon } from "@/components/Icon";
import { setHubEvent } from "@/app/hub/actions";

type Item = { href: string; label: string; icon: AnyIcon; children?: { href: string; label: string }[] };

export default function Sidebar({
  events,
  current,
  showAdmin,
}: {
  events: { slug: string; title: string }[];
  current: string;
  showAdmin: boolean;
}) {
  const path = usePathname();
  const form = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  const items: Item[] = [
    { href: "/hub", label: "Overview", icon: "grid" },
    { href: "/hub/agenda", label: "Agenda", icon: "calendar", children: [{ href: "/hub/schedule", label: "My Schedule" }] },
    {
      href: "/hub/experience/registration",
      label: "Event Experience",
      icon: "pin",
      children: [
        { href: "/hub/experience/registration", label: "Registration" },
        { href: "/hub/experience/getting-here", label: "Getting here" },
        { href: "/hub/experience/food", label: "Food & drinks" },
        { href: "/hub/experience/perks", label: "Perks" },
        { href: "/hub/experience/on-the-day", label: "On the day" },
      ],
    },
    {
      href: "/hub/community",
      label: "Community",
      icon: "users",
      children: [
        { href: "/hub/contacts", label: "My contacts" },
        { href: "/hub/community", label: "Community groups" },
      ],
    },
    { href: "/hub/profile", label: "My profile", icon: "user" },
    { href: "/hub/guide", label: "Hub Guide", icon: "book" },
    ...(showAdmin ? [{ href: "/hub/admin", label: "Admin Panel", icon: "shield" as const }] : []),
  ];

  const isOn = (href: string) => (href === "/hub" ? path === "/hub" : path === href || path.startsWith(href + "/"));
  const groupOn = (it: Item) => isOn(it.href) || (it.children ?? []).some((c) => isOn(c.href)) || (it.href === "/hub/experience/registration" && path.startsWith("/hub/experience"));

  return (
    <aside className={`hub-side ${open ? "is-open" : ""}`}>
      <button className="hub-menu btn ghost small" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Icon name="grid" size={16} /> Menu
      </button>
      <div className="hub-side-in">
        <form ref={form} action={setHubEvent} className="hub-event">
          <label className="label" htmlFor="hub-event">Your event</label>
          <select id="hub-event" name="event" defaultValue={current} onChange={() => form.current?.requestSubmit()}>
            {events.map((e) => (
              <option key={e.slug} value={e.slug}>{e.title}</option>
            ))}
          </select>
        </form>
        <nav className="hub-nav" onClick={() => setOpen(false)}>
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
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
