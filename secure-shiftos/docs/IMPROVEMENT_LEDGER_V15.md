# ShiftOS V1.5 — Improvement Ledger

| Area | V1.4 deficiency | V1.5 change | Validation | Remaining risk |
|---|---|---|---|---|
| Explainable operational metrics | Team and slot totals shown separately, difficult to connect to action | Clickable, accurate team × slot open-work matrix | deterministic Node tests | browser/keyboard E2E pending |
| Data availability | Failed corporate read could render a misleading empty list | Distinct unavailable/stale/loaded states with explicit explanation | state helper tests + source audit | live Graph session unavailable |
| Rental task navigation | No direct return from inspector, incomplete slot drill-down | Close inspector and select/clear slot/OPEN filters | syntax/regression + source inspection | visual usability review pending |
| Information density | Single density for all workstations | Compact/comfortable per-view toggle | static source inspection | user study pending |
| Design tokens | Large inherited CSS with scattered colors | Incremental semantic/primitive tokens scoped to premium surfaces | stylesheet parse/contrast spot check | wider legacy CSS refactor still open |
| Performance | Unbounded UI growth risk | bounded matrix (#teams × 3), existing Motion limits preserved | static analysis | real rendering measurements missing |
| Access/privacy | Production deliberately unconfigured | No backend/ACL change; stale displays suspend writes | existing security tests | IT approval and data migration pending |

**Rejected**: artificial charts without real data; unrelated video/3D frameworks; new paid services; forced company production; fake availability indicators.
