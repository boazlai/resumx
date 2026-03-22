# Authentication

- Type: shared system with dedicated pages
- Status: functional, incomplete
- Primary files:
  - `web/app/sign-in/page.tsx`
  - `web/app/sign-up/page.tsx`
  - `web/app/forgot-password/page.tsx`
  - `web/app/auth/reset-password/page.tsx`
  - `web/app/api/auth/forgot-password/route.ts`

## Current Status

Authentication is production-usable for standard email/password and OAuth sign-in. The essential flows exist, but account-hardening and account-lifecycle features are still missing.

## What Works

- Email/password sign-in
- Email/password sign-up with validation
- Forgot-password flow and reset page
- Email verification on sign-up
- Google OAuth
- GitHub OAuth
- Protected routes redirect unauthenticated users

## Missing Or Weak

- No magic-link or passwordless login
- No 2FA
- No session management UI
- No security alerts
- No account deletion flow
- No account data export flow

## Need To Be Done

- Add stronger account security controls
- Add account-lifecycle features required for privacy/compliance
- Align auth status docs with future feature work as each flow is added

## Next Steps

- Add session management and security alerts
- Add 2FA or passwordless, depending on the preferred auth strategy
- Add account deletion and export to close the lifecycle gap
