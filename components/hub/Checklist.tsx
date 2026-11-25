"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import type { HubInfo } from "@/lib/hub";

// Ticks are kept on this device. Items the account already proves (meals, schedule) tick themselves.
export default function Checklist({
  eventSlug,
  items,
  autoDone,
}: {
  eventSlug: string;
  items: HubInfo["checklist"];
  autoDone: string[];
}) {
  const key = `checklist:${eventSlug}`;
  const [ticked, setTicked] = useState<string[]>([]);
  useEffect(() => {
    try {
      setTicked(JSON.parse(localStorage.getItem(key) || "[]"));
    } catch {
      /* storage blocked: start empty */
    }
  }, [key]);

  const toggle = (id: string) => {
    const next = ticked.includes(id) ? ticked.filter((t) => t !== id) : [...ticked, id];
    setTicked(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const done = (id: string) => autoDone.includes(id) || ticked.includes(id);
  const count = items.filter((i) => done(i.id)).length;

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2 className="h3">Your pre-event checklist</h2>
          <p className="soft small">A few quick steps to get the most out of the day.</p>
        </div>
        <div className="progress">
          <b>{count} of {items.length} complete</b>
          <span className="bar"><span style={{ width: `${(count / Math.max(items.length, 1)) * 100}%` }} /></span>
        </div>
      </div>
      <ul className="checklist">
        {items.map((it) => (
          <li key={it.id}>
            <input
              type="checkbox"
              aria-label={`Mark "${it.title}" done`}
              checked={done(it.id)}
              disabled={autoDone.includes(it.id)}
              onChange={() => toggle(it.id)}
            />
            <span className="ico"><Icon name={it.icon} /></span>
            <div>
              <b>{it.title}</b>
              <p className="soft small">{it.body}</p>
            </div>
            {it.href && it.cta && (
              it.external ? (
                <a className="cta" href={it.href} target="_blank" rel="noopener">{it.cta} <Icon name="external" size={14} /></a>
              ) : (
                <Link className="cta" href={it.href}>{it.cta} <Icon name="arrow" size={14} /></Link>
              )
            )}
          </li>
        ))}
      </ul>
      <p className="soft small foot">Checklist ticks are saved on this device. Meal preferences and your schedule are saved to your account.</p>
    </div>
  );
}
