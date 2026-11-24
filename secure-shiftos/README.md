# V1.4 — Instrumental Rental Operations Motion

Adds purpose-driven Motion transitions to task workflows, snapshot-only operational telemetry and a reusable project agent motion skill. No real-time claim or staffing target is inferred. See `docs/INSTRUMENTAL_MOTION_V14.md` and `skills/shiftos-motion/SKILL.md`. Preview remains synthetic/noncommercial; corporate SharePoint writes remain disabled.

# ShiftOS V1.3 RC1 — Rental Station Workflows

Added real company-scoped, approval-gated rental operations task write support. See [docs/RENTAL_OPERATIONS_V13.md](docs/RENTAL_OPERATIONS_V13.md). The corporate feature is intentionally unavailable without approved Microsoft 365 permissions, a private task list and `OPS_WRITE_ENABLED=true`. Vercel preview is synthetic and noncommercial.

# ShiftOS v1.1 RC1 — Operations Intelligence (protected preview)

New read-only business features: Operations Simulator, 4-stage Workflow Center, Decision Inbox and simplified task launcher. Both synthetic demo and authenticated UI can access them. No customer records, automated publication or extra services. The production release remains blocked; review `docs/OPERATIONS_INTELLIGENCE_V11.md` for evidence, assumptions, tests and deferred integrations. Original Excel and existing Microsoft 365 email grants are unchanged.

---

## V0.8 — ελληνικό διαδραστικό tutorial

Προστέθηκαν μικρά εργαλεία `?` με hover/focus/tap σε βασικές λειτουργίες, ξεναγός 7 βημάτων, λεξικό με άτονη αναζήτηση, χάρτης ροής δεδομένων, γρήγορη μετάβαση και checklist εξοικείωσης. Διαβάστε `docs/GREEK_TUTORIAL_V08.md`.

**Επιχειρησιακός περιορισμός:** καμία αλλαγή σε πραγματικό roster, SharePoint, εταιρικούς ρόλους ή ενεργά projects. Η έκδοση παραμένει προστατευμένο staging preview με συνθετικά δεδομένα μέχρι να εγκριθεί νόμιμη επιχειρησιακή φιλοξενία και ολοκληρωθεί η ταυτοποίηση.

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

## V0.9 Security Center and supervised Excel lockdown

The private Manager workspace now includes a read-only **Κέντρο ασφάλειας**. It uses delegated Microsoft Graph read-only calls on `EXCEL_DRIVE_ID`, `EXCEL_FILE_ITEM_ID`, `EXCEL_PARENT_ITEM_ID` and reports broad sharing links, inherited folder exposure, and shared-account caveats. It does not mutate email grantees or ACLs, does not declare the workbook locked without independent testing, and does not send backup passwords to the audit API. The access audit may return UNVERIFIED until corporate IT provides delegated Graph permission and object identities.

For confidentiality with uninterrupted co-authoring, use named-user access/SharePoint permissions and (if licensed/IT enabled) a Purview encrypted sensitivity label that supports coauthoring. A regular Excel *file open* password normally prevents coauthoring; Excel *Protect Sheet* is not confidentiality. The original workbook and its versions are not changed by this release. Managers choose the separate encrypted backup passphrase, which is never committed.

Published code and demo include **only synthetic data**. Corporate OneDrive access changes require an authorized owner in Microsoft 365 → Manage access; no connector action for revoking links is available here.

## V1.2 — Integration Hub, CLI, TUI, HTTP and synthetic MCP

The new Operations Hub (`hub` tab) offers a Greek action board, seven read-only analysis/proposal tools, and guided workflow instructions. All interfaces share the deterministic `lib/gateway/core.mjs` tool registry. `app/api/gateway/route.js` is individually authenticated with existing Entra/SharePoint permissions and fails closed when corporate configuration is missing. The CLI, terminal menu and MCP stdio server require `--demo` and use only synthetic rosters. **No real AI agent, persistent approvals, corporate manual search, durable audit or multi-site Graph sync has been added.** See `docs/BITEFOUNDRY_GATEWAY_V12.md` for architecture, commands, safeguards, known gaps and rollback.
