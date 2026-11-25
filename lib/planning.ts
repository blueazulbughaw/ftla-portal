// ============================================================
// Event planning tools for the organizing team, modeled on a typical
// event-planning spreadsheet: to-dos, budget, venues, dates, promotion,
// shopping, people and outreach. Admins pick which tools each event uses.
// Every row is stored in the plan_items table as { tool, data }.
// ============================================================

export type FieldType = "text" | "long" | "date" | "number" | "money" | "url" | "email" | "select" | "check";
export type Field = { key: string; label: string; type: FieldType; options?: string[]; wide?: boolean };
export type PlanTool = {
  key: string;
  label: string;
  help: string;
  fields: Field[];
  /** Rows added when someone presses "Add starter rows". */
  starter?: Record<string, string>[];
  /** Fields that add up into totals at the bottom. */
  totals?: string[];
  /** Field that splits the list into groups, like a phase or category. */
  groupBy?: string;
};

const TASK_STATUS = ["Not started", "In progress", "Waiting on someone", "Done", "No update"];

export const PLAN_TOOLS: PlanTool[] = [
  {
    key: "tasks",
    label: "To-do list",
    help: "Who is doing what, by when, and what each task is waiting on.",
    fields: [
      { key: "task", label: "Task", type: "text", wide: true },
      { key: "owner", label: "Assigned to", type: "text" },
      { key: "due", label: "Due by", type: "date" },
      { key: "depends_on", label: "Waiting on", type: "text" },
      { key: "status", label: "Status", type: "select", options: TASK_STATUS },
      { key: "notes", label: "Notes", type: "long" },
    ],
    starter: [
      "Research venues",
      "Finalize date and venue",
      "Create a one-pager",
      "Create the Luma event",
      "Call for volunteers",
      "Make the volunteer sign-up form",
      "Create the budget",
      "Design social media posts",
      "Publish social media posts",
      "Reach out to speakers and judges",
      "Find mentors",
      "Buy attendee swag",
      "Create name tags",
      "Design and order signage",
      "Create the event slide deck",
      "Plan the agenda and timeline",
      "Assign planning and day-of roles",
      "Create the feedback form",
    ].map((task) => ({ task, status: "Not started" })),
  },
  {
    key: "budget",
    label: "Budget",
    help: "What you expect to spend, what you actually spent, and who is paying for it.",
    groupBy: "kind",
    totals: ["estimate", "actual"],
    fields: [
      { key: "kind", label: "Type", type: "select", options: ["Expense", "Funding"] },
      { key: "item", label: "What for / sponsor", type: "text", wide: true },
      { key: "estimate", label: "Estimate", type: "money" },
      { key: "actual", label: "Actual", type: "money" },
      { key: "paid_by", label: "Paid by", type: "text" },
      { key: "notes", label: "Notes", type: "long" },
    ],
    starter: [
      ...["Venue", "Food", "Swag", "Name tags", "Signage"].map((item) => ({ kind: "Expense", item })),
      { kind: "Funding", item: "Our organization" },
    ],
  },
  {
    key: "venues",
    label: "Venues",
    help: "Places you're looking at, with capacity, cost and who is following up.",
    groupBy: "status",
    fields: [
      { key: "status", label: "Status", type: "select", options: ["To research", "Contacted", "Visiting", "Booked", "Not suitable"] },
      { key: "name", label: "Venue", type: "text", wide: true },
      { key: "owner", label: "Followed up by", type: "text" },
      { key: "website", label: "Website", type: "url" },
      { key: "address", label: "Address", type: "text" },
      { key: "capacity", label: "Capacity", type: "number" },
      { key: "cost", label: "Est. cost", type: "money" },
      { key: "contact", label: "Contact person", type: "text" },
      { key: "contact_email", label: "Contact email", type: "email" },
      { key: "parking", label: "Parking", type: "text" },
      { key: "transit", label: "Transit", type: "text" },
      { key: "catering", label: "Catering", type: "text" },
      { key: "notes", label: "Notes", type: "long" },
    ],
  },
  {
    key: "dates",
    label: "Date options",
    help: "Candidate dates and why some won't work (holidays, clashing events).",
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "ok", label: "Works?", type: "select", options: ["Possible", "Preferred", "No good"] },
      { key: "reason", label: "Reason", type: "text", wide: true },
    ],
  },
  {
    key: "promotion",
    label: "Promotion plan",
    help: "Your social media schedule, in phases: curiosity, awareness, sign-ups, countdown, thank you.",
    groupBy: "phase",
    fields: [
      { key: "phase", label: "Phase", type: "select", options: ["1. Curiosity", "2. Awareness", "3. Sign-ups", "4. Countdown", "5. Thank you"] },
      { key: "date", label: "Post date", type: "date" },
      { key: "topic", label: "Topic", type: "text", wide: true },
      { key: "design", label: "Design", type: "select", options: ["Not started", "Draft", "Ready"] },
      { key: "copy", label: "Words", type: "select", options: ["Not started", "Draft", "Ready"] },
      { key: "status", label: "Status", type: "select", options: ["Planned", "Scheduled", "Posted"] },
      { key: "design_url", label: "Design link", type: "url" },
      { key: "post_url", label: "Post link", type: "url" },
    ],
    starter: [
      { phase: "1. Curiosity", topic: "Who we are" },
      { phase: "1. Curiosity", topic: "Partner announcement" },
      { phase: "2. Awareness", topic: "Event announcement and save the date" },
      { phase: "2. Awareness", topic: "Venue reveal" },
      { phase: "3. Sign-ups", topic: "Who should come and what you'll do" },
      { phase: "3. Sign-ups", topic: "Register now" },
      { phase: "4. Countdown", topic: "One week to go" },
      { phase: "4. Countdown", topic: "Meet the speakers or judges" },
      { phase: "4. Countdown", topic: "Tomorrow" },
      { phase: "4. Countdown", topic: "Happening now" },
      { phase: "5. Thank you", topic: "Thank you and highlights" },
      { phase: "5. Thank you", topic: "What we built and the impact" },
    ].map((r) => ({ ...r, design: "Not started", copy: "Not started", status: "Planned" })),
  },
  {
    key: "shopping",
    label: "Shopping list",
    help: "Food, drinks and swag to buy, with quantities, prices and what's been bought.",
    groupBy: "category",
    totals: ["total", "actual"],
    fields: [
      { key: "category", label: "Category", type: "select", options: ["Breakfast", "Lunch", "Snacks", "Drinks", "Catering", "Swag", "Supplies", "Other"] },
      { key: "item", label: "Item", type: "text", wide: true },
      { key: "qty", label: "Qty", type: "number" },
      { key: "price", label: "Unit price", type: "money" },
      { key: "total", label: "Est. total", type: "money" },
      { key: "where", label: "Where to buy", type: "text" },
      { key: "bought", label: "Bought", type: "check" },
      { key: "actual", label: "Actual", type: "money" },
      { key: "notes", label: "Notes", type: "long" },
    ],
  },
  {
    key: "people",
    label: "Roles and helpers",
    help: "Volunteers, mentors, judges and day-of roles: who covers registration, food, hosting, photos, AV and prayer.",
    groupBy: "role",
    fields: [
      { key: "role", label: "Role", type: "select", options: ["Organizer", "Registration", "Food", "Hosting", "Photos and video", "Tech and AV", "Setup and teardown", "Worship", "Prayer", "Mentor", "Judge", "Speaker", "Other"] },
      { key: "name", label: "Name", type: "text", wide: true },
      { key: "email", label: "Email", type: "email" },
      { key: "company", label: "Company", type: "text" },
      { key: "topics", label: "Can help with", type: "text" },
      { key: "time", label: "Time they can give", type: "text" },
      { key: "confirmed", label: "Confirmed", type: "check" },
      { key: "notes", label: "Notes", type: "long" },
    ],
  },
  {
    key: "outreach",
    label: "Partners and outreach",
    help: "Partner organizations and other groups to invite or cross-promote with.",
    fields: [
      { key: "name", label: "Group", type: "text", wide: true },
      { key: "link", label: "Link", type: "url" },
      { key: "members", label: "Members", type: "number" },
      { key: "kind", label: "Relationship", type: "select", options: ["Co-host", "Sponsor", "Promote to", "Contacted", "Not a fit"] },
      { key: "owner", label: "Reached out by", type: "text" },
      { key: "notes", label: "Notes", type: "long" },
    ],
  },
];

export const DEFAULT_PLAN_TOOLS = ["tasks", "budget", "venues", "promotion", "shopping", "people"];
export const planTool = (key: string) => PLAN_TOOLS.find((t) => t.key === key);

export const money = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
export const fmtMoney = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
