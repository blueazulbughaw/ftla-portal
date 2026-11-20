# FaithTech LA portal

One home for FaithTech LA events: a public page for each event, sign in and sign up, the files and pages ("artifacts") that go with each event, and an admin area for organizers.

## What's in it

| Page | What it shows | Who sees it |
| --- | --- | --- |
| `/` | Community home: upcoming and past events, the Create Cycle, ways to plug in, leaders | Everyone |
| `/events/<slug>` | One event: date, venue, register button, agenda, artifacts | Everyone (admin-only files hidden) |
| `/login` | Sign in and create an account | Everyone |
| `/admin` | Every event with live Luma guest numbers, and every artifact in one list | People listed in `ADMIN_EMAILS` |

## How to add or change an event

Everything lives in [`lib/events.ts`](lib/events.ts). Copy an event block, give it a new `slug`, fill it in, and open a pull request (or ask Claude to). The home page, the event page and the admin page pick it up automatically.

- `lumaEventId` (starts with `evt-`) links the event to Luma so the admin page can show guest numbers.
- An artifact with `adminOnly: true` only shows up for admins.

## The stack, in plain words

- **Next.js** (React) builds the pages. Code in `app/` maps straight to URLs.
- **Vercel** hosts it for free at `something.vercel.app`, and redeploys every time a pull request is merged into `main`.
- **Supabase** handles accounts (sign in / sign up). Free plan.
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

### 3. Optional: live guest numbers from Luma

Luma gives out API keys only on calendars with **Luma Plus**. If you have it:

1. In Luma, open the calendar → **Settings → Developer** and create an API key.
2. Add `LUMA_API_KEY` in Vercel's Environment Variables, then redeploy.

## Running it on your own computer (optional)

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # open http://localhost:3000
```

## Planned next

- Features from devfestla.com that sit behind its sign-in
- Post-event retros and admin reports over time
- Moving events from `lib/events.ts` into the Supabase database so admins can edit them in the browser
