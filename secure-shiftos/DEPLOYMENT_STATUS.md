# ShiftOS V1.5 RC1 — Instrumental Redesign (preview only)

Baseline: V1.4 (`3fd1c595d8e09bbe2a23b023aa1f43b9f3cdbb59`).

Added exact task matrix, scoped design tokens, data-state clarity, per-slot drill-down and manager-friendly density controls. No new npm dependency, auth change, SharePoint write expansion, corporate secret, paid platform or customer data.

**Verification gates**: unit tests, syntax, CSS parse, visual contrast spot checks; independent Next.js build on protected preview if deployed. Browser E2E and screenshot comparison remain unverified until run with valid Vercel Authentication.

**Production**: BLOCKED — corporate Entra setup, private SharePoint List ACL, independent append-only audit, two-user integration test, workbook exposure remediation, and approved commercial hosting are not yet available.

Rollback: V1.4 protected preview/branch commit above. See `docs/INSTRUMENTAL_REDESIGN_V15.md` and `docs/IMPROVEMENT_LEDGER_V15.md`.
