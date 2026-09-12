# AgWorld — Official Development Version 2

Release date: 13 September 2026 (Africa/Johannesburg).

**Release status:** The player frontends, commander function version 7 and V2 database migrations are published. Both frontends match the reviewed runtime files and their regression checks passed. The Render API has not yet picked up the reviewed authorization/error-path changes: its unauthenticated farm write still returns the earlier 500 response instead of the required 401. Render workspace confirmation is pending before that deployment can be inspected. **Final all-service signoff and creation of `baseline/development-v2` remain pending.** This status takes precedence over the target release description below.

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

Commander POST requests validate the signed-in player inside the function. Product/Technical additionally enforce library membership. The OpenAI key remains in provider secrets. Preserve authentication and the exact permitted game origins when redeploying.

## Verification and remaining work

Local verification passed: full browser regression, two mission-card viewport inspections, boot/dependency checks, domain/commander/auth tests, catalogue consistency and transaction/error-path tests. Database fixtures verified mission ordering, one-time rewards, player isolation, private uploads and relationship ownership and were rolled back. The release process also requires passing remote checks and matching live files before creating the checkpoint.

The reviewed database error-level findings were resolved. Leaked-password protection remains a provider warning. Legacy administration role migration, curated product assessments, a compliance review queue, recurring sales assignments and production real-time 3D models/animations remain roadmap work. See the report for scope and evidence; do not describe every line as manually audited or every device as visually certified.
