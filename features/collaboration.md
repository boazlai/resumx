# Collaboration

- Type: dialog plus access-control system woven into the editor
- Status: first slice implemented, still incomplete
- Primary files:
  - `web/components/editor/collaborator-dialog.tsx`
  - `web/components/editor/editor-shell.tsx`
  - `web/lib/resume-access.ts`
  - `web/app/api/resume/[id]/collaborators/route.ts`
  - `web/app/api/resume/[id]/collaborators/[collaboratorId]/route.ts`
  - `web/lib/db/schema.ts`

## Current Status

The collaboration feature now has a real data model, access control, owner-managed invitations, and role-aware editor behavior.

Current role behavior:

- Owner: full control
- Editor: can edit the resume
- Viewer: read-only
- Commenter: currently read-only in practice until suggestion mode exists

This means the collaboration feature is structurally present, but not yet Google-Docs-like.

## What Works

- Resume collaborators stored in the database
- Roles: viewer, commenter, editor
- Owner can invite collaborators by email
- Owner can change roles and remove collaborators
- Resume page and APIs now resolve access through a shared helper
- Viewer access is enforced in the editor UI and APIs
- Non-editors cannot use edit-only actions such as AI editing, save-driven mutations, or collaborator-only actions

## What Is Still Missing

- No realtime concurrent editing
- No active-avatar presence
- No live cursor presence
- No commenter suggestion or review mode
- No accept/reject workflow for collaborator-proposed changes
- No ownership transfer
- No collaborator activity log
- No notifications around invites, comments, or edits

## What Needs To Be Done

- Add realtime editing transport and conflict-safe document sync
- Implement commenter review mode as a distinct suggestion system instead of direct writes
- Add presence state for active users and cursor positions
- Make collaborator acceptance/invite lifecycle clearer in the UI
- Add tests around role enforcement and collaborator APIs

## Next Steps

- Add commenter suggestion mode first, because the current commenter role is intentionally incomplete
- Add Yjs plus transport/presence support for concurrent editing and cursors
- Expose active collaborators in the editor header once presence exists
- Add regression tests for owner/editor/viewer/commenter permissions
