# ShiftOS v1.1 — Operations Intelligence & Nontechnical UX

**Release type:** protected synthetic preview / engineering validation only.
**Source references:** descriptions retrieved from the user's connected Instagram saved-posts browser tab on 2026-11-24; visual Reel frames were not available. Influences are conceptual patterns, not copies of external code.

## Scope implemented

- Unified beginner-friendly navigation: `Προσομοίωση` and `Ροές εργασίας` in both synthetic and authenticated UIs.
- Dashboard quick starts: open schedule, simulate operational demand, inspect approval flow. No remote mutations from quick starts.
- **Operations Simulator:** manually entered pickups/returns, three service windows (07:00–11:00 / 11:00–17:00 / 17:00–23:30), profile templates (balanced / arrival peak / evening peak), adjustable handling time, explicitly adjustable eligible staff fraction and productive time. Outputs approximate workload versus scheduled time. Uses existing shift codes and aggregates ONLY; no person names or customer records in report. No Microsoft Graph read/writes beyond the roster data already loaded by the existing authenticated app.
- **Workflow Center:** four human-readable stages (Draft → Check → Approval → Encrypted backup) with navigation to existing restricted controls; no new automatic approvals or publication.
- **Decision Inbox:** deterministic local suggestions derived from aggregated existing CHECK counts, missing/invalid roster cells and period status. Suggestions never perform actions.
- Contextual Greek glossary, tours and dependency map updated for both modules.
- Accessibility: text equivalents, labelled sliders/selects, keyboard-focus style, reduced-motion variants, responsive adaptation.

## Operational calculations and limits

- The simulator is a deliberately basic **what-if calculation**, not a prediction, shift recommendation, financial estimate, labor-law audit, AI forecast, optimized roster or booking integration.
- Users manually choose vehicle handovers/returns and hypothetical time per task. The arrival/return shares are explicit distribution assumptions, not actual historical demand or flight arrivals.
- Capacity = overlapping scheduled worker minutes × user-assumed eligible% × user-assumed productive%. It does **not** infer skills from employee names or teams. Absent shifts become absent capacity; `R`, `L`, `S` and unknown codes never create capacity.
- Duplicate shift records for the same employee/date cannot double-count capacity (first valid assignment is considered); duplicate detection belongs to the separate CHECK/release validation.
- Overnight shifts from the previous day are included only if the roster already contains their previous-date record. Week and month continuity may be incomplete.
- Each block shows workload and hypothetical available time, with uncertainty labels; **not** an HR or statutory staffing conclusion.
- None of the new features stores input to a backend, browser localStorage, email or analytics. Reloading loses the what-if scenario.

## Security and product constraints

- Previous Entra/OID allowlists, Graph access controls, mutation locks, approval gates and backup encryption are untouched.
- Do not enable the synthetic demo in a deployment containing real roster data. Vercel preview must retain Vercel Authentication for every target.
- The production preflight remains **blocked** until corporate IT authorization, private SharePoint permissions and proper commercial hosting exist.
- Original `ΠΡΟΓΡΑΜΜΑ.xlsx` remains unmodified and still has previously detected anonymous edit links. These require a permitted tenant owner/IT cleanup.
- Existing Microsoft 365 email grants were not changed.

## QA checklist / acceptance gates

1. `npm test` must pass (67 tests after this release).
2. `npm run lint:syntax` must parse all JSX / JS / MJS sources with zero diagnostics.
3. Vercel preview build must reach `READY` on exact commit, with no build errors, under enabled SSO protection.
4. Verify the UI via a browser when authenticated preview access is available; a READY build is not equivalent to browser functional tests.
5. Test keyboard, mobile, errors and state changes with at least two nontechnical supervisor users before production.
6. Compare estimates against real approved aggregate operations records before interpreting them operationally; never import customer PII into the synthetic preview.
7. Do not release company roster data until all P0 security gates are satisfied.

## Rollback

- Source branch: `feature/shiftos-remediation-v10` (commit `ee2b9137fe0b109d5fd58ace71a720320231a5cc`).
- Release branch: `feature/shiftos-operations-v11`.
- Do not promote an untested preview to production. Leave the legacy `programshift-os` untouched and paused.

## Deferred work (NOT implemented)

- Real M365 tenant configuration; private SharePoint lists; revocation of anonymous workbook permissions; verified coediting and E2E tests.
- Actual rental pickup/return data feeds, forecasting, WHEELSYS integration, role/skills-based supply, queueing model calibration, timezone/DST boundary QA against enterprise records.
- Live AI inference, proactive agent execution, Microsoft Graph automations, scheduled backups or automatic approvals.
- Optional future stack research: headless table/virtualization, state-machine visualization, ECharts, motion, assistive AI; none were added to current bundle to preserve dependency/cost control.
