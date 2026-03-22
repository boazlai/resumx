# Dashboard

- Type: page
- Status: functional, moderately mature
- Primary files:
  - `web/app/dashboard/page.tsx`
  - `web/components/dashboard/dashboard-shell.tsx`
  - `web/components/dashboard/resume-card.tsx`
  - `web/components/dashboard/create-resume-button.tsx`
  - `web/components/dashboard/tag-editor.tsx`

## Current Status

The dashboard is the main resume-management surface. It supports most single-user resume CRUD and organization tasks.

## What Works

- List resumes
- Search resumes
- Sort resumes
- Filter by tags
- Rename resumes inline
- Duplicate resumes
- Delete resumes
- Show thumbnails and timestamps
- Create new resumes
- Manage tags on resumes

## Missing Or Weak

- No bulk actions
- No starter template gallery
- No application tracker
- No collaboration or share analytics surfaced here
- No recent activity timeline

## Need To Be Done

- Decide whether the dashboard is strictly CRUD or also the control center for collaboration and application workflows
- Add summary visibility for share links, collaborators, and usage once those systems mature

## Next Steps

- Add bulk actions
- Surface collaborator/share state on each resume card
- Add starter templates or import-first onboarding
