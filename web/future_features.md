# Future Features

## User Profile & Account Management

- [x] **Profile page** — Display name, avatar upload, email display (currently disabled stub in user menu)
- [x] **Password change** — Change password form with current password verification
- [x] **Forgot password / password reset** — No reset flow exists; users locked out if they forget their password
- [x] **Email change** — No ability to update email address
- [ ] **Account deletion** — No way to delete account and all associated data (GDPR concern)
- [x] **OAuth account linking** — Link GitHub and Google accounts to the same identity after signup
- [x] **LinkedIn / GitHub profile URLs** — Store profile URLs in preferences so templates can auto-fill contact links

---

## Settings Panel

Currently only has a dark/light toggle:

- [x] **Default font** — Global font preference so the user doesn't have to set it per resume
- [x] **Auto-save toggle / interval control**
- [x] **Auto-compile toggle** — Some users may not want the 10-second auto-render consuming API quota
- [ ] **Email notification preferences**

---

## Dashboard

- [x] **Resume duplication/clone** — Card only has Edit and Delete; no way to clone a resume to create a variant
- [x] **Search / filter resumes** — No search bar; unusable at 20+ resumes
- [x] **Sort options** — Sort by last modified, created date, or alphabetical
- [x] **Rename inline** — Currently requires opening the full editor to rename
- [x] **Resume tags / folders** — Group resumes by job application, language, or role variant
- [x] **Thumbnail preview** — Show a small PDF thumbnail on the card so users can visually identify resumes
- [ ] **Wire up GitHub / LinkedIn profile import** — `ProfileImportModal` component and `/api/profile/import` exist but are not rendered anywhere on the dashboard

---

## Export

- [ ] **HTML export** — Returns `501 Not Implemented`; implement the backend
- [ ] **DOCX export** — Returns `501 Not Implemented`; implement the backend
- [ ] **Batch export** — Export all variants/formats at once in a zip

---

## Resume Editor

- [ ] **Version history** — Auto-snapshots so users can roll back to earlier content; currently a single overwrite model
- [ ] **Resume sharing** — Generate a public read-only link (with optional expiry) to share the rendered PDF without downloading
- [ ] **Duplicate from editor** — Create a copy as a new resume without navigating back to the dashboard
- [ ] **Print directly** — Print button that triggers the browser print dialog on the rendered PDF
- [ ] **Word count indicator** — Useful for gauging resume length
- [ ] **Keyboard shortcuts reference panel**

---

## AI Features

- [ ] **In-app AI provider fallback** — If `N8N_WEBHOOK_URL` is not configured, chat returns 503 with no user-facing explanation; add a direct provider (OpenAI/Anthropic) or a clear error message
- [ ] **ATS / keyword score** — Auto-analyze the resume against a pasted job description and surface missing keywords
- [ ] **AI-powered inline section suggestions** — Suggest bullet rewrites without requiring full chat interaction
- [ ] **Job description tailoring shortcut** — A dedicated "Tailor for this JD" flow, not just via chat

---

## Authentication

- [ ] **Magic link / passwordless login**
- [ ] **Two-factor authentication (TOTP/SMS)**
- [ ] **Session management** — View and revoke active sessions
- [x] **Rate limiting on auth endpoints** — No brute-force protection on the sign-in form

---

## Infrastructure / UX Polish

- [ ] **Persistent rate limiting** — Preview and export endpoints use in-memory Maps that reset on cold start; replace with Upstash Redis
- [ ] **Unified toast / notification system** — Errors and success states are inconsistent across the app
- [ ] **Onboarding flow** — New users land on an empty dashboard with no guidance; add a wizard or sample resume to reduce drop-off
- [ ] **Richer empty state** — Current empty state is minimal; add "start from a template" or "import from LinkedIn" prompts
- [ ] **Mobile responsiveness of editor** — The split-pane editor with sidebar likely breaks on mobile; needs graceful degradation
- [ ] **Usage / quota display** — If limits exist (renders per day, resumes, storage), users should see current usage
- [ ] **Billing / plan page** — No subscription management UI exists for a paid SaaS model
- [ ] **Fix broken `/icons` route** — Linked in `AppHeader` but the page doesn't exist (404)
