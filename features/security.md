# Security

- Type: shared system
- Status: basic protections in place, hardening still needed
- Primary files:
  - `web/lib/rate-limit.ts`
  - `web/app/api/render/preview/route.ts`
  - `web/app/api/render/export/route.ts`
  - `web/app/api/auth/forgot-password/route.ts`
  - `web/app/api/share/[token]/route.ts`

## Current Status

The app has foundational security controls, mostly around auth-gated routes, collaborator access checks, share-token validation, and rate limiting on sensitive or expensive endpoints.

## What Works

- Auth-gated private routes and APIs
- Role-aware access checks for resume resources
- Tokenized public share links with expiry checks
- Rate limiting on preview, export, forgot-password, and public share access
- OAuth plus password auth flows

## Missing Or Weak

- No 2FA
- No session/device management
- No security alerts
- No account deletion/export lifecycle controls
- Rate limiting still has a roadmap item for stronger persistence/coverage
- No deeper audit trail surfaced to users

## Need To Be Done

- Keep security docs aligned with both auth changes and collaboration changes
- Distinguish infrastructure security work from user-visible account security work

## Next Steps

- Expand session and account security controls
- Add stronger audit or activity visibility where needed
- Revisit rate-limiting coverage as more collaboration and AI endpoints ship
