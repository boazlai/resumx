# Preview And Export

- Type: panel plus backend export/preview APIs
- Status: partial
- Primary files:
  - `web/components/editor/pdf-preview.tsx`
  - `web/app/api/render/preview/route.ts`
  - `web/app/api/render/export/route.ts`
  - `web/app/api/resume/[id]/pdf/route.ts`

## Current Status

Preview and PDF export are working. Multi-format export exists in the UI, but only PDF is implemented end to end.

## What Works

- Compile current markdown into preview PDF
- Show loading and error states
- Export PDF
- Print from the current preview state

## Missing Or Weak

- HTML export returns not implemented
- DOCX export returns not implemented
- No batch export
- No export presets
- Preview pane has no zoom or page navigation controls

## Need To Be Done

- Keep export docs aligned with backend route support instead of UI labels alone
- Separate preview concerns from export concerns when the implementation becomes more complex

## Next Steps

- Implement HTML export
- Implement DOCX export
- Add export presets only after format support is real
