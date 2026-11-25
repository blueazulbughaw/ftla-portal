"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Events" },
  { href: "/types", label: "Event types" },
  { href: "/series", label: "Series" },
  { href: "/resources", label: "Resources" },
  { href: "/chapters", label: "Chapters" },
  { href: "/settings", label: "Settings and team" },
  { href: "/theme", label: "Look and feel" },
  { href: "/addons", label: "Add-ons" },
  { href: "/integrations", label: "Luma and webhooks" },
  { href: "/reports", label: "Reports" },
];

export default function ManageTabs({ org }: { org: string }) {
  const path = usePathname();
  const base = `/manage/${org}`;
  const on = (href: string) => (href === "" ? path === base || path.startsWith(`${base}/events`) : path.startsWith(base + href));
  return (
    <nav className="tabs manage-tabs" aria-label="Organization tools">
      {TABS.map((t) => (
        <Link key={t.href} href={base + t.href} className={on(t.href) ? "on" : ""} aria-current={on(t.href) ? "page" : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
