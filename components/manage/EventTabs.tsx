"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function EventTabs({ base }: { base: string }) {
  const path = usePathname();
  const tabs = [
    { href: base, label: "Details", on: path === base },
    { href: `${base}/plan`, label: "Planning", on: path.startsWith(`${base}/plan`) },
    { href: `${base}/announcements`, label: "Announcements", on: path.startsWith(`${base}/announcements`) },
    { href: `${base}/attendees`, label: "Attendees", on: path.startsWith(`${base}/attendees`) },
  ];
  return (
    <nav className="seg event-tabs" aria-label="This event">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={t.on ? "on" : ""} aria-current={t.on ? "page" : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
