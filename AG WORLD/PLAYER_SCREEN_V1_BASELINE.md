# AgWorld Player Screen — Official Version 1 Baseline

**Status:** Historical baseline; superseded by the owner-approved [Player Command V2](PLAYER_SCREEN_V2_BASELINE.md) on 12 September 2026.
**Established:** 10 September 2026  
**Scope:** Player screen geometry and component composition

## Purpose

This document defines the official **Version 1 Player Screen baseline** for AgWorld.

The current Player Screen is now the canonical geometry from which future player screens must be derived. Future work may improve the content, data, artwork, interaction and internal layouts of individual panels, but must not alter the locked screen-level geometry unless the product owner explicitly approves a new Player Screen geometry version.

## Locked Screen Geometry

The following are baseline invariants:

1. The overall Player Screen fills the intended game viewport.
2. The left navigation rail remains a fixed screen-level component.
3. The Player Profile area remains in its established upper-left position and footprint.
4. The Skill Profile remains directly below the Player Profile in the established component structure.
5. The Current Mission panel remains in its established position and footprint.
6. The Advisory Bay remains part of the left-side player panel composition and must not be clipped, displaced or removed by map/layout changes.
7. The map remains the dominant right-side game surface and extends behind the floating Command Center as established in the approved V1 layout.
8. The Command Center remains a floating overlay on the map, positioned over the ocean below the African landmass.
9. The Command Center retains the approved V1 footprint, including visible map space around it.
10. The Command Center heading is centred across the full heading bar.
11. The LIVE indicator is independently positioned on the right and must never affect heading centring.
12. The Command Center must remain a clean game panel with no legacy silver/tablet bezel.
13. Territory Stats remains a right-side pullout control.
14. Territory Stats opens outward to the left from the far-right side of the screen.
15. Territory Stats is closed on initial page load.
16. Territory Stats must remain above and spatially separated from the Command Center; it must never extend behind or overlap the Command Center.
17. The approved gaps between major screen-level components are part of the baseline geometry.

## Locked Components

The following Player Screen components are part of the canonical V1 composition:

- Left navigation rail
- Player Profile
- Skill Profile
- Current Mission
- Advisory Bay
- Player map surface
- Territory Stats pullout
- Floating Command Center

These components are locked as screen-level composition elements.

## What May Change Later

Future iterations may modify individual panel internals without changing this baseline geometry, including:

- Player data and progression presentation
- Profile imagery
- XP displays
- Skill spider graph and skill metrics
- Mission rewards and star logic
- Mission content
- Advisor imagery, data and interactions
- Command Center internal controls and data
- Territory Stats internal data visualisation
- Styling and micro-interactions inside individual panels

## Change Control

Any future change that moves, resizes, removes, overlaps or changes the screen-level relationship of the locked components above is a **Player Screen geometry change**.

Such a change must not be made incrementally or accidentally. It requires an explicit decision to create a new approved Player Screen geometry version.

Until then, this document and the current implementation are the official **AgWorld Player Screen Version 1 baseline**.
