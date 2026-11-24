## Latest candidate — v1.1 RC1

- Source: `feature/shiftos-operations-v11` (new, isolated candidate).
- Tests: 67/67 local Node tests; 36 JavaScript/JSX syntax checks (as of 2026-11-24).
- Browser E2E: not yet verified. Full Vercel deployment status must be recorded after build, not assumed.
- Company data: none introduced. Preview remains synthetic and protected.
- Production: NO-GO pending IT approval, private SharePoint, identity, access-list remediation and commercial hosting.

---

# V0.8 rollout status

- Feature branch: `feature/shiftos-premium-v08`
- Hosting: existing `shiftos-secure-preview`, Vercel Authentication on all deployments
- Production cutover: not authorized, not performed
- Company roster import: not performed
- Pay-as-you-go activation: not performed
- Scope: Greek onboarding, tooltips, information architecture and accessibility improvements, synthetic preview only

# ShiftOS 0.7 deployment status

- Changes are staged as a separate GitHub branch. Not approved for corporate production.
- Vercel preview must remain protected by Vercel Authentication and synthetic-only.
- Microsoft Entra, private SharePoint lists and corporate user allowlist remain UNCONFIGURED.
- No real employee data are in the repository or synthetic demo.
- Source OneDrive Excel and its old sharing links remain untouched.
- Existing live application remains paused.
- Validate Vercel build state and preview authentication before calling staging complete.
- Tests: `npm test`, `npm run lint:syntax`; production preflight must reject unapproved settings.
