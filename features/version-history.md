# Version History

- Type: dialog plus snapshot APIs
- Status: functional, incomplete
- Primary files:
  - `web/components/editor/version-history-dialog.tsx`
  - `web/app/api/resume/[id]/snapshots/route.ts`
  - `web/app/api/resume/[id]/snapshots/[snapshotId]/route.ts`

## Current Status

Version history provides resumable snapshots and restore flows. It is useful as rollback support, but it is not yet a full compare-and-review system.

## What Works

- List snapshots
- Restore snapshots
- Delete snapshots
- Store labels and timestamps
- Create snapshots from editor workflows

## Missing Or Weak

- No side-by-side diff UI
- No bulk cleanup tools
- No retention policies
- No branching or named variants beyond simple labels

## Need To Be Done

- Decide whether snapshots stay lightweight rollback points or grow into a richer history system
- Keep permissions in sync with collaboration access as that feature expands

## Next Steps

- Add snapshot diffing before restore
- Add retention/cleanup strategy once snapshot volume becomes a real concern
