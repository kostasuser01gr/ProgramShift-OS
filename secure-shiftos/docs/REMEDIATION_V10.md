# ShiftOS V1.0 RC1 — Security & Transaction Remediation

## Repair scope
- Pinned `next@15.5.29` and `next-auth@4.24.15` (latest verified patch floors on 21 November 2026).
- Corporate authentication returns HTTP 503 until Entra and `NEXTAUTH_SECRET` exist; middleware redirects protected pages, and the synthetic demo is separate.
- Every shift write, new shift, and month transition takes a CAS lock on the **same Period list item** with `If-Match` ETag.
- **No automatic lock expiry.** If a process dies while holding the lock, all app writes/publish block. IT must compare SharePoint version history and audit trace, then reset `MutationLock` manually. This deliberately sacrifices availability for integrity. Disallow direct modification to backing lists except authorized operations.
- Publishing checks complete month, duplicate employee/date rows, recognized codes, minimum active shifts *every day*, explicit codebook approval, adjacent-month evidence, and any 11h/35h warnings.
- 51 local unit/integration tests include concurrent edit/publish mock and fail-closed crash handling.

## Before real use
1. Tenant IT creates **new private SharePoint site** and lists, **excludes the common station identity**, revokes anonymous source links after approved migration and verification, retains named mail users. Owner accounts in the *source* are not touched by this patch.
2. Add a `MutationLock` optional single-line-text field to `Periods` list, initially blank. Allow Graph conditional PATCH `If-Match` for Periods and Shifts. Enforce unique ShiftKey and PeriodKey.
3. Set `MIN_STAFF_PER_DAY` to the minimum approved by managers and HR. Set `CODEBOOK_APPROVED=true` **only after** resolving ambiguous source codes `208`, `235` and accepting the reconciled code mapping.
4. Approve and securely configure SSO `AZURE_AD_...`, `NEXTAUTH_SECRET`, `SHAREPOINT_...`, user OIDs and release gates. Test two concurrent manager sessions and a denied station account. Test 11h, 35h, night shifts, leave, and month boundaries with real schedules.
5. Production freeze/unfreeze recovery, restricted backup destination, automated retention, immutable audit journal, and a true migration comparison are **not implemented**. They remain release blockers.
6. Hobby Vercel is non-commercial; this build is a technical preview with only synthetic data, not company production.

## Evidence limitations
CAS behavior is supported by Microsoft Graph documentation (`PATCH /sites/{site-id}/lists/{list-id}/items/{item-id}/fields` with `If-Match` returns 412 on mismatch), but multi-editor real-tenant integration is **not yet verified**. The lock protocol is application-level and cannot stop an operator who bypasses the app to write directly to SharePoint lists. `reviewWeeklyRest` is an operational heuristic, not legal certification. Encrypted exports are on-demand only, not automatic backups. Access ACL of the old shared workbook is unchanged.

## Commands
```
npm install
npm test
npm run lint:syntax
npm run build
npm run preflight  # expected to fail until enterprise provisioning; do not override
```
