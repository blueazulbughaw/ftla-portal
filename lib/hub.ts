// ============================================================
// EDIT HERE: what each event's attendee hub shows.
// Every key matches an event `slug` in lib/events.ts.
// An event with no entry here still gets a hub, built from its basic details.
// ============================================================

import type { PortalEvent } from "./events";

/** Session types like talk, workshop or community. Each event can name its own. */
export type SessionKind = string;
export const DEFAULT_SESSION_KINDS = ["talk", "workshop", "panel", "dining", "community"];
/** Agenda types that can have speakers. */
export const SPEAKER_KINDS = ["talk", "workshop", "panel"];

export type Session = {
  /** Never change an id once people have saved the session. */
  id: string;
  /** 24-hour time, like "09:30". */
  start: string;
  end: string;
  title: string;
  description?: string;
  kind: SessionKind;
  room?: string;
  /** Speakers' names joined for display, like "Ana Cruz, Ben Lee". */
  speaker?: string;
  /** Each speaker's name, for talks, workshops and panels. */
  speakers?: string[];
};

export type InfoCard = { title: string; body: string; icon?: IconName; items?: string[] };

export type IconName =
  | "ticket" | "food" | "calendar" | "car" | "laptop" | "pin" | "wifi" | "gift" | "users"
  | "briefcase" | "share" | "message" | "slides" | "train" | "user" | "card" | "book" | "shield"
  | "grid" | "bell" | "coffee";

export type HubInfo = {
  /** Short line under the event name on the Overview card. */
  theme?: string;
  themeBody?: string;
  checklist: { id: string; title: string; body: string; icon: IconName; cta?: string; href?: string; external?: boolean }[];
  sessions: Session[];
  registration: { body: string; steps?: string[] };
  gettingHere: { transit?: string; carpool?: string; rideshare?: string; parking?: { name: string; price?: string; body: string }[] };
  food: { included?: string; meals: { time: string; title: string; body: string }[] };
  perks: { title: string; body: string; stats?: { value: string; label: string }[]; steps?: string[]; link?: { label: string; url: string } }[];
  onTheDay: InfoCard[];
  communities: { kind: string; name: string; body: string; url: string }[];
  guides: { title: string; body: string; icon: IconName; videoUrl?: string }[];
  faqs: { q: string; a: string }[];
  speakers?: Speaker[];
  /** This event's own session types, in the order to show them. */
  sessionKinds?: string[];
  wifi?: { network?: string; password?: string; note?: string };
  survey?: { url: string; label?: string; note?: string };
  hackathon?: Hackathon;
};

export type Speaker = { name: string; title?: string; bio?: string; url?: string };

export type Hackathon = {
  theme?: string;
  teamSize?: string;
  tracks: { name: string; body: string }[];
  rules?: string[];
  judging?: string[];
  submissionUrl?: string;
  resourcesUrl?: string;
};

export const MEAL_OPTIONS = [
  "Vegetarian", "Vegan", "Pescatarian", "Gluten-free", "Dairy-free", "Kosher", "Halal",
  "Peanut allergy", "Tree nut allergy", "Shellfish allergy", "Egg allergy", "Soy allergy", "Other",
];

export const FTLA_COMMUNITIES: HubInfo["communities"] = [
  { kind: "Community chat", name: "FaithTech Slack", body: "Join the #los-angeles channel to stay in touch between events.", url: "https://faithtechhub.slack.com/archives/C024N0KLPDJ" },
  { kind: "Newsletter", name: "FaithTech LA mailing list", body: "Hear about the next meetup first.", url: "https://mailchi.mp/faithtech/add-new-subscriber" },
  { kind: "Social", name: "Instagram", body: "Photos and updates from FaithTech.", url: "https://instagram.com/faithtechhub" },
  { kind: "Social", name: "LinkedIn", body: "Connect with FaithTech.", url: "https://www.linkedin.com/company/faithtechhub/" },
];

export const DEFAULT_GUIDES: HubInfo["guides"] = [
  { title: "Set up your attendee profile", body: "Add a photo and choose what to share.", icon: "user" },
  { title: "Find and save sessions", body: "Browse the agenda and build My Schedule.", icon: "calendar" },
  { title: "Add your meal preferences", body: "Tell the organizers about dietary needs.", icon: "food" },
  { title: "Share your contact card", body: "Use your QR code to connect with attendees.", icon: "card" },
  { title: "Find your ticket", body: "Get ready for registration and check-in.", icon: "ticket" },
];

export const DEFAULT_FAQS: HubInfo["faqs"] = [
  { q: "Who can see my profile?", a: "Only the fields you switch on under Sharing controls appear when someone scans your QR code. Your sign-in email is never shown." },
  { q: "Who can see my meal preferences?", a: "Only you and the event organizers. They use them to plan food." },
  { q: "Where is my schedule saved?", a: "In your account, so it shows up on any device you sign in on." },
  { q: "Is my checklist saved?", a: "Checklist ticks are saved on this device only." },
  { q: "Who do I ask for help?", a: "Email los-angeles@faithtech.com, or find a host wearing a FaithTech badge on the day." },
];

export const HUBS: Record<string, HubInfo> = {
  "devfest-la-2026": {
    theme: "Build, Secure, Scale",
    themeBody: "A day of talks, workshops and hands-on experiences with the Google developer community.",
    checklist: [
      { id: "ticket", title: "Get your ticket", body: "Register for DevFest LA 2026.", icon: "ticket", cta: "Get tickets", href: "https://gdg.community.dev/events/details/google-gdg-cloud-san-fernando-valley-presents-devfest-los-angeles-2026/", external: true },
      { id: "meals", title: "Save meal preferences", body: "Add dietary preferences or food allergies to your profile.", icon: "food", cta: "Add preferences", href: "/hub/experience/food" },
      { id: "schedule", title: "Build your schedule", body: "Save the talks and workshops you want to attend.", icon: "calendar", cta: "Browse agenda", href: "/hub/agenda" },
      { id: "arrival", title: "Plan your arrival", body: "Check the venue address and open directions.", icon: "car", cta: "Getting here", href: "/hub/experience/getting-here" },
      { id: "tools", title: "Pack your tools", body: "Bring a laptop to take part in a hands-on workshop.", icon: "laptop" },
    ],
    sessions: [
      { id: "doors", start: "09:00", end: "09:30", title: "Doors open", description: "Come in, meet people, get some coffee and snacks.", kind: "community", room: "Main Room" },
      { id: "breakfast", start: "09:30", end: "10:00", title: "Breakfast", kind: "community", room: "Main Room" },
      { id: "keynote", start: "10:00", end: "11:00", title: "Opening keynote", description: "Opening keynote by Richard Seroter.", kind: "talk", room: "Main Room", speaker: "Richard Seroter" },
      { id: "ai-mistakes", start: "11:00", end: "12:00", title: "7 mistakes I've seen in AI apps", description: "Common ways AI features go wrong in real apps, from confusing user experiences to runaway bills, and how to avoid them.", kind: "talk", room: "Main Room", speaker: "Martin Omander" },
      { id: "generative-ui", start: "11:00", end: "12:00", title: "From Static to Magic: Generative UI with Replit + Antigravity SDK", description: "Build adaptive, personalized interfaces with agentic development workflows and natural language.", kind: "workshop", room: "Workshop Room", speaker: "Angelina Millare" },
      { id: "ai-forward-org", start: "12:00", end: "12:30", title: "Beyond the Chat Window: Four Modes of an AI-Forward Engineering Organization", description: "A practical framework for four modes of AI use: Explore, Execute, Observe and Delegate.", kind: "talk", room: "Main Room", speaker: "Alec Dibble" },
      { id: "lunch", start: "12:30", end: "13:30", title: "Lunch in the Courtyard", kind: "community", room: "Courtyard" },
      { id: "edge-gemini", start: "15:00", end: "16:00", title: "Off the Edge: Grading Google AI Edge and Gemini Against a Practitioner's Eye", description: "Can AI coach a physical skill? A live look at pose models and Gemini video understanding on real footage.", kind: "talk", room: "Main Room", speaker: "Boris-Wilfried Nyasse" },
      { id: "self-refining-agents", start: "15:00", end: "16:00", title: "Self-Refining Agents That Earn Their Own Upgrades on Google Cloud", description: "Build an agent that learns from feedback and only ships a new version when it proves it is better.", kind: "workshop", room: "Workshop Room", speaker: "Kiruthika Subramani" },
      { id: "closing", start: "16:00", end: "16:30", title: "Closing and prizes", kind: "community", room: "Main Room" },
    ],
    registration: {
      body: "DevFest LA registration runs on the GDG community site. Your ticket and check-in QR code arrive by email from GDG.",
      steps: ["Register on the GDG event page.", "Look for the confirmation email with your ticket.", "Show the QR code at check-in on December 12."],
    },
    gettingHere: {
      transit: "The Vermont/Santa Monica Metro B Line station is a short walk from the venue.",
      carpool: "Sharing a ride is a good idea, as on-site spaces may fill up early.",
      rideshare: "Set your Uber or Lyft drop-off to 741 N Vermont Ave, Braille Institute Los Angeles Center.",
      parking: [
        { name: "On-site guest parking", price: "Free.", body: "Enter from N. New Hampshire Ave, one block west of Vermont." },
        { name: "LACC Lot 1", price: "$2 per day.", body: "At 4100 Marathon St. Buy a day pass at the lot meter and display it on your dashboard." },
        { name: "Vermont / Marathon meters", body: "Street meters along Vermont Ave and Marathon St. Check meter limits and Saturday enforcement." },
        { name: "Nearby side streets", body: "Free parking may be available. Check posted time limits and permit rules." },
      ],
    },
    food: {
      included: "Meals and snacks are included with your ticket.",
      meals: [
        { time: "9:00 AM", title: "Coffee and snacks", body: "Grab a cup at check-in and meet people before the welcome." },
        { time: "12:30 PM", title: "Lunch in the Courtyard", body: "An hour to eat and connect before the afternoon sessions." },
      ],
    },
    perks: [
      {
        title: "Google Cloud credits",
        body: "Not compatible with AI Studio billing.",
        stats: [{ value: "$5", label: "Google Cloud credit per attendee" }, { value: "250", label: "vouchers available" }],
        steps: [
          "Bring your phone. Claiming uses a QR code check on a mobile device.",
          "Claim on December 12. The claim link opens at 9:00 AM PT. Vouchers can't be saved for later and expire after the event.",
          "We'll walk everyone through it before the workshops. Plan for 10 to 15 minutes.",
          "Use the credit during DevFest in the hands-on workshops.",
        ],
      },
      { title: "Giveaways and raffle prizes", body: "Google hardware and swag go out during closing and prizes at 4:00 PM. Stay to the end." },
    ],
    onTheDay: [
      { title: "What to bring", body: "", icon: "laptop", items: ["Laptop and charger for workshops", "A Google account for AI Studio, Gemini and Google Cloud", "Your résumé for the job fair"] },
      { title: "Job fair", body: "Meet hiring teams between sessions. A résumé or a QR code to your LinkedIn makes it easy.", icon: "briefcase" },
      { title: "Giveaways · 4:00 PM", body: "Google hardware and swag go out during closing and prizes. Stay to the end.", icon: "gift" },
      { title: "Wi-Fi", body: "Network name and password will be posted here on event day.", icon: "wifi" },
      { title: "Share it", body: "Post with #DevFestLA. Prefer not to be photographed? Let a host know.", icon: "share" },
      { title: "Feedback", body: "The survey link will be posted here during closing. Your feedback shapes next year.", icon: "message" },
      { title: "Speaker slides", body: "Slide links will be collected here after the event.", icon: "slides" },
    ],
    communities: [
      { kind: "Developer group", name: "GDG Cloud San Fernando Valley", body: "Google Developer Group for the San Fernando Valley.", url: "https://gdg.community.dev/events/details/google-gdg-cloud-san-fernando-valley-presents-devfest-los-angeles-2026/" },
      ...FTLA_COMMUNITIES,
    ],
    guides: DEFAULT_GUIDES,
    faqs: DEFAULT_FAQS,
  },
};

/** The hub details for an event, with sensible defaults when an event has no entry yet. */
export function hubFor(e: PortalEvent): HubInfo {
  const h = HUBS[e.slug];
  if (h) return h;
  return {
    checklist: [
      ...(e.registerUrl ? [{ id: "ticket", title: "RSVP", body: `Save your spot for ${e.title}.`, icon: "ticket" as const, cta: e.registerLabel ?? "RSVP", href: e.registerUrl, external: true }] : []),
      { id: "meals", title: "Save meal preferences", body: "Add dietary preferences or food allergies to your profile.", icon: "food", cta: "Add preferences", href: "/hub/experience/food" },
      { id: "arrival", title: "Plan your arrival", body: "Check the address and open directions.", icon: "car", cta: "Getting here", href: "/hub/experience/getting-here" },
      { id: "profile", title: "Set up your profile", body: "Choose what to share when you meet people.", icon: "user", cta: "My profile", href: "/hub/profile" },
    ],
    sessions: (e.agenda ?? []).map((a, i) => ({ id: `item-${i}`, start: to24(a.time), end: "", title: a.title, description: a.note, kind: "community" as const })),
    registration: { body: e.registerUrl ? `Registration for ${e.title} is handled on ${e.registerLabel?.replace(/^.* on /, "") || "the event page"}.` : "No registration needed. Just show up." },
    gettingHere: {},
    food: { meals: [] },
    perks: [],
    onTheDay: [],
    communities: FTLA_COMMUNITIES,
    guides: DEFAULT_GUIDES,
    faqs: DEFAULT_FAQS,
  };
}

/** "9:30 AM" -> "09:30". */
export function to24(t: string): string {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return "00:00";
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

/** "13:30" -> "1:30 PM". */
export function to12(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export const HUB_EVENT_COOKIE = "hub_event";
