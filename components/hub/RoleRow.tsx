"use client";

import { useState, useTransition } from "react";
import { setRoles } from "@/app/hub/actions";

const ROLES = ["volunteer", "speaker", "organizer", "admin"];

// One row of role checkboxes. Saves as soon as a box is ticked.
export default function RoleRow({ userId, roles, canEdit }: { userId: string; roles: string[]; canEdit: boolean }) {
  const [current, setCurrent] = useState(roles);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const flip = (r: string) => {
    const next = current.includes(r) ? current.filter((x) => x !== r) : [...current, r];
    setCurrent(next);
    start(async () => {
      const e = await setRoles(userId, next);
      if (e) {
        setErr(e);
        setCurrent(current);
      } else setErr(null);
    });
  };

  return (
    <div className="roles">
      <label className="role on locked"><input type="checkbox" checked disabled /> Attendee</label>
      {ROLES.map((r) => (
        <label key={r} className={`role ${current.includes(r) ? "on" : ""}`}>
          <input type="checkbox" checked={current.includes(r)} disabled={!canEdit || pending} onChange={() => flip(r)} />
          {r[0].toUpperCase() + r.slice(1)}
        </label>
      ))}
      {err && <span className="error-text small">{err}</span>}
    </div>
  );
}
