# GAME CHANGER Architecture Audit & Cleanup Plan

## Audit snapshot
The current repository is functional but has grown through iterative patches. The main risks are:
- root-level Agriculture-specific scripts mixed with platform core;
- multiple presentation override files for the same areas;
- browser localStorage used as the mission source of truth;
- role/build selection implemented separately from authentication;
- mission save logic attached as an enhancement listener rather than a single domain service;
- API bridge overrides global browser APIs and is Agriculture-specific;
- legacy AG WORLD naming remains in implementation paths and API namespaces;
- no explicit build manifest or central route/bootstrap contract.

## Target architecture
```
core/
  bootstrap/
  auth/
  builds/
  roles/
  missions/
  users/
  events/
  ui/
builds/
  agriculture/
    assets/
    pages/
    map/
    data/
    profile/
    missions/
  financial-services/
admin/
server/
database/
legacy/ (temporary quarantine only)
```

## Rules
1. GAME CHANGER core must not contain Agriculture-specific UI, data, or assets.
2. Every build is described by a manifest.
3. Roles belong to builds.
4. Missions are a core domain model with build + role scope.
5. Mission UI reads from one mission repository API; it never manufactures demo cards.
6. Authentication/session routing is the only authority for user landing pages.
7. Build selection is explicit and persistent, but users are also constrained by their permitted build.
8. New code must not override global fetch or Storage prototypes.
9. UI patch files should be consolidated into component/page styles.
10. Legacy files are removed only after dependency verification.

## Current migration priorities
P0: establish central bootstrap, build registry and mission store contract.
P1: replace localStorage mission writes/reads with one repository abstraction.
P2: move Agriculture mission/profile/map adapters behind build-specific modules.
P3: centralise auth/session/build routing.
P4: consolidate root-level UI overrides and retire duplicate branding/legacy loaders.
P5: migrate farm API bridge away from global fetch/Storage monkey patches.

## Acceptance checks
- Admin build selection changes active build context consistently.
- Administrator login routes to admin; Agriculture sales routes to Agriculture profile.
- Mission Library and Salesman cards show the same ordered mission records.
- Deleted missions disappear everywhere.
- No demo mission is rendered when no real mission exists.
- Login uses the active build's declared background asset.
- Refresh causes no logo or branding layer flash.
- Core code can support a second build without importing Agriculture files.
