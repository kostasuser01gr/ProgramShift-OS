# ShiftOS v1.3 · Rental Operations with guarded writes

## Scope

- Connected to the existing Next.js ShiftOS workspace, **not** to a separate app.
- Seven task categories: vehicle pickup preparation, return inspection, washing/preparation, shuttle run, kiosk assistance, fleet handoff, incident review.
- Operator workflow: `NEW → IN_PROGRESS ↔ BLOCKED → DONE → VERIFIED` (manager alone verifies/reopens DONE). No reservations, customer names, phone numbers, booking numbers, addresses, registration plates, payment data, vehicle GPS, or contracts are stored.
- New `Εργασίες οχημάτων` screen in both /demo and authenticated corporate dashboard; responsive status board, station team and date, priority, typed creation, detail inspector, task history and manual actions.
- Genuine corporate **write-capable** `GET/POST/PATCH /api/operations`, but it refuses requests unless personal Entra identity, private SharePoint site, approved commercial hosting, verified ACL and `OPS_WRITE_ENABLED=true` exist. Preview has none of these enterprise grants.
- Synthetic demo performs real state transitions in browser memory; these do **not** persist over reload, are not forwarded to Microsoft, and contain no real employees/customers.

## Corporate SharePoint Operations list

Create a **new private list** with internal name from `SHAREPOINT_OPERATIONS_LIST_ID` on the site configured by `SHAREPOINT_SITE_ID`. Grant only authorized station managers/editors via delegated Microsoft Graph scoped to this *private corporate SharePoint site*, and enable item versioning. This is not the shared original Excel or the public GitHub repo.

| Column | Type | Constraint |
|---|---|---|
| `TaskKey` | Single line text | Required unique GUID from server |
| `StationKey` | Single line text | Server-side fixed station ID, e.g. `HER` |
| `TaskType` | Single line text | One of seven whitelisted types |
| `DueDate` | Date only | Valid ISO date |
| `TimeSlot` | Single line text | `early`, `mid`, `late` |
| `TeamKey` | Single line text | `front-desk`, `returns`, `wash`, `shuttle`, `fleet`, `manager` |
| `PriorityKey` | Single line text | `normal`, `urgent` |
| `ReferenceCode` | Single line text | Demo-only anonymous `SIM-...` token; corporate writes reject nonempty values |
| `StatusKey` | Single line text | `NEW`, `IN_PROGRESS`, `BLOCKED`, `DONE`, `VERIFIED` |
| `RevisionNum` | Number (integer) | Starts at 1, increments atomically via ETag PATCH |
| `CreatedStamp` | Single line text | UTC ISO timestamp |
| `UpdatedStamp` | Single line text | UTC ISO timestamp |
| `HistoryJson` | Multiple lines text | JSON array of changes, up to 120; same-item update with status |

Provision `OPS_STATION_ID` server-side and `SHAREPOINT_OPERATIONS_LIST_ID`. Keep `OPS_WRITE_ENABLED=false` until compliance, role, versioning, and integration tests pass; set `true` only after **independent written IT authorization**. Roles are derived exclusively from trusted `requireActor` session. POST/PATCH check Origin and JSON body size. Each transition retrieves current item with ETag, confirms `StationKey`, verifies role and transition, and updates fields using `If-Match` to reject stale writes.

**Limitations:** history stored on the task item is revision-coupled, but is NOT an immutable external compliance audit. Per-site isolation must also be enforced at the Microsoft 365 ACL layer, not just application filtering. Operations task ID is SharePoint item integer, not a booking identifier. No automatic customer email, dispatch SMS, telephony, Wheelsys API, fleet changes, billing or AI write tools. Browser UI transitions are manual. Production user acceptance, Graph permissions, 2-editor race and actual browser E2E are NOT verified. Vercel Hobby must not be used for company commercial operations.

## Test and release gates

- Run `npm test` and `npm run lint:syntax`. Test creation, transitions, manager verification, stale ETags, station confinement, malformed inputs, missing configuration and Graph races.
- Run protected synthetic-only preview, review with nontechnical supervisors. Confirm zero real customer/employee data and no public storage.
- Require company signoff, commercial hosting approval, correct corporate OAuth grants, SharePoint private list/schema, accepted data retention policy, independent audit, manual restore plan, scoped user roles and end-to-end tests before enabling real corporate writes.

Rollback: v1.2 feature branch commit `5595bd704ac39144cebcea02c3e1099a4c0b337c` remains intact. New changes reside on `feature/shiftos-rental-operations-v13`.
