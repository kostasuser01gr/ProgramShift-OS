# Europcar ShiftOS — Premium Control Center 0.7 (preproduction)

This project replaces daily Excel editing with a restricted Microsoft 365 web workspace. **Only use with real employee data after corporate IT approval, access verification and approved commercial hosting.** The publicly reviewable demo uses fictional names, fake IDs and in-browser ephemeral data only.

## Premium UI v0.7 (new)

- Premium responsive control center for both authenticated managers/editors and synthetic reviewer mode.
- Operational overview with coverage summaries, KPI metrics and day-by-day planner.
- Monthly and rolling seven-day roster views; staff search, shift-class filtering, keyboard search shortcut (`/` or `Ctrl/Cmd+K`).
- Dedicated coverage inspector: real instance reports actual staffing only; synthetic preview includes an explicitly adjustable demo-only threshold.
- Expanded release workflow, explicit privacy labels, incident/validation insights, and demo-only undo/activity history.
- Pure deterministic analytics helpers, defensive date handling, synthetic fixture generation and regression tests.
- **No production data added**, no new dependencies, no price-plan changes and no corporate permission changes.

## Implemented

- Modern responsive Greek manager/editor roster with code validation, navigation, edit/create shift, and 20-second refresh.
- **Entra single-tenant login**, immutable object-ID allowlists (`MANAGER_OIDS`, `EDITOR_OIDS`), a mandatory blocked-IDs list, and rejection of the shared station mailbox. No anonymous enrollment, self-registration or employee-role access.
- Microsoft SharePoint Lists persistence: Employees, Shifts and Periods. Individual shift ETags / `If-Match` and SharePoint-enforced unique `ShiftKey` avoid accidental overwrites and duplicate creation. No roster data in Git, browser storage or public assets.
- Manager-only month release workflow: `DRAFT → REVIEW → PUBLISHED → LOCKED → DRAFT`. Changes to published/locked months are rejected. Publication fails while the month is missing assigned shifts or has known 11h/35h-rest alerts.
- Automatic CHECK warnings including night shifts and cross-month continuity. The 35h rest checker is **advisory** and deliberately declines to infer days off from absent data; not a legal compliance certificate.
- On-demand AES-256-GCM encrypted XLSX backup, password selected by supervisor, offline decrypt tool. No plaintext XLSX persisted on Vercel; user is responsible for storing backup in approved private storage.
- Synthetic reviewer mode at `/demo`, **disabled by default** and requiring `ENABLE_SYNTHETIC_DEMO=true`. No connection to Microsoft Graph.
- API server-side authorization, same-origin mutation checks, no-store responses, anti-indexing headers, and production release gates.

## Setup

See `docs/SHAREPOINT_SCHEMA.md` and `docs/PRODUCTION_CUTOVER.md` for exact IT requirements. Set variables from `.env.example` **directly** in the approved deployment environment, never commit secrets. Microsoft Entra delegated `Sites.Selected` requires admin consent and resource-specific grants; Graph requests operate under the signed-in supervisor's permissions. The target SharePoint site must be private, with no inheritance from the shared station user.

```bash
npm ci
npm test
npm run lint:syntax
npm run preflight
npm run build
```

`preflight` is **expected to fail** until IT and hosting approval is complete. Do not set approval variables to `true` as a workaround. There is no guarantee of zero cost for a commercial SaaS deployment; Vercel Hobby is for personal noncommercial use. Any evaluation deployment must be synthetic, protected and non-operational.

## Production gaps / constraints

The Entra registration, corporate site, list schema, secrets, permissions, full source workbook import, original Sophia workbook equivalence, real co-edit two-user test and automatic durable recovery are NOT in place. The application cannot be considered production-ready until independently checked. Existing OneDrive workbook remains unchanged, with insecure older sharing links still requiring authorized cleanup. **The new app does not automatically secure the old workbook.**

The Graph backend currently enumerates lists with bounded pagination and supports ~9k items/list; for growth, add indexed date filters and server-side paging. Period transition and shift editing are separate Graph operations; absolute transactional freeze requires a stronger storage/serialization strategy. No self-provisioned accounts, billing changes, real-data migrations or automatic sharing-link revocations are performed.
