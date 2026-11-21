# ShiftOS v0.7 — premium upgrade contract

## Implemented

1. Unified premium responsive design language. No CDN fonts, marketing trackers, or external images.
2. Authenticated manager dashboard: KPI cards, overview, month and seven-day staff grid, search/filter, coverage inspector, approval panel, CHECK list, backup. Editing remains server-side only.
3. Synthetic-only demo: overview, editable fictional roster, demo undo, day coverage and adjustable sample coverage threshold, CHECK exceptions, state simulation, local activity log, keyboard command palette.
4. Pure analytics utilities with regression tests including leap years and exact month boundaries.

## Safety invariants

- `/demo` is denied unless `ENABLE_SYNTHETIC_DEMO=true` in preview deployment. Demo never invokes corporate API and holds edits in browser state only.
- Production API still requires immutable single-tenant Entra allowlist, individual editor identity, verified private corporate SharePoint and approval gates.
- Never enable Hobby for commercial business operations. Vercel preview is only a protected technical demonstration.
- Missing Graph permissions, private list schema, work-in-progress Excel import, Microsoft 365 co-authoring verification and revoked legacy sharing links block actual production.

## Next hardening

- Add real role-aware station coverage policy from an approved operational source, not default demo thresholds.
- Atomic month release and change auditing must be backed by durable transactional storage. SharePoint Lists plus ETag is per-item optimistic concurrency only.
- Introduce durable restore drills and policy-backed retention in approved private corporate SharePoint.
- Verify actual Sophia workbook equivalence and 100% data reconciliation before importing personal data.
- Run accessible UI and browser tests on authenticated protected staging.
