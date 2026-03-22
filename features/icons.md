# Icons

- Type: page and editor sidebar feature
- Status: functional, mature enough for daily use
- Primary files:
  - `web/app/icons/page.tsx`
  - `web/components/icons/icon-browser.tsx`
  - `web/app/api/icons/route.ts`

## Current Status

The icons feature is available both as a dedicated page and from inside the editor sidebar. It supports built-in, Iconify, emoji, and user-uploaded icons.

## What Works

- Browse built-in icons
- Search Iconify icons
- Browse emoji
- Upload custom icons
- Delete custom icons
- Copy icon syntax
- Insert icons from the editor sidebar

## Missing Or Weak

- No favorites or collections
- No recent icon history
- No batch icon import
- No offline caching strategy for remote icon searches

## Need To Be Done

- Decide whether icons are a utility only or a stronger personalized asset library
- Keep user-uploaded icon constraints documented as limits change

## Next Steps

- Add favorites or recents if usage justifies it
- Add better visibility into uploaded icon limits and errors
