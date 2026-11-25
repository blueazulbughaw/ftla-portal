/** "2026-12-12T09:00" in Los Angeles time -> an ISO timestamp. */
export function laLocalToIso(local: string): string {
  const asUtc = new Date(`${local}:00Z`);
  const laHour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hourCycle: "h23" }).format(asUtc));
  let offset = asUtc.getUTCHours() - laHour;
  if (offset < 0) offset += 24;
  return new Date(asUtc.getTime() + offset * 3600_000).toISOString();
}

/** An ISO time as the value an <input type="datetime-local"> wants, in LA time. */
export function laInput(iso: string): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export const laTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
