# Deployment status (release v0.6)

- **Source**: local generated code and tests. No real employee data in source.
- **Environment**: release gates disabled. Corporate Entra/SharePoint credentials not supplied.
- **Production**: NOT READY and MUST remain disabled.
- **Preview**: only synthetic demo allowed, through Vercel Authentication if compatible with account permissions.
- **Tests**: `npm test`; syntax parser `npm run lint:syntax`; live Next build remains unverified without npm dependencies.
