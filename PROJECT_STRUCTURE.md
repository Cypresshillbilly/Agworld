# Repository Structure

## GAME CHANGER

The corporate software development company and owner of the product ecosystem.

- `GAME CHANGER/BRAND/` — Game Changer corporate brand assets and guides.
- `GAME CHANGER/BRAND/LEGACY_REFERENCE/` — historical/reference artwork retained for traceability.
- `GAME CHANGER/BRAND/RETIRED_V1.2_REFERENCE/` — retired logo package that must not be treated as the approved master.

## AG WORLD

A Game Changer application. All AgWorld-specific application code, assets, data, database material, builds, documentation and brand assets live exclusively under `AG WORLD/`.

### Official baseline documentation

- `AG WORLD/V1_BASELINE_TECHNICAL_SPEC.md` — canonical Login Screen V1 and Player Screen V1 geometry, dimensions, elements and runtime ownership.
- `AG WORLD/PLAYER_SCREEN_V1_BASELINE.md` — Player Screen V1 locked geometry contract.
- `AG WORLD/CODEBASE_AUDIT_AND_HARDENING_20260910.md` — current audit findings, cleanup actions and production hardening backlog.
- `AG WORLD/ARCHITECTURE_AUDIT.md` — target application architecture.

### Application areas

- `AG WORLD/login/` — versioned login and authentication presentation.
- `AG WORLD/core/` — shared domain and platform modules.
- `AG WORLD/builds/` — build-specific modules.
- `AG WORLD/assets/` — application imagery and runtime assets.
- `AG WORLD/brand/` — approved AgWorld brand assets.
- `AG WORLD/data/` and `AG WORLD/database/` — application data and database material.
- `AG WORLD/server/` — server-side components.

## Shared repository infrastructure

`.github/` remains at repository level because it contains repository automation and deployment workflows.
