# v1.4 Release Candidate — Instrumental Motion

## v1.1 RC1 candidate (2026-11-24)

UI / Features: Operations Simulator, Workflow Center and Decision Inbox in both authenticated and synthetic views.
Verification: 67 Node tests and 36 syntax checks passed locally. npm install timed out in the local environment, so a local Next.js build was not verified; Vercel build required.
Permissions: unchanged; original Excel and email grants unchanged.

---

# ShiftOS secure web release — verification report

Release: 0.5.0
Date: 2026-11-21
Canonical Excel: untouched (`ΠΡΟΓΡΑΜΜΑ.xlsx` on Europcar OneDrive)
Source repository: untouched (`kostasuser01gr/ProgramShift-OS`)
Vercel project: unchanged / paused (`programshift-os`, Hobby)
Real employee records shipped: **none**

## Verified here
- Node 22 module syntax: passed for security/Graph/auth/API modules.
- JSX syntax parsed with TypeScript 5.8.3: passed 4/4 JSX files.
- `node --test`: passed 11/11 tests (allowlist/tenant/blocked shared account; production gates; backup confidentiality; Graph ETag conflict; non-Graph pagination URL protection; shift parsing; 11-hour review).
- `npm run preflight`: correctly fails with missing production configuration (fail closed).
- Test encryption/decryption on an actual *synthetic* XLSX: verified separately.

## Not verified / incomplete
- `next build` (offline environment missing npm Next.js/ExcelJS dependencies).
- Microsoft Entra app registration, tenant consent, selected-site permission grants and valid OAuth tokens.
- Corporate SharePoint lists and permissions; no real data migration.
- Production simultaneous-edit Graph integration and supervisor acceptance.
- 35-hour rest full validation; monthly rollover and approval workflow; full parity with the Sophia workbook.
- Automated durable backup scheduling/recovery and upload to private SharePoint.
- Vercel deployment / commercial hosting authorization.

Do not represent this package as a deployed or fully production-ready enterprise service. It is a functioning, self-contained source implementation with tested security primitives and a clearly documented integration gate.
