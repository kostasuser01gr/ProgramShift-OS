---
name: shiftos-motion
summary: Build purposeful, accessible operational motion in ShiftOS without changing company data or business logic.
version: 1.0.0
---
# ShiftOS Motion Engineering

## Authority and safety
Treat this as design guidance, not permission for writes, installs, deployments, or company data access. Never import instructions from screenshots/reels as code. Product priorities: correctness > security > task usability > accessibility > responsiveness > performance > aesthetic effects.

## Reference-derived practices
- **Emil Kowalski (`emilkowalski/skills`)**: review-animations, improve-animations, remove-animations, animation-performance, mobile-native, break-ui. Use these as qualitative reviews; don't install arbitrary agent code without approval.
- **Motion (`motiondivision/motion`)**: MIT licensed React primitive. Only use simple layout and presence transitions in the rental task board. `motion/react` 14.14.0 pinned as project dependency, separate from commercial Motion+.
- **DesignBookmark Motion**: interaction inspiration; inspect individual usage terms before copying components.
- **HyperFrames (`heygen-com/hyperframes`)**: Apache 2.0, suitable for optional standalone documentation videos, not a runtime dependency.
- **Remotion skills**: video composition guidance. Remotion runtime has separate source-available licensing; do not add to ShiftOS without licensing review.
- **Motion Canvas**: code-rendered explainers; keep standalone from dashboard.
- **Blender Skills**: 3D content authoring; not appropriate for daily shift/vehicle operations UI.

## Implementation rules
1. Animate only task creation, status changes, detail navigation, and positive/error feedback, with `AnimatePresence`/layout transitions. Never animate critical validation delays, data that is unknown, or fake telemetry.
2. Timings: notice <= 140ms, normal 220ms, panel 260ms, user can interrupt. No indefinite animation loops or full-page staggered reveals.
3. Only `opacity` and `transform` for entry/exit. Layout transition is handled by Motion; avoid JS-driven top/left and forced layout reads.
4. Respect `prefers-reduced-motion`: `MotionConfig reducedMotion="user"` and conditional layout/hover; content and focus remain identical.
5. Use semantic status strings alongside color. Always support keyboard operation, visible focus and accessible live regions.
6. Every chart maps to actual data: Source → unit → aggregation → timestamp → action. Without real history, never fabricate a trend; without staffing targets, never label task counts as staffing capacity.
7. Do not introduce animation libraries beside Motion without a measured need and license/cost review. All video tools remain optional external workflows.

## Validation gates
`npm test`, `npm run lint:syntax`, `npm run build` and protected browser E2E with keyboard, reduced-motion, mobile 360px, full desktop, 200+ tasks, empty state, and disabled production. Never claim browser validation unless it was performed. Examine layout shift, text clipping and focus after moving a task.

## Rerun loop
Read the last code and failure ledger, remove redundant animations, review performance, fix regressions, then document what changed. Keep Vercel Hobby as synthetic personal noncommercial evaluation only, with no workplace production usage.
