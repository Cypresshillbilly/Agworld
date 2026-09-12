# AgWorld commander service

Deploy `index.ts` as Supabase Edge Function `ag-world-commanders` on project `vcnkspaljmsjvonftfcw`. `OPENAI_API_KEY` is an Edge Function secret only. It must never be placed in the browser, repository, config.js or GitHub Pages.

The gateway uses `verify_jwt: false` for publishable-key compatibility. Every POST independently validates the caller's bearer token with Supabase Auth. Do not remove that validation. Product and Technical retrieve their library using the caller's JWT and existing approval/RLS checks, not a service-role connection. Chat, speech and transcription are the only model operations. They cannot perform game mutations.

Defaults: `gpt-5-mini` for answers, `gpt-4o-mini-transcribe` for recordings, `gpt-4o-mini-tts` for speech. Chat and transcription model names may be overridden through `OPENAI_MODEL` and `OPENAI_TRANSCRIPTION_MODEL`. The configured voice directions pair Cedar with Administrator, Marin with Product, Onyx with Technical, Ash with Sales, Verse with Operations and Coral with Compliance. These are synthetic character voices, not replicas of real people.

The user approved sending questions, bounded recent dialogue and relevant approved staff-source excerpts to OpenAI for answers, and separately approved sending answer text to OpenAI for speech. Browser speech recognition may be used first; if unavailable or its service fails, a user-initiated recording can be sent for transcription. No microphone starts on page arrival. Recording is capped at 20 seconds/5 MB; close, switch and cancellation invalidate pending permission/transcription results.

GET health exposes only service name and whether the secret is configured. It is not proof of provider billing, quota or successful generation. The deployment must also be checked with a signed-in player: a game-guide question, an approved library question, and playable character audio.

Browser requests are allowed from the production game origins `https://ag-world.onrender.com` and `https://cypresshillbilly.github.io`, plus the two fixed local preview origins in `index.ts`. Both preflight and authenticated responses must echo the requesting allowed origin. Rejected origins remain blocked and emit an origin-only diagnostic; tokens, questions and URL paths are never logged. Verify the actual player address when investigating a browser “Failed to fetch” error.

Requests have timeouts and bounded inputs; chat sends at most five retrieved passages and four recent messages, with Responses storage disabled. The 20-request/minute/user limiter is per Edge Function isolate, not a distributed spending cap. Set provider project budgets/alerts and add a shared limiter before broader rollout if hard quotas are required.

The game presents existing advisor portraits while production real-time 3D models are prepared. See `docs/commander-3d-production-brief.md`. The rejected procedural model is not shipped.

Validation: `node .github/tests/commander-service.test.mjs` (from repository root), the browser regression workflow and a live authenticated smoke test. Browser tests mock the model service and use synthetic player/source data.
