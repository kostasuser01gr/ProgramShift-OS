# ShiftOS Instrumental Dashboard — v1.5 design and verification contract

## Product Intent Manifest

**Mission:** Staff scheduling plus rental-car station operations, presenting simple Greek workflows to non-technical managers and editors.

**Canonical source:** Existing V1.4 code, private SharePoint Lists, staff roster API and role-based Rental Operations endpoint. The user-supplied six-panel graphite screenshot is a visual reference and contains **unrelated synthetic server metrics** that must **not** appear in ShiftOS.

**Hard invariants:** Preserve all pre-existing routes, roles, shifts, state transitions, ETag concurrency checks, write approvals, disabled company pilot and synthetic demo. Never copy private staff details into Git. Never turn on billable services. Never equate operations task volume with vehicle throughput or headcount.

**Scope:** Replace the V1.4 operations pulse view with an original six-instrument design, add precise metric registry and unambiguous data availability, improve tooltips and responsive layout. Excluded: new backend, speculative AI predictions, real-time sockets, customer/booking fields, data migration, changing Microsoft permissions.

## Reference design DNA

- Six compact cards in a 3×2 grid on wide workspaces; neutral graphite surfaces; amber highlights only for emphasis; subtle tracks and separators; tabular figures.
- Content-local tooltips and concise Greek labels. Every interactive element has visible focus; reduced-motion paths do not animate measurements.
- Use native SVG for needle, ring and observed event series. Avoid new chart packages and unnecessary bundle weight.

## Metric registry (all station-scoped)

| Instrument | Source | Unit | Aggregation | Refresh | Threshold | Decision |
|---|---|---|---|---|---|---|
| Registered tasks | Valid operations task records + history | tasks/events | count plus observed prior 7-day events | fetch | none | inspect all tasks |
| Time-slot volume | `task.slot` | tasks | group counts in early / mid / late slots | fetch | none | inspect task allocation |
| Completion | `task.status` | % | 100×(DONE+VERIFIED) / all tasks | fetch | none | inspect open tasks |
| Manager verification | `task.status` | % | 100×VERIFIED / (DONE+VERIFIED) | fetch | none | inspect DONE queue |
| Team/slot matrix | `task.team`, `task.slot` | tasks | count by team × slot | fetch | none | inspect team tasks |
| Status composition | `task.status` | tasks | count each status | fetch | none | filter status |

**Unknowns:** No per-vehicle throughput, order rate, real latency, CPU utilization, memory usage, corporate fleet availability, unit capacities or labor-cost data. Those reference-image gauges must not be transplanted. No 0% display when denominator = 0. No invented historic points. No live badge when data is only fetched.

## Interaction contract

1. Click a status legend to filter the Kanban columns and tasks using existing board filters; do not mutate the backend.
2. Click an open-task or approval action to filter `OPEN` or `DONE` status.
3. Click a team row to select that team in the existing board.
4. Hover or focus `?` for the measurement definition, or click/tap it to pin the explanation; Escape dismisses it.
5. Expand detailed reports without losing current board state; all charts are from the same filtered-by-station source.
6. On disconnected/error/initial-loading states, suppress all misleading zeros. After 2 minutes without successful operations data refresh, display a stale-warning.

## State and quality gates

- `loading`→`available|empty|failed`, `stale` after 120 seconds without successful data retrieval; no background service is assumed.
- Tests cover registry completeness, station isolation, aggregation invariants, sparse/zero history, undefined denominators, stale/error handling and invalid dates.
- Visual checks: 1440px, 1024px, 390px, 320px; no horizontal clipping; keyboard focus; reduced-motion; contrast; semantic chart labels.
- Enterprise E2E, real Graph read/write and two-manager concurrency remain **unverified** without IT-approved tenant configuration. Production release gate stays blocked.

## Rollback

`feature/shiftos-instrumental-motion-v14` at `3fd1c595d8e09bbe2a23b023aa1f43b9f3cdbb59` is the unchanged baseline. Promote no preview to commercial production without IT and hosting approval.
