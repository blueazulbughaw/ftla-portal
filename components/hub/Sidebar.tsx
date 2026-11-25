"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import Icon, { type AnyIcon } from "@/components/Icon";
import { setHubEvent } from "@/app/hub/actions";
import { EXPERIENCE_TABS } from "@/lib/hub-tabs";

type Item = { href: string; label: string; icon: AnyIcon; children?: { href: string; label: string }[] };

export default function Sidebar({
  events,
  current,
  showAdmin,
  features,
  adminBase,
}: {
  events: { key: string; title: string }[];
  current: string;
  showAdmin: boolean;
  features: string[];
  /** This event's admin pages, for its team. */
  adminBase?: string;
}) {
  const path = usePathname();
  const form = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  const expTabs = EXPERIENCE_TABS.filter((t) => !t.feature || features.includes(t.feature));
  const items: Item[] = [
    { href: "/hub", label: "Overview", icon: "grid" },
    ...(features.includes("agenda")
      ? [{ href: "/hub/agenda", label: "Agenda", icon: "calendar" as const, children: [{ href: "/hub/schedule", label: "My Schedule" }] }]
      : []),
    {
      href: `/hub/experience/${expTabs[0]?.slug ?? "registration"}`,
      label: "Event Experience",
      icon: "pin",
      children: expTabs.map((t) => ({ href: `/hub/experience/${t.slug}`, label: t.label })),
    },
    {
      href: "/hub/community",
      label: "Community",
      icon: "users",
      children: [
        { href: "/hub/contacts", label: "My contacts" },
        { href: "/hub/directory", label: "Member directory" },
        { href: "/hub/community", label: "Community groups" },
      ],
    },
    { href: "/hub/profile", label: "My profile", icon: "user" },
    { href: "/hub/guide", label: "Hub Guide", icon: "book" },
    ...(showAdmin
      ? [
          {
            href: "/hub/admin",
            label: "Admin",
            icon: "shield" as const,
            children: [
              { href: "/hub/admin", label: "Announcements and roles" },
              ...(adminBase
                ? [
                    { href: adminBase, label: "Edit event details" },
                    { href: `${adminBase}/plan`, label: "Planning" },
                    { href: `${adminBase}/attendees`, label: "Attendees report" },
                  ]
                : []),
            ],
          },
        ]
      : []),
  ];

  const isOn = (href: string) => (href === "/hub" ? path === "/hub" : path === href || path.startsWith(href + "/"));
  const groupOn = (it: Item) => isOn(it.href) || (it.children ?? []).some((c) => isOn(c.href)) || (it.label === "Event Experience" && path.startsWith("/hub/experience"));

  return (
    <aside className={`hub-side ${open ? "is-open" : ""}`}>
      <button className="hub-menu btn ghost small" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Icon name="grid" size={16} /> Menu
      </button>
      <div className="hub-side-in">
        <form ref={form} action={setHubEvent} className="hub-event">
          <label className="label" htmlFor="hub-event">Your event</label>
          <select key={current} id="hub-event" name="event" defaultValue={current} onChange={() => form.current?.requestSubmit()}>
            {events.map((e) => (
              <option key={e.key} value={e.key}>{e.title}</option>
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
                {it.children && (on || it.label === "Admin") && (
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
