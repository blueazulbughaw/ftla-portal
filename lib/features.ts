// ============================================================
// The building blocks an event type can switch on, and the paid add-ons.
// To add a new feature: add it to FEATURES, then show it in the hub and event pages.
// ============================================================

export type FeatureKey =
  | "location"
  | "parking"
  | "registration"
  | "agenda"
  | "speakers"
  | "food"
  | "hackathon"
  | "perks"
  | "on_the_day";

export const FEATURES: { key: FeatureKey; label: string; help: string }[] = [
  { key: "location", label: "Location", help: "Venue, address, map, transit and rideshare tips." },
  { key: "parking", label: "How to park", help: "Parking lots, prices and street parking." },
  { key: "registration", label: "Registration", help: "Ticket link and check-in steps." },
  { key: "agenda", label: "Agenda", help: "Sessions people can save to My Schedule." },
  { key: "speakers", label: "Speakers", help: "Speaker names, titles and short bios." },
  { key: "food", label: "Food options", help: "Meals, plus attendees' dietary preferences." },
  { key: "hackathon", label: "Hackathon", help: "Tracks, team size, rules, judging and submissions." },
  { key: "perks", label: "Perks", help: "Credits, swag and giveaways." },
  { key: "on_the_day", label: "On the day", help: "What to bring, Wi-Fi and day-of notes." },
];

export const ALL_FEATURES = FEATURES.map((f) => f.key);

/** Starter event types every new organization gets. They can rename or delete them. */
export const STARTER_TYPES: { name: string; features: FeatureKey[] }[] = [
  { name: "Meetup", features: ["location", "registration"] },
  { name: "Dinner", features: ["location", "parking", "registration", "food"] },
  { name: "Workshop", features: ["location", "parking", "registration", "agenda", "speakers", "food"] },
  { name: "Hackathon", features: ["location", "parking", "registration", "agenda", "food", "hackathon", "perks", "on_the_day"] },
  { name: "Conference", features: ["location", "parking", "registration", "agenda", "speakers", "food", "perks", "on_the_day"] },
];

export type AddonKey = "participant_hub" | "integrations" | "reporting" | "custom_branding";

export const ADDONS: { key: AddonKey; label: string; body: string }[] = [
  {
    key: "participant_hub",
    label: "Participant hub",
    body: "A signed-in hub for attendees: My Schedule, meal preferences, profiles with share QR codes, contacts and announcements.",
  },
  {
    key: "integrations",
    label: "Luma and webhooks",
    body: "Bring registrations in from Luma or any app that can send a webhook (Zapier, Google Forms, Typeform…).",
  },
  {
    key: "reporting",
    label: "Reporting",
    body: "Registrations, check-ins, saved schedules and meal needs for each event, with CSV download.",
  },
  {
    key: "custom_branding",
    label: "Custom branding",
    body: "Full control of your pages' look: any colors, your font and logo, and extra CSS. Without it you pick from preset themes.",
  },
];

export const BASIC_PLAN = "Your organization page and public event pages are free. Add-ons switch on extra tools.";

export const RESOURCE_KINDS = [
  { key: "slides", label: "Slides" },
  { key: "recording", label: "Recording" },
  { key: "doc", label: "Document" },
  { key: "code", label: "Code" },
  { key: "link", label: "Link" },
];
