// This file is intentionally empty. Thumbnail rendering was replaced with
// server-side screenshots stored in Supabase Storage. See:
//   api/screenshot.ts          — Playwright screenshot endpoint
//   web/app/api/resume/[id]/thumbnail/route.ts — stores result in DB
//   web/components/dashboard/resume-card.tsx   — renders <img> directly
export {}
