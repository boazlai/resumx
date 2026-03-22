# Import Flow

- Type: dialog plus backend flow
- Status: functional, narrow
- Primary files:
  - `web/components/dashboard/import-resume-button.tsx`
  - `web/components/dashboard/import-button.tsx`
  - `web/app/api/import/route.ts`

## Current Status

Users can import existing resume files into the app and create a new resume from the converted content.

## What Works

- Import PDF, DOCX, Markdown, and TXT
- Validate file types and size limits
- Create a new resume from imported content
- Use filename-derived default titles

## Missing Or Weak

- No preview-before-import step
- No batch import
- No LinkedIn or GitHub profile import wired into the dashboard flow

## Need To Be Done

- Decide whether import remains a quick one-shot tool or becomes a richer onboarding workflow
- Connect profile-based import if it stays part of the product roadmap

## Next Steps

- Add preview/confirm before creating the imported resume
- Wire in the existing profile import modal if that remains planned
