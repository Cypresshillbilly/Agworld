# AgWorld Game Visual System - V1.4

Effective 12 September 2026. The product owner's supplied `ChatGPT Image Sep 10, 2026, 09_56_13 PM.png` is the visual authority for the whole game. The reference is reproduced in [the V1.4 guide](guides/AgWorld_Brand_Guide_V1.4_Game_Visual_System.pdf).

The target is the reference's dark cinematic agricultural command interface: condensed type, photographic commanders, deep teal surfaces, fine luminous borders, lime actions and progression, gold rewards, and teal radar diagrams. Apply it to every dashboard card, sidebar route, map control, territory panel, entity card, form, dialog and interaction state.

## Authority and geometry

This edition supersedes V1.3's light dashboard direction for the game interface. V1.3 continues to govern logo masters, identity protection and print formulas. The approved login and loading surfaces remain separate. The [Player Screen V1 baseline](../PLAYER_SCREEN_V1_BASELINE.md) governs the main geometry: the reference's panel arrangement must not replace the existing game arrangement. Panel internals may adapt for readability within their established frames.

## Production game tokens

| Role | HEX | Use |
|---|---|---|
| Game canvas | `#00141B` | Workspace background |
| Main panel | `#001C25` | Card body |
| Panel highlight | `#042B30` | Upper-left illumination |
| Panel shadow | `#001017` | Dark end of card gradient |
| Inset surface | `#00151C` | Fields, tracks and statistics |
| Teal outline | `#25646C` | Fine panel boundaries |
| Primary text | `#EFF9FC` | Titles and key values |
| Secondary text | `#A9CCD2` | Readable supporting text |
| Active lime | `#B8EC24` | Primary action, selection and XP |
| Reward gold | `#FFCD48` | Stars and earned medals |
| Chart teal | `#36D4A9` | Radar fill at 30-35% opacity |

Main material: a 125-degree gradient from highlight through main panel to panel shadow, a 1 px teal border, a restrained inner top highlight and a short dark shadow. Use 6-7 px main card corners and 4-5 px inner tile corners. Green glow identifies active selection; avoid glowing every surface.

## Typography

Roboto Condensed is self-hosted under the CSS family `AgWorldCondensed`, with variable weights 100-900 and an OFL license in `assets/fonts`. The source image does not identify its actual typeface; this is the production visual match, not a claim of forensic font identification.

Use 400-500 for body text, 600-750 for headings, and 750-800 for primary actions. Screen titles: 24-25 px; card titles: 16-18 px; identity: 18-24 px; body: 12-14 px; compact labels: 10-11 px; major values: 23-29 px. Narrow geometry may require smaller nonessential captions. Preserve readable actions and allow internal scrolling rather than clipping content. Titles and actions use uppercase; descriptions use sentence case.

## Components and states

- Player: circular game portrait, lime rim, separate level badge, chapter and XP cells, lime progress track. A commander image is a game avatar, not a verified photograph of the player.
- Skills: five canonical axes (Compliance, Sales, Product, Operations, Technical), teal grid/fill, lime outline and gold points. Values come from the existing skill system. For percent bars, 25 earned stars equals 100%; zero remains zero. Tooltips and accessible chart descriptions identify skills and values.
- Missions: relevant agricultural artwork, chapter label, clear title and objective, separate XP and gold star rewards, full-width lime action. Keep real mission data and existing actions.
- Advisors: five rectangular photographic cards with consistent framing and short discipline captions. The selected card receives a lime border and controlled glow.
- Navigation: dark teal buttons, pale symbols and labels, lime selected state; Dashboard remains the default route.
- Forms and secondary actions: dark insets, teal boundaries, readable pale text. Focus receives a distinct lime outline; disabled controls remain readable. Respect reduced motion.
- Territory: readable statistics, true percentage ring, compact legend and an internal vertical flow within the existing right-side drawer.
- Company and entities: the same card family and chart language; summaries and detail forms can scroll independently inside the existing Command Center.

## Logos

Use the existing approved transparent PNG masters without tracing, recoloring, cropping or stretching. Preserve the complete AW sphere and leaf loop. Minimum digital widths remain 180 px horizontal, 120 px stacked and 32 px icon. The narrow rail uses the stacked master. The screenshot is a style reference, not a replacement logo asset.

## Implementation and review

`game-reference-theme.css` owns the visual system through one CSS layer. `game-reference-theme.js` activates it at the authenticated boot boundary and removes obsolete material overrides without removing layout styles. Existing card owners produce semantic content and live values. New components must extend this theme, not introduce competing appearance controllers.

Review Dashboard, every sidebar route, expanded territory, company/entity views, editing forms, profile windows and advisors at 1600 and 1280 px. Check unchanged outer geometry, font/art loading, readable labels, real values, contrast, focus, scrolling, delayed updates and Developer Mode. The guide states a visual target; completion of automated checks alone does not establish pixel identity with a raster reference in a different geometry.

## Asset provenance

- Typography: Google Fonts Roboto Condensed, OFL, self-hosted WOFF2.
- Commander portraits and logos: existing approved project artwork.
- Mission art: generated with the built-in image tool using the user's supplied image as a style reference. Final project asset: `AG WORLD/assets/missions/field-drone.webp`. Prompt: "Create a standalone landscape 3:2 mission-card illustration of an agricultural drone hovering over lush green maize rows at golden sunset. Polished realistic cinematic game artwork inspired by the small CURRENT MISSION thumbnail in the supplied AgWorld reference. Natural warm sky, crisp drone, dark rich green crops. No text, UI, logos, borders or panels." The generated PNG was resized and encoded as WebP for delivery; the original is retained.
