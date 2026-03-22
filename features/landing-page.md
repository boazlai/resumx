# Landing Page

- Type: page
- Status: stable, basic
- Primary files:
  - `web/app/page.tsx`
  - `web/components/app-header.tsx`

## Current Status

The landing page is a minimal entry point for unauthenticated users. It explains the editor at a high level and routes signed-in users away to the dashboard.

## What Works

- Public homepage at `/`
- Links to sign in and sign up
- Authenticated-user redirect to dashboard
- Shared app header and branding

## Missing Or Weak

- No richer product marketing or walkthrough content
- No feature highlights, pricing, or onboarding guidance
- No social proof, demos, or callouts for collaboration, import, or AI features

## Need To Be Done

- Decide whether the landing page stays intentionally minimal or becomes a real marketing/onboarding page
- Add clearer paths into import, templates, and collaboration if the product remains SaaS-first

## Next Steps

- Add a small feature overview section tied to current web capabilities
- Add links to import and shared resume workflows if those are product priorities
