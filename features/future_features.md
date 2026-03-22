# Future Features

## User Profile & Account Management

- [ ] **Account deletion** — No way to delete account and all associated data (GDPR concern)
- [ ] **Account data export** — Let users export their resumes, settings, share links, and profile data before leaving
- [ ] **Recent account activity** — Show recent sign-ins, linked-account changes, password changes, and share-link creation events

---

## Settings Panel

Current panel covers theme, default font, auto-save, and auto-compile. Remaining gaps:

- [ ] **Email notification preferences**
- [ ] **Default export preferences** — Preferred format, filename pattern, and whether export should auto-compile first
- [ ] **Privacy controls** — Control analytics, public share defaults, and retention for snapshots/share links

---

## Dashboard

- [ ] **Wire up GitHub / LinkedIn profile import** — `ProfileImportModal` component and `/api/profile/import` exist but are not rendered anywhere on the dashboard
- [ ] **Bulk actions** — Multi-select resumes for bulk delete, export, duplicate, and retagging
- [ ] **Starter resume gallery** — Let new users start from role-specific markdown templates instead of a blank file
- [ ] **Application tracker** — Track job, company, stage, and which resume variant was used for each application

---

## Export

- [ ] **HTML export** — Returns `501 Not Implemented`; implement the backend
- [ ] **DOCX export** — Returns `501 Not Implemented`; implement the backend
- [ ] **Batch export** — Export all variants/formats at once in a zip
- [ ] **Export presets** — Save export bundles like `PDF + share link` or `PDF + DOCX + source markdown`

---

## Resume Editor

- [ ] **Keyboard shortcuts reference panel**
- [ ] **Resume diff view** — Compare snapshots or variants side-by-side before restoring or tailoring
- [ ] **Command palette** — Fast access to compile, export, duplicate, share, print, and insert actions from one searchable menu
- [ ] **Protected share links** — Optional password, email gate, or disable-download mode for shared resumes
- [ ] **Commenter suggestion mode** — Turn collaborator suggestions into explicit review changes with accept/reject flows instead of direct source edits
- [ ] **Realtime presence for collaborators** — Show active avatars, live cursors, and concurrent editor sync for shared resumes

---

## AI Features

- [ ] **In-app AI provider fallback** — If `N8N_WEBHOOK_URL` is not configured, chat returns 503 with no user-facing explanation; add a direct provider (OpenAI/Anthropic) or a clear error message
- [ ] **ATS / keyword score** — Auto-analyze the resume against a pasted job description and surface missing keywords
- [ ] **AI-powered inline section suggestions** — Suggest bullet rewrites without requiring full chat interaction
- [ ] **Job description tailoring shortcut** — A dedicated "Tailor for this JD" flow, not just via chat
- [ ] **Resume quality linting** — Flag weak bullets, missing metrics, vague verbs, repeated phrases, and formatting risks before export
- [ ] **Cover letter generator** — Generate a tailored cover letter from the current resume and job description
- [ ] **Saved job description library** — Keep multiple JDs attached to a resume and compare tailoring fit across them

---

## Authentication

- [ ] **Magic link / passwordless login**
- [ ] **Two-factor authentication (TOTP/SMS)**
- [ ] **Session management** — View and revoke active sessions
- [ ] **Security alerts** — Notify users about password changes, newly linked OAuth providers, and suspicious sign-ins

---

## Infrastructure / UX Polish

- [ ] **Persistent rate limiting** — Preview and export endpoints use in-memory Maps that reset on cold start; replace with Upstash Redis
- [ ] **Notification design pass** — Standardize toast severity, recovery guidance, and placement across auth, editor, and dashboard flows
- [ ] **Onboarding flow** — New users land on an empty dashboard with no guidance; add a wizard or sample resume to reduce drop-off
- [ ] **Richer empty state** — Current empty state is minimal; add "start from a template" or "import from LinkedIn" prompts
- [ ] **Mobile responsiveness of editor** — The split-pane editor with sidebar likely breaks on mobile; needs graceful degradation
- [ ] **Usage / quota display** — If limits exist (renders per day, resumes, storage), users should see current usage
- [ ] **Billing / plan page** — No subscription management UI exists for a paid SaaS model
- [ ] **Public share analytics** — Let users see views, downloads, and expiry status for each shared resume link
