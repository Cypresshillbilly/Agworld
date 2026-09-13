# AgWorld — Official Development Version 2

Release date: 13 September 2026 (Africa/Johannesburg).

**Release status:** Development Version 2 is published and verified within the development-release scope below. Both player frontends match all 18 reviewed runtime files. Commander version 7, the V2 database migrations and the reviewed Render API are deployed. The API health check returns 200; unsigned farm writes and private profile requests return 401. The release checkpoint is `baseline/development-v2`; the companion release record identifies its exact revision and verification limits.

This is the product-owner-authorized Development Version 2 source baseline for the complete repository and all included pages. It supersedes earlier screen-version descriptions where the documented behaviour differs. A development baseline records a reproducible state; it does not certify all legacy pages for unrestricted production administration.

## Restore points and documentation

- V2 checkpoint: [`baseline/development-v2`](https://github.com/Cypresshillbilly/Agworld/tree/baseline/development-v2), created at the verified release commit after merge. Keep it unchanged.
- Previous accepted checkpoint: [`baseline/official-2026-09-12`](https://github.com/Cypresshillbilly/Agworld/tree/baseline/official-2026-09-12) at `e3b90b0d0c68f9625bf4576477db5ab9fc1b1b0e`.
- Full implementation, architecture, review and roadmap: [Development V2 project report](docs/DEVELOPMENT_VERSION_2_PROJECT_REPORT.md).
- Primary player site: [Render](https://ag-world.onrender.com/AG%20WORLD/index.html).
- Additional publication: [GitHub Pages](https://cypresshillbilly.github.io/Agworld/).

The separately delivered release record identifies the exact merged revision and live verification results. Source restoration does not rewind player records, storage, authentication accounts, memberships, secrets, billing or provider configuration.

## Version 2 experience

- Preserve the approved AgWorld reference style and outer screen geometry, staged login/loading and recovery.
- Open on SADC with collapsed drawers, explicit geographic selection, map layers and recorded market influence.
- Keep Dashboard profile, sales funnel, current mission and six advisors; skills remain in Profile. Mission XP/stars appear in a white block on the right, with no scrolling inside the dashboard mission card.
- Start a new player with phased System Administrator orientation. Continue through Compliance readiness, Product learning and Sales scouting-to-meeting missions.
- Resume saved steps and preserve earlier XP/completions. The current mission owner briefs; already-heard arrival briefings stay quiet.
- Keep speech independent of dialogue visibility. Microphone and webcam require deliberate actions, with capture stopped on cancellation.
- Save private document/photo uploads in player-owned folders. Complete missions atomically with one reward per mission.
- Keep staff Product/Technical retrieval behind administrator-approved collection membership. Technical training is optional for the sales role.

## Connected services

Supabase project: `vcnkspaljmsjvonftfcw`.

- Commander function: `ag-world-commanders`, deployed **version 7**, source `AG WORLD/server/commanders/index.ts`.
- Version 7 artifact SHA-256: `a9ca31c22974e379967286629fdfc91c9aef4a9072754e70e8cc27bf0fd1ca23`.
- Migrations: `agworld_development_v2_private_uploads_and_missions` and `agworld_development_v2_audited_relationship_access`.
- Migration sources: `AG WORLD/server/development-v2.sql` and `AG WORLD/server/development-v2-access.sql`.
- Render API writes and private profile reads require a verified enrolled player. The server derives audit identity from that token.

Render workspace: **My Workspace** (`tea-dac4e8mk1f9s73e4ss00`). API service: `srv-dac4r6f40ujc73b1btn0`, branch `main`, root directory **`AG WORLD/server`**, build `npm install`, start `npm start`, automatic deployment on commits. The old `server` shortcut prevented changes under the real directory from triggering deployment. Correcting the root directory triggered successful deployment `dep-daj3s70ae00c738h21e0` on 13 September 2026 at 06:10 UTC, from revision `c54f3d57f923fbadfbc3c2604130e12af7be109a`.

Commander POST requests validate the signed-in player inside the function. Product/Technical additionally enforce library membership. The OpenAI key remains in provider secrets. Preserve authentication and the exact permitted game origins when redeploying.

## Verification and remaining work

Verification passed: full local and remote browser regression, two mission-card viewport inspections, boot/dependency checks, domain/commander/auth tests, catalogue consistency and transaction/error-path tests. Database fixtures verified mission ordering, one-time rewards, player isolation, private uploads and relationship ownership and were rolled back. Live file comparison, commander allowed-origin/auth checks and API health/unsigned-request checks passed. A read-only diagnostic of the deployed authorization module confirmed enrollment and audit-identity replacement against the live player table using a controlled verified-identity fixture; this does not claim a fresh end-to-end player login or a production farm save.

The unused legacy `/api/users` adapters still reference the absent `users` schema and need retirement or migration. The current player interface uses `ag_players`; keep that as the XP authority. No production player data was changed during these release checks.

The reviewed database error-level findings were resolved. Leaked-password protection remains a provider warning. Legacy administration role migration, curated product assessments, a compliance review queue, recurring sales assignments and production real-time 3D models/animations remain roadmap work. See the report for scope and evidence; do not describe every line as manually audited or every device as visually certified.
