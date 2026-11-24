# v1.4.0 RC1 — UNVERIFIED BUILD UNTIL REMOTE CI
Motion + data-grounded instrument panel, no production writes, no company data.
Previous V1.3 rollback commit: ace1a74a6a8afe9db49f57b9077e00852d1c98a8.

# ShiftOS V1.3 RC1 — Rental Operations WRITE workflows

## Staging status
- Branch: `feature/shiftos-rental-operations-v13` (not merged to main).
- Current baseline/rollback: V1.2 commit `5595bd704ac39144cebcea02c3e1099a4c0b337c`.
- V1.3 adds operations domain, actual authenticated corporate create/transition API, Graph ETag concurrency, station-scoped task board, manager verification, Greek help and tests.
- Only synthetic demo is allowed on the current Vercel Hobby preview; **corporate write mode disabled by default**. No real staff/customer data.
- No paid services or backend databases added.

## Hard gates
- IT permission grants, private SharePoint site/list, company hosting entitlement, station scope and `OPS_WRITE_ENABLED=true` are missing, so corporate operations remain blocked.
- Original confidential ΠΡΟΓΡΑΜΜΑ.xlsx still has sharing exposure; app writes do not alter that file or its email grantees.
- Team-specific/employee permissions, persistent independent append-only audit and per-station delegated SharePoint ACLs require company validation.
- Live two-editor, production auth and UI E2E tests are NOT completed.

## Tests
Run `npm test`, `npm run lint:syntax`, and `npm run preflight`. `preflight` is expected to fail without corporate approvals. Build verification is separate.
