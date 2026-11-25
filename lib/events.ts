// ============================================================
// EDIT HERE: every event in the portal lives in this list.
// To add an event, copy one block, give it a new `slug`, and fill it in.
// The home page, the event pages and the admin page all read from here.
// ============================================================

/** A short lowercase word used for the colored tag, like "dinner" or "hackathon". */
export type Category = string;

export type AgendaItem = { time: string; title: string; note?: string };

export type Artifact = {
  title: string;
  url: string;
  description?: string;
  /** Only signed-in admins see this artifact. */
  adminOnly?: boolean;
};

export type PortalEvent = {
  slug: string;
  title: string;
  /** YYYY-MM-DD, in Los Angeles time. */
  date: string;
  time: string;
  category: Category;
  label: string;
  price?: string;
  tentative?: boolean;
  place: string;
  address?: string;
  summary: string;
  description?: string;
  /** Who runs the event, when it isn't FaithTech LA. */
  organizer?: string;
  registerUrl?: string;
  registerLabel?: string;
  /** Luma event id (starts with evt-). Lets the admin page pull live guest numbers. */
  lumaEventId?: string;
  agenda?: AgendaItem[];
  artifacts?: Artifact[];
};

export const EVENTS: PortalEvent[] = [
  {
    slug: "devfest-la-2026",
    title: "DevFest Los Angeles 2026",
    date: "2026-12-12",
    time: "9:00 AM to 4:00 PM",
    category: "conference",
    label: "Conference",
    price: "Free",
    place: "Braille Institute Los Angeles Center",
    address: "741 N Vermont Ave, Los Angeles, CA 90029",
    summary:
      "Developer talks, hands-on workshops, and community at the Braille Institute Los Angeles Center.",
    description:
      "DevFest is the yearly community developer festival run by Google Developer Groups. Come for the talks and workshops, stay for the people building in LA.",
    organizer: "GDG Cloud San Fernando Valley",
    registerUrl:
      "https://gdg.community.dev/events/details/google-gdg-cloud-san-fernando-valley-presents-devfest-los-angeles-2026/",
    registerLabel: "Register on GDG",
    artifacts: [{ title: "devfestla.com", url: "https://devfestla.com/", description: "The current event site." }],
  },
  {
    slug: "christmas-dinner-2026",
    title: "FaithTech LA Christmas Dinner",
    date: "2026-12-10",
    time: "6:00 PM to 8:00 PM",
    category: "dinner",
    label: "Christmas Dinner",
    price: "Invite only",
    place: "Mijares Mexican Restaurant",
    address: "145 Palmetto Dr, Pasadena, CA 91105",
    summary:
      "Christmas dinner at a family-run Mexican restaurant that has been serving Pasadena for about 100 years.",
    registerUrl: "https://luma.com/tlrtwj38",
    registerLabel: "RSVP on Luma",
    lumaEventId: "evt-tYf6AUnA21qUsrj",
  },
  {
    slug: "bowling-night-2026",
    title: "Bowling Night at Highland Park Bowl",
    date: "2026-11-05",
    time: "Thursday evening",
    category: "social",
    label: "Social Gathering",
    price: "Pay your own way",
    place: "Highland Park Bowl",
    address: "5621 N Figueroa St, Los Angeles, CA 90042",
    summary:
      "A 1927 bowling alley with live music. Relaxed and easy for new folks to join, so bring a friend.",
  },
  {
    slug: "socal-hackathon-2026",
    title: "FaithTech SoCal × Baptize The World Hackathon",
    date: "2026-10-24",
    time: "9:00 AM to 6:00 PM",
    category: "hackathon",
    label: "Hackathon",
    price: "Free",
    place: "The Robertson Triangle",
    address: "3390 Robertson Pl, Los Angeles, CA 90034",
    summary:
      "One day to build software for the global church. Pick a challenge, form a team and demo by 4:15.",
    registerUrl: "https://luma.com/si6vhw1a",
    registerLabel: "Luma page",
    agenda: [
      { time: "9:00 AM", title: "Doors, check-in and breakfast" },
      { time: "9:15 AM", title: "Worship" },
      { time: "9:30 AM", title: "Welcome and overview" },
      { time: "9:45 AM", title: "Meet Baptize The World", note: "Our partner, then the three tracks." },
      { time: "10:05 AM", title: "Form teams" },
      { time: "10:30 AM", title: "Lament and discern together" },
      { time: "12:00 PM", title: "Lunch" },
      { time: "12:30 PM", title: "Build starts" },
      { time: "4:00 PM", title: "Code freeze" },
      { time: "4:15 PM", title: "Demos" },
      { time: "5:15 PM", title: "Team honors" },
      { time: "6:00 PM", title: "Doors close" },
    ],
    artifacts: [
      {
        title: "Hackathon participant hub",
        url: "https://claude.ai/artifact/DGrVQp44biq9NvRGhfBNuv",
        description: "Agenda, tracks, parking, slides and judging.",
      },
      {
        title: "Challenge repo",
        url: "https://github.com/FaithTechGlobalLabs/faithtech-socal-hackathon/tree/main",
        description: "Track briefs, test data and how to get started.",
      },
      {
        title: "Hackathon signups",
        url: "https://claude.ai/artifact/K57u76949hECEJyeS22FhR",
        description: "Who signed up, who checked in, and who is on the Mailchimp list.",
        adminOnly: true,
      },
    ],
  },
];

/** Community-wide artifacts that aren't tied to one event. */
export const LIBRARY: Artifact[] = [
  {
    title: "FaithTech LA Hub (original page)",
    url: "https://claude.ai/artifact/CKFmF1gcJnJ7FYvzmrrfGP",
    description: "The page this portal's home is based on.",
  },
];

export const LINKS = {
  slack: "https://faithtechhub.slack.com/archives/C024N0KLPDJ",
  mailing: "https://mailchi.mp/faithtech/add-new-subscriber",
  create: "https://forms.gle/AV77G6QWdUQGYHrz6",
  give: "https://www.faithtech.com/donate",
  email: "los-angeles@faithtech.com",
  laPage: "https://www.faithtech.com/communities/los-angeles",
  instagram: "https://instagram.com/faithtechhub",
  linkedin: "https://www.linkedin.com/company/faithtechhub/",
};

export const LEADERS = [
  { name: "Nash Ashur", role: "City Lead" },
  { name: "Glad Cedeño", role: "Meetup Lead" },
  { name: "Dana Calit", role: "Create Lead" },
  { name: "Bernice Brennan", role: "Communications Lead" },
];

// ---------- helpers ----------

/** Today's date in Los Angeles, as YYYY-MM-DD. */
function todayInLA(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
}

export function isPast(e: PortalEvent): boolean {
  return e.date < todayInLA();
}

export function upcomingEvents(): PortalEvent[] {
  return EVENTS.filter((e) => !isPast(e)).sort((a, b) => a.date.localeCompare(b.date));
}

export function pastEvents(): PortalEvent[] {
  return EVENTS.filter(isPast).sort((a, b) => b.date.localeCompare(a.date));
}

export function getEvent(slug: string): PortalEvent | undefined {
  return EVENTS.find((e) => e.slug === slug);
}

function asDate(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day, 12));
}

export function formatLong(d: string): string {
  return asDate(d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function monthDay(d: string): { mo: string; dd: string } {
  const date = asDate(d);
  return {
    mo: date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
    dd: String(date.getUTCDate()).padStart(2, "0"),
  };
}

export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
