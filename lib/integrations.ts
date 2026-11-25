// ============================================================
// Ticketing and registration providers that can bring guests into the portal.
// Each provider writes into event_registrations with its own `source`, so reports,
// check-in and the hub work the same whichever app sold the ticket.
// To add one later: give it a sync function (like lumaGuests in lib/luma.ts)
// or point its webhooks at /api/webhooks/{org}, then mark it "available".
// ============================================================

export type Provider = {
  key: string;
  label: string;
  how: "api" | "webhook";
  status: "available" | "soon";
  body: string;
};

export const PROVIDERS: Provider[] = [
  { key: "luma", label: "Luma", how: "api", status: "available", body: "Pull guests and check-ins with your Luma API key." },
  { key: "webhook", label: "Any app (webhook)", how: "webhook", status: "available", body: "Zapier, Make, Google Forms, Typeform or anything that can send a webhook." },
  { key: "eventbrite", label: "Eventbrite", how: "api", status: "soon", body: "Ticket buyers and orders from Eventbrite." },
  { key: "partiful", label: "Partiful", how: "webhook", status: "soon", body: "RSVPs from Partiful invites." },
  { key: "bevy", label: "Bevy", how: "api", status: "soon", body: "Attendees from Bevy chapters and events." },
];
