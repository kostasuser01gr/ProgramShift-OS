# ShiftOS v1.4 — Instrumental Motion & Rental Operations

## Scope
UX-only enhancements to the existing rental tasks UI. Unchanged: server routes, Graph permissions, SharePoint schema, task transition rules, original Excel, Vercel security environment.

## Delivery
- Motion 14.14.0 (MIT, pinned), used only in `rental-operations-board.jsx` and `operations-pulse.jsx`.
- Purposeful micro-interactions: editable form, task relocation across workflow columns, detail inspector, feedback notices, operator help panel.
- Snapshot telemetry based ONLY on current rental operations task records. Completion ratio = (DONE+VERIFIED)/total; open = NEW+IN_PROGRESS+BLOCKED; overdue requires dueDate earlier than local as-of date; all grouped by team and time slot. No fake trends, staff estimates, booking figures or rates.
- Accessible focus rings, semantic labels, no color-only states, reduced motion and compact responsive layout.
- Agent skill `skills/shiftos-motion/SKILL.md` for repeatable design governance.

## Evidence and limitations
- Simulator/demo data is synthetic; real tasks only appear when manager-authorized SharePoint setup exists.
- Visual performance is not proven until browser testing. Motion is a frontend dependency only; no AI API and no video render service.
- No independent append-only audit ledger yet; each task has SharePoint versioned HistoryJson, which is not a separate immutable log.
- Corporate SharePoint Operations List, named-identity permissions, real two-user ETag testing, original workbook ACL cleanup, enterprise hosting approval, and durable disaster recovery remain blocking.

## Source research
https://github.com/emilkowalski/skills
https://github.com/motiondivision/motion
https://designbookmark.com/motion
https://github.com/heygen-com/hyperframes
https://github.com/remotion-dev/skills
https://github.com/EL4CTEO/blender-skills
https://github.com/motion-canvas/motion-canvas

## Acceptance criteria
- All legacy regression tests pass, and new telemetry validations pass.
- Next.js build works and does not leak company data in public bundles.
- A task can be created in demo, moved NEW → IN_PROGRESS → DONE → VERIFIED (manager), and chart reflects resulting exact snapshot.
- Keyboard focus is visible and reduced-motion does not conceal state changes.
- Preview protected by Vercel Authentication and no production envs introduced.
