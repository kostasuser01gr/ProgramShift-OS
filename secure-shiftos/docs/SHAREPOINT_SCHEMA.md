# Corporate Microsoft 365 data contract

All lists are located in **one new private SharePoint site** whose ACL excludes the common station identity, ordinary staff and anonymous/organization-wide links. IT must verify inherited permissions, sharing policies, application grants, and version history. Do NOT build lists in the existing shared HERAKLION folder or reuse the publicly linked ΠΡΟΓΡΑΜΜΑ.xlsx.

Configure these SharePoint lists and **exact internal column names** (created once; UI display name may differ):

| List | Field (internal name) | Type | Rule |
| --- | --- | --- | --- |
| Employees | EmployeeKey | Single line text | Unique, required; stable pseudonymous employee ID |
| Employees | DisplayName | Single line text | Required |
| Employees | Active | Yes/No | Required |
| Shifts | ShiftKey | Single line text | **Unique enforced**, required; value `EmployeeKey\|YYYY-MM-DD` |
| Shifts | EmployeeKey | Single line text | Required |
| Shifts | ShiftDate | Date only | Required |
| Shifts | ShiftCode | Single line text | Required (empty string allowed only where approved) |
| Shifts | LastEditorOid | Single line text | Optional |
| Periods | PeriodKey | Single line text | **Unique enforced**, `YYYY-MM` |
| Periods | Status | Choice or single line text | DRAFT, REVIEW, PUBLISHED, LOCKED |
| Periods | ReviewedBy | Single line text | Optional |
| Periods | MutationLock | Single line text | Optional column, initially blank. CAS lock for all writes and publish; must be cleared only by audited administrator after crash |

A period item must exist for each month, initially `DRAFT`. Editors cannot create a period via the app. Import every expected employee/day shift row in a supervised migration, using exact source data and a dry-run report. Each list must keep SharePoint item version history. Grant no direct access to the station identity. Grant app access with least privilege via delegated Graph Sites.Selected and a selected-site permission; confirm Microsoft Graph API semantics with the tenant admin.

Recommended separate restricted backup library, with retention rules, restore exercises, and no anonymous links. The XLSX is exported as `.xlsx.enc`: decrypt offline using `node scripts/decrypt-backup.mjs <encrypted-file> <output.xlsx>` and passphrase interactively via prompt/secure input (avoid shell history).
