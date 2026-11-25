# FaithTech LA portal

One home for FaithTech LA events: a public page for each event, sign in and sign up, the files and pages ("artifacts") that go with each event, and an admin area for organizers.

## What's in it

| Page | What it shows | Who sees it |
| --- | --- | --- |
| `/` | Community home: upcoming and past events, the Create Cycle, ways to plug in, leaders | Everyone |
| `/events/<slug>` | One event: date, venue, register button, agenda, artifacts | Everyone (admin-only files hidden) |
| `/login` | Sign in with Google or email, and create an account | Everyone |
| `/hub` | The attendee hub (see below) | Anyone signed in |
| `/hub/admin` | Announcements, roles, every event with Luma guest numbers, every artifact | Organizers and admins |
| `/c/<code>` | Someone's contact card, opened from their QR code | Everyone (only the fields they chose to share) |

### The attendee hub

After signing in, people land in `/hub`, which works like the DevFest LA attendee hub. A sidebar switches between events and pages:

- **Overview**: announcements, a pre-event checklist, the event card and quick links
- **Agenda** and **My Schedule**: every session, with Add to Schedule (saved to your account)
- **Event Experience**: Registration, Getting here (map, transit, parking), Food & drinks (meal preferences), Perks, On the day
- **Community**: My contacts (saved from people's QR codes, downloadable as a vCard) and Community groups
- **My profile**: photo, contact details, sharing switches and your share QR code
- **Hub Guide**: video guides and FAQs
- **Admin Panel**: publish or schedule announcements, and give people roles (volunteer, speaker, organizer, admin)

What each event's hub shows (sessions, parking, perks and so on) lives in [`lib/hub.ts`](lib/hub.ts). Events without an entry there still get a basic hub.

## Organizations and events (in the browser)

Any signed-in person can **start an organization** at `/manage/new` (it asks whether it's a nonprofit, and if so, for donate links). The front page (`/`) explains Community Hub and offers Log in and Set up your organization. Each organization manages everything in its admin at `/{org}/admin` (for example `/ftla/admin`), which has a left sidebar like the attendee hub. Open an event from the Events list to reach its details, Planning and Attendees report. **Homepage** in the admin builds the organization's page from sections (banner, upcoming events, text, cards, links, team, donate, custom HTML) that can be added, hidden, removed and reordered. Old `/manage/{org}` links forward. Each organization's public page is `/{org}` and its events are `/{org}/events/{event}` (for example `/ftla/events/devfest-la-2026`). Old `/o/...` and `/events/...` links forward to the new ones.

- **Events**: add, edit, publish, remove. **Use as a template** copies an event (and its planning lists) to a new date.
- **Event types**: like post types in WordPress. Each type picks the sections its events get: location, parking, registration, agenda, speakers, food, hackathon, perks, on the day.
- **Planning** (team only, per event): to-do list, budget, venues, date options, promotion plan, shopping list, roles and helpers, partners and outreach. Admins choose which of these each event uses.
- **Look and feel**: everyone picks a preset theme and accent color. The Custom branding add-on unlocks any colors, a font, a logo and extra CSS.
- **Add-ons** (paid extras, switched on by a site admin until billing is connected): Participant hub, Luma and webhooks, Reporting, Custom branding.

Members can opt in to the **member directory** (`/hub/directory`) from My profile, and are found by skills and interests.

FaithTech LA's built-in events start in [`lib/events.ts`](lib/events.ts). The first time someone on the team opens `/manage/ftla`, they are copied into the database, and from then on they are ordinary events you can edit or remove in the browser. **Restore built-in events** on that page brings back any you removed.

## The stack, in plain words

- **Next.js** (React) builds the pages. Code in `app/` maps straight to URLs.
- **Vercel** hosts it for free at `something.vercel.app`, and redeploys every time a pull request is merged into `main`.
- **Supabase** handles accounts (Google sign in, or email and password). Free plan.
- **Luma**'s API supplies guest numbers. Optional.

The site works without Supabase or Luma keys. Sign in and guest numbers just show a "not set up yet" note until the keys are added.

## One-time setup

### 1. Put it online with Vercel (about 5 minutes)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub.
2. Click **Add New → Project**, pick `ftla-portal`, and click **Deploy**. Leave the settings as they are.
3. You get a link like `common-hub.vercel.app`. From now on, merging a pull request updates it.

### 2. Turn on sign in with Supabase (about 10 minutes)

1. Go to [supabase.com](https://supabase.com), sign up, and create a new project (any name, free plan).
2. In the project, open **Project Settings → API** and copy the **Project URL** and the **anon public** key.
3. Open **Authentication → URL Configuration**. Set **Site URL** to your Vercel link (for example `https://common-hub.vercel.app`) and add `https://common-hub.vercel.app/auth/confirm` under **Redirect URLs**.
4. In Vercel, open your project → **Settings → Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` = the Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon key
   - `ADMIN_EMAILS` = your email (separate several with commas)
5. In Vercel, go to **Deployments**, open the menu on the latest one, and click **Redeploy**.

### 3. Turn on "Continue with Google" (about 10 minutes)

Do step 2 first. Google needs to know your Supabase project before it will let people sign in through it.

**In Supabase:**
1. Open **Authentication → Sign In / Providers → Google** and switch it on.
2. Copy the **Callback URL** shown there. It looks like `https://<your-project>.supabase.co/auth/v1/callback`. Leave this tab open.

**In Google Cloud** ([console.cloud.google.com](https://console.cloud.google.com)), signed in with any Google account:
1. Create a project (top bar → project picker → **New project**, name it `FaithTech LA portal`).
2. Open **APIs & Services → OAuth consent screen** (Google may call it **Google Auth Platform → Branding**). Fill in the app name `FaithTech LA`, your email as support and developer contact, and choose **External** as the audience. Save.
3. Open **Clients** (or **Credentials → Create credentials → OAuth client ID**). Pick **Web application**.
   - Under **Authorized JavaScript origins**, add `https://common-hub.vercel.app`.
   - Under **Authorized redirect URIs**, paste the Supabase **Callback URL** from above.
   - Click **Create** and copy the **Client ID** and **Client secret**.
4. If the consent screen says **Testing**, click **Publish app** so anyone can sign in, not only listed test users.

**Back in Supabase:** paste the Client ID and Client secret into the Google provider and click **Save**.

That's it, with no redeploy needed. The **Continue with Google** button on `/login` now works. To make yourself an admin, put the same Google email (for example your FaithTech email) in `ADMIN_EMAILS` in Vercel.

### 4. Create the hub's database tables (about 3 minutes)

The hub saves schedules, profiles, contacts, announcements and roles in Supabase. Do this once:

1. Open [`supabase/schema.sql`](supabase/schema.sql) and change `you@example.com` near the bottom to the email you sign in with. That makes you an admin.
2. In Supabase, open **SQL Editor**, click **New query**, paste the whole file and click **Run**.
3. Sign out of the portal and back in. You'll see the Admin Panel in the hub sidebar, and **Manage events** at the top. You're the owner of the FaithTech LA organization.

Running it again later is safe. To make someone else an admin, tick their Admin box in the Admin Panel.

### 5. Optional: live guest numbers from Luma

Luma gives out API keys only on calendars with **Luma Plus**. If you have it:

1. In Luma, open the calendar → **Settings → Developer** and create an API key.
2. Add `LUMA_API_KEY` in Vercel's Environment Variables, then redeploy.

## Running it on your own computer (optional)

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # open http://localhost:3000
```

Your computer uses the same Supabase project as the live site, so there's no local database. For Google sign in to come back to your computer, add `http://localhost:3000/auth/confirm` under Supabase → Authentication → URL Configuration → Redirect URLs.

## Planned next

- Post-event retros and admin reports over time
- Online payment (Stripe) for add-ons
