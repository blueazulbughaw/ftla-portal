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

## How to add or change an event

Everything lives in [`lib/events.ts`](lib/events.ts). Copy an event block, give it a new `slug`, fill it in, and open a pull request (or ask Claude to). The home page, the event page and the admin page pick it up automatically.

- `lumaEventId` (starts with `evt-`) links the event to Luma so the admin page can show guest numbers.
- An artifact with `adminOnly: true` only shows up for admins.

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
3. You get a link like `ftla-portal.vercel.app`. From now on, merging a pull request updates it.

### 2. Turn on sign in with Supabase (about 10 minutes)

1. Go to [supabase.com](https://supabase.com), sign up, and create a new project (any name, free plan).
2. In the project, open **Project Settings → API** and copy the **Project URL** and the **anon public** key.
3. Open **Authentication → URL Configuration**. Set **Site URL** to your Vercel link (for example `https://ftla-portal.vercel.app`) and add `https://ftla-portal.vercel.app/auth/confirm` under **Redirect URLs**.
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
   - Under **Authorized JavaScript origins**, add `https://ftla-portal.vercel.app`.
   - Under **Authorized redirect URIs**, paste the Supabase **Callback URL** from above.
   - Click **Create** and copy the **Client ID** and **Client secret**.
4. If the consent screen says **Testing**, click **Publish app** so anyone can sign in, not only listed test users.

**Back in Supabase:** paste the Client ID and Client secret into the Google provider and click **Save**.

That's it, with no redeploy needed. The **Continue with Google** button on `/login` now works. To make yourself an admin, put the same Google email (for example your FaithTech email) in `ADMIN_EMAILS` in Vercel.

### 4. Create the hub's database tables (about 3 minutes)

The hub saves schedules, profiles, contacts, announcements and roles in Supabase. Do this once:

1. Open [`supabase/schema.sql`](supabase/schema.sql) and change `you@example.com` near the bottom to the email you sign in with. That makes you an admin.
2. In Supabase, open **SQL Editor**, click **New query**, paste the whole file and click **Run**.
3. Sign out of the portal and back in. You'll see the Admin Panel in the hub sidebar.

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
- Moving events from `lib/events.ts` into the Supabase database so admins can edit them in the browser
