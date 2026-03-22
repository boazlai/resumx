# AI Chatbot

- Type: editor sidebar panel
- Status: functional, partial
- Primary files:
  - `web/components/editor/chat-panel.tsx`
  - `web/app/api/ai/chat/route.ts`

## Current Status

The AI panel can suggest edits against the current resume and apply them through a structured diff-like flow. It is useful now, but still depends on an external webhook and lacks broader product flows.

## What Works

- Send prompts with current resume context
- Stream AI responses
- Parse structured find/replace suggestions
- Show inline diff decorations
- Accept or reject suggestions individually
- Clear pending suggestions

## Missing Or Weak

- No provider fallback when the webhook is unavailable
- No ATS scoring
- No dedicated job-description tailoring flow
- No saved prompt or job-description history
- No persistence of chat history across sessions
- Disabled for non-editors in the current collaboration slice

## Need To Be Done

- Decide whether chat remains a generic panel or becomes several focused AI workflows
- Keep suggestion behavior coordinated with future commenter review mode so the product does not end up with two competing review systems

## Next Steps

- Add a clearer failure mode when no AI backend is configured
- Add dedicated JD-tailoring and resume-quality analysis flows
