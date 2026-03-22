# Share Links

- Type: dialog plus public page
- Status: functional, narrow
- Primary files:
  - `web/components/editor/share-dialog.tsx`
  - `web/app/api/resume/[id]/share/route.ts`
  - `web/app/share/[token]/page.tsx`
  - `web/app/api/share/[token]/route.ts`

## Current Status

Public share links exist as a separate publishing feature from collaborator access. They expose a read-only public view of a resume via tokenized URL.

## What Works

- Generate public share link
- Configure expiry
- Copy link
- Revoke link
- Render public shared page without sign-in

## Missing Or Weak

- No password-protected shares
- No email-gated access
- No analytics
- No multiple share modes per variant
- No disable-download or stronger viewer controls

## Need To Be Done

- Keep public share behavior clearly separated from collaboration permissions
- Document whether public share is snapshot-based or latest-resume based whenever that behavior changes

## Next Steps

- Add analytics and stronger share controls if public sharing remains important
- Consider variant-specific shares once batch export/view workflows are clearer
