# ShiftOS V1.5 — Instrumental Design System & Decision-Oriented Telemetry

## Product Intent Manifest (scope-locked)

- **Mission**: make rental-station workforce planning and operations understandable and safely actionable by non-technical managers.
- **Roles**: individually authenticated manager and editor; fictional demo roles for preview. No anonymous corporate enrollments.
- **Core workflows**: schedule planning, CHECK, manager publication, rental task creation/transition/verification, approval, encrypted backup, security review.
- **Canonical code**: `feature/shiftos-instrumental-motion-v14` commit `3fd1c595d8e09bbe2a23b023aa1f43b9f3cdbb59`; this release is an incremental derivative, not a rewrite.
- **Immutable architecture**: existing Microsoft Graph/SharePoint APIs, ETag write guards, authentication/role checks, private Vercel preview and zero-cost bounds.
- **Reference**: Moxen Instrumental screenshot (compact graphite instrument panel and modular micro-charts). Style DNA only; no copied assets or proprietary implementation.
- **Out of scope**: customer PII, contract processing, fabricated booking demand, API billing, new database, enabling production, changing original confidential workbook, unapproved ACL mutations.

## Actual delivered changes

1. **Four-layer token system**: primitive colors/geometry → semantic states → dashboard components → Operations context, in `app/instrumental-v15.css`, imported after existing CSS. Scoped to the established `.premiumApp` and `.instRoot` rather than replacing existing components.
2. **Task matrix instrument**: 3 time slots × all recognized rental-operations teams. Every numeric cell counts only `NEW`, `IN_PROGRESS` or `BLOCKED` tasks from the currently available station-scoped records. Invalid rows are excluded and surfaced.
3. **Meaningful drill-down**: selecting a nonempty matrix cell sets the Kanban team + slot + OPEN filters. Clearing restores all teams, slots, statuses and search text. The original workflow buttons and ETag guarded APIs remain unchanged.
4. **Explicit data state**: synthetic, loading, recently fetched snapshot, refreshing, stale and unavailable are distinguished. A failed initial corporate fetch must not appear as a genuine empty queue. On a failed refresh, old records may remain visible but are labeled stale; writes are visually suspended until successful refresh.
5. **Context-first controls**: selected task detail can be closed without losing filters; toolbar reports visible/total records, adds slot filter, and offers compact/comfortable density. Native button controls support keyboard access.
6. **Accessibility/performance**: visible focus, high-contrast neutral palette, reduced-motion fallback, bounded Motion transitions from V1.4, no extra runtime library, responsive horizontally scrollable matrix. New matrix creates up to (#teams × 3) cells, not an unbounded time-series.

## Visualization registry and provenance

| UI | Metric | Source | Unit / aggregation | Refresh | Threshold | Decision |
|---|---|---|---|---|---|---|
| Completion ring (existing) | DONE + VERIFIED / all valid tasks | current `/api/operations` snapshot or fictional demo tasks | percentage only if total > 0 | when tasks change / manual fetch | no target assumed | review completion |
| Open team × slot matrix (new) | NEW + IN_PROGRESS + BLOCKED per (team, slot) | same current station-scoped task list | discrete task count | when list changes | visual intensity relative to highest nonzero cell, not staffing threshold | click cell to inspect work |
| Blocked and urgent indicators (existing) | task status / priority | same list | exact count | when tasks change | none | triage |
| Recent task activity (existing) | task history entries | HistoryJson version of task | event list | when records fetched | none | inspect prior state transition |
| System connection label (new) | actual fetch status | client request lifecycle | descriptive state | request completion or error | none | prevent stale/unavailable data being treated as live |

No live occupancy, vehicle fleet count, staffing capacity, real-time API utilization, business revenue, or reservation numbers are inferred. No manufactured trend-lines.

## Tests / quality evidence

- Baseline V1.4: 106 unit tests, 49 syntax checks pass before mutation.
- V1.5: additional deterministic tests for empty/malformed task matrix, cross-station exclusion, state filtering, relative intensity and connection-state truthfulness.
- Syntax and real Next.js build are separate gates. Do not state browser E2E or screenshot parity if inaccessible behind Vercel Authentication.
- Test contrast of primary instrumental labels against the dark background; this does not replace a full WCAG 2.2 AA review.
- `npm run preflight` must remain BLOCKED without company Entra, private SharePoint Operations list and explicit IT/hosting approval.

## Known limits / rejection decisions

- Retained shared inline styles outside rental operations; full design-token migration is a later work item.
- UI snapshot timestamp means a successful fetch, **not** a persistent real-time connection.
- Original SharePoint task-history JSON is not an independent append-only audit ledger.
- No forced merge into public `main` and no corporate cutover.
- No Blender, Remotion or video rendering dependencies: they do not improve the core daily scheduling task.
- No independent browser E2E without authorized protected-preview browser session.
- Chart color intensity is a within-snapshot relative visual aid; count labels carry the factual meaning.

## Rollback

Use previous audited `feature/shiftos-instrumental-motion-v14` commit `3fd1c595d8e09bbe2a23b023aa1f43b9f3cdbb59` or its existing protected Vercel deployment. Do not auto-promote preview to production.

## Next engineering gates

1. Authorized browser screenshots at desktop/tablet/mobile and complete keyboard traversal.
2. Actual two-user manager/editor integration against IT-provisioned private Operations SharePoint list.
3. Append-only audit with independent storage, strict permissions and recovery drill.
4. Original `ΠΡΟΓΡΑΜΜΑ.xlsx` ACL remediation by authorized owner while preserving current individual email grants.
5. Commercial hosting approval and cost cap before any employee/customer data.
