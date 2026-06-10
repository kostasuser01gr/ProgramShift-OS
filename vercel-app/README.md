# Program Shift — unified Next.js app

A unified Program Shift OS and Next.js backend. **Google Sheets stays the source of
truth**: authenticated users load the schedule from `/api/schedule`, and manager/owner
edits are validated through `/api/cell`. Users can authenticate with Google or create
an email/password account. No roster or shifts are embedded in public assets.

```
Browser ──▶ NextAuth (Google or credentials) ──▶ protected Program Shift OS
   │                                  │
   ├── GET /api/schedule ─────────────┼──▶ in-memory cache ──▶ Sheets API
   └── POST /api/cell (manager/owner) ┴──▶ validated write ──▶ ΩΡΑΡΙΑ
```

## What's here
```
app/
  employee/page.tsx            current team week (read-only)
  manager/page.tsx             live grid + validated editing + warnings
  api/
    schedule/route.ts          GET cached schedule + coverage/warnings/stats
    cell/route.ts              POST one cell (managers/owners only)
    webhook/sheets/route.ts    POST from Apps Script → invalidate cache
    auth/[...nextauth]/route.ts Google and email/password sign-in
    register/route.ts           open employee-account registration
  auth/page.tsx                 combined sign-in and sign-up screen
public/
  index.html                    unified OS shell
  app/bootstrap.js              authenticated session + schedule bootstrap
  app/data.js                   computations/API adapter; contains no roster
  os/                           browser OS modules
lib/
  config.ts    geometry, thresholds, role map
  google.ts    service-account Sheets client
  shifts.ts    code↔shift map, parse, category   (ported from the sheet)
  sheets.ts    SheetsRepository: getSchedule / setCell   ← swap for Postgres later
cache.ts     coalesced in-memory read-through cache
  compute.ts   coverage / warnings / fairness   (same rules as the validator)
  auth.ts      NextAuth options + role helper
  accounts.ts  bcrypt credential repository backed by hidden USERS worksheet
apps-script/
  webhook.gs   the notifyApp_() glue (also already in the bound Code.gs)
```

## Setup
1. `npm install`
2. **Service account** — in Google Cloud: create a service account, enable the
   **Google Sheets API**, download the JSON key, and **share the spreadsheet** with
   the service-account email (Editor, since the app writes cells).
3. **OAuth** — create a Google OAuth Web client with redirect URIs:
   `http://localhost:3000/api/auth/callback/google` and
   `https://program-shift-app.vercel.app/api/auth/callback/google`.
4. Copy `.env.example` → `.env.local` and fill it in. Add authorized accounts to
   `OWNER_EMAILS` and `MANAGER_EMAILS`; every unlisted user is a read-only employee.
   The app creates a hidden `USERS` tab on first credentials registration.
5. Use a random webhook secret of at least 24 characters.
6. `npm run dev` → http://localhost:3000

## Verification
```
npm run lint
npm run typecheck
npm test
npm run build
npm run audit:prod
```

## Wire up the webhook
In Apps Script → **Project Settings → Script Properties**:
```
APP_WEBHOOK_URL    = https://your-app.vercel.app/api/webhook/sheets
APP_WEBHOOK_SECRET = <same string as WEBHOOK_SECRET in Vercel>
```
The delivered `Code.gs` already calls `notifyApp_()` from its installable `onEdit`.

## Deploy
Deployment requires explicit approval. Add secrets interactively with `vercel env add`;
never write them to repository files or shell startup files. Set `NEXTAUTH_URL` to the
production URL. No paid database, analytics, email provider, or marketplace integration
is required.

## Zero-cost guard
Production is intentionally limited to Vercel Hobby and a Google Cloud project with
billing detached. Google Cloud only has the Sheets API and its service-management
dependencies enabled. Run this after any platform or deployment change:

```
npm run verify:zero-cost
```

The command fails if Google billing is linked, Vercel is not on Hobby (or has an
active trial), or another Google API is enabled. Free-tier exhaustion may throttle
or pause the app; it must never be handled by enabling paid overages. Neither Vercel
Hobby nor Google Sheets offers unlimited free scale, so capacity must be monitored.

## Current boundaries
- The production app supports authenticated schedule reading and manager/owner cell edits.
- Google accounts are verified by Google. Credentials accounts use an email address as
  their login identifier, but this zero-cost implementation does not send verification
  or password-reset email. Add a mail provider before relying on email ownership.
- Registration throttling is per warm server instance. It reduces casual abuse but is
  not a globally consistent anti-bot control.
- Requests, reservations, chat, tasks, notes, files, forms, publication settings, and
  administration tools remain browser-local. The launcher labels them **Local only**.
- The in-memory cache is per server instance. The webhook invalidates the instance it reaches;
  move to a shared cache when traffic requires cross-instance consistency.

## When you outgrow Sheets
Implement a `PostgresRepository` with the same `getSchedule` / `setCell` signatures
and point `cache.ts` at it. Keep a one-way export back to Sheets for the familiar
view and audit trail.
