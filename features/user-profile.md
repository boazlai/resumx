# User Profile

- Type: dialog
- Status: functional, incomplete
- Primary files:
  - `web/components/profile-panel.tsx`
  - `web/app/api/user/profile/route.ts`
  - `web/app/api/user/email/route.ts`
  - `web/app/api/user/password/route.ts`

## Current Status

The profile dialog supports core account management, but it does not yet cover full account lifecycle or richer profile data.

## What Works

- Edit display name
- View email
- Change email
- Change password
- Link and unlink OAuth providers
- Display avatar or initials
- Store LinkedIn and GitHub URLs

## Missing Or Weak

- No avatar upload
- No profile auto-import wired to the dashboard flow
- No session/device management
- No account deletion
- No account data export
- No activity history

## Need To Be Done

- Clarify whether profile should remain a dialog or grow into a full settings/account area
- Keep linked-account behavior documented as auth features expand

## Next Steps

- Add account deletion and export
- Add session history/device management
- Decide whether avatar upload matters enough to support directly
