# Settings

- Type: dialog
- Status: functional, incomplete
- Primary files:
  - `web/components/settings-panel.tsx`
  - `web/app/api/user/preferences/route.ts`

## Current Status

Settings currently cover editor personalization and a small set of productivity defaults.

## What Works

- Theme selection
- Default font selection
- Auto-save toggle and interval
- Auto-compile toggle
- Basic UI accessibility sizing controls

## Missing Or Weak

- No notification preferences
- No export defaults
- No privacy controls
- No retention or analytics controls
- No usage/quota visibility

## Need To Be Done

- Separate pure editor preferences from account-level privacy and notification settings
- Keep theme/font additions reflected here as new options land

## Next Steps

- Add export defaults
- Add privacy controls
- Add notification settings if email/product notifications become real
