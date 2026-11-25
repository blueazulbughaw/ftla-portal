import type { FeatureKey } from "./features";

/** The Event Experience tabs. A tab with a `feature` only shows when the event type has it on. */
export const EXPERIENCE_TABS: { slug: string; label: string; icon: "ticket" | "pin" | "food" | "gift" | "calendar" | "users" | "laptop"; feature?: FeatureKey }[] = [
  { slug: "registration", label: "Registration", icon: "ticket", feature: "registration" },
  { slug: "getting-here", label: "Getting here", icon: "pin", feature: "location" },
  { slug: "speakers", label: "Speakers", icon: "users", feature: "speakers" },
  { slug: "hackathon", label: "Hackathon", icon: "laptop", feature: "hackathon" },
  { slug: "food", label: "Food & drinks", icon: "food", feature: "food" },
  { slug: "perks", label: "Perks", icon: "gift", feature: "perks" },
  { slug: "on-the-day", label: "On the day", icon: "calendar", feature: "on_the_day" },
];
