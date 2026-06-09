# Shift Schedule — Next.js app

A Next.js front-end for the monthly staff shift schedule. **Google Sheets stays the
source of truth**; this app reads it through a service account (with a short-lived
in-memory cache) and writes validated single cells back. The bound Apps Script mirrors
edits into `CODED` and pushes a webhook so the app's cache stays fresh.

```
Browser ──▶ Next.js (Vercel) ──▶ Google Sheets API ──▶ the spreadsheet
   ▲             │  ▲                                        │
   │             ▼  └──── in-memory read-through cache ◀─────┘
 Google      /api/cell (write)                         Apps Script onEdit
 sign-in     /api/schedule (read)  ◀── /api/webhook/sheets ── notifyApp_()
```

## What's here
```
app/
  page.tsx                     role-based redirect
  employee/page.tsx            current team week (read-only)
  manager/page.tsx             live grid + validated editing + warnings
  api/
    schedule/route.ts          GET cached schedule + coverage/warnings/stats
    cell/route.ts              POST one cell (managers/owners only)
    webhook/sheets/route.ts    POST from Apps Script → invalidate cache
    auth/[...nextauth]/route.ts Google sign-in
lib/
  config.ts    geometry, thresholds, role map
  google.ts    service-account Sheets client
  shifts.ts    code↔shift map, parse, category   (ported from the sheet)
  sheets.ts    SheetsRepository: getSchedule / setCell   ← swap for Postgres later
cache.ts     coalesced in-memory read-through cache
  compute.ts   coverage / warnings / fairness   (same rules as the validator)
  auth.ts      NextAuth options + role helper
apps-script/
  webhook.gs   the notifyApp_() glue (also already in the bound Code.gs)
```

## Setup
1. `npm install`
2. **Service account** — in Google Cloud: create a service account, enable the
   **Google Sheets API**, download the JSON key, and **share the spreadsheet** with
   the service-account email (Editor, since the app writes cells).
3. **OAuth** — create a Google OAuth Web client; redirect URI
   `http://localhost:3000/api/auth/callback/google` (+ your prod URL).
4. Copy `.env.example` → `.env.local` and fill it in. Add authorized accounts to
   `OWNER_EMAILS` and `MANAGER_EMAILS`; unlisted signed-in users are read-only employees.
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
`vercel` (or connect the repo in the dashboard). Add the same env vars in the Vercel
project, add the KV integration, set `NEXTAUTH_URL` to the production URL.

## Current boundaries
- The production app supports authenticated schedule reading and manager/owner cell edits.
- Swap, leave, availability, notification, and owner-setting workflows in the companion
  prototype are not connected to server-side persistence and are not presented as live here.
- The in-memory cache is per server instance. The webhook invalidates the instance it reaches;
  move to a shared cache when traffic requires cross-instance consistency.

## When you outgrow Sheets
Implement a `PostgresRepository` with the same `getSchedule` / `setCell` signatures
and point `cache.ts` at it. Keep a one-way export back to Sheets for the familiar
view and audit trail.
