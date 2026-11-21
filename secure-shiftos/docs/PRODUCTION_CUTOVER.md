# Full production cutover checklist — not yet authorized

1. Obtain written corporate authorization for business software, GDPR handling and hosting; determine Vercel Pro budget/usage caps or approved corporate hosting. **Never use Hobby for operating Europcar schedules.**
2. Review current OneDrive sharing permissions on source Excel and parent folders, and preserve an immutable baseline backup/checksum. Legacy anonymous-edit links must be revoked by the corporate owner; current integration cannot revoke them.
3. Provision *separate private* SharePoint site/lists per `SHAREPOINT_SCHEMA.md`, with site administrators and five current authorized supervisors verified by individual Entra identities. The station shared identity must not be a site admin, member, guest or direct/inherited viewer.
4. Entra application: single tenant, delegated Graph permission `User.Read`, delegated `Sites.Selected` if supported by tenant and site grants; add correct `https://APP/api/auth/callback/azure-ad` redirect and corporate policy. Use short-lived rotating secrets.
5. Determine exact `AZURE_AD_TENANT_ID`, allowlisted `MANAGER_OIDS` and `EDITOR_OIDS`, and **BLOCKED_OIDS** (including the station identity). Keep tokens/keys in protected environment variables; no secrets in public repo.
6. Validate exact SOURCE workbook `ΠΡΟΓΡΑΜΜΑ.xlsx` (including shifts, AME, CODED mappings and source formulas) against the Sophia template; build a dry-run mapping for each month. Reject incomplete rows, unknown codes, conflicting AME IDs. Supervisor signs off a row-count + hash before import.
7. Import to private lists under authorized application credentials; verify 100% row/employee/day reconciliation, cross-month rests, and import idempotency. Initial month statuses DRAFT.
8. Set `IT_APPROVED`, `HOSTING_APPROVED`, `PRIVATE_ACL_REVIEWED` only once verified. Validate login for each supervisor, denial for anonymous, ordinary staff and station identity; test with private browser and direct API calls.
9. Two supervisors simultaneously edit different cells; same-cell stale ETag causes HTTP 409. Check DRAFT/REVIEW/PUBLISHED/LOCKED flows and all backup/decryption tests.
10. Perform a manual encrypted backup of test data, restore, checksum compare; set automatic scheduled retention and off-site recovery based on internal policy.
11. Release reviewed production build on approved hosting and monitor security events, spending, API errors, backup health. Keep original workbook read-only, access restricted by IT, not publicly discoverable.

**Rollback:** Turn off new app's write permission, restore last approved private SharePoint snapshot/version and reopen original unmodified workbook only under restricted corporate access. The older publicly linked Excel must not be considered a safe backup.

**Known limitations:** No fully transactional SharePoint multi-item commits. Publication requires strictly completed months and clean validation; exceptions need a formal policy. Synced app UI is polling, not WebSocket live presence. 35h check is advisory. Real-time budget cap and legal compliance need corporate verification.
