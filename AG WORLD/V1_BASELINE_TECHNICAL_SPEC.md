# AgWorld Official V1 Screen Baselines and Technical Specification

**Status:** Official baseline documentation  
**Established:** 10 September 2026  
**Applies to:** Login Screen V1 and Player Screen V1  
**Change control:** Geometry and screen-level composition are locked unless a future version is explicitly approved.

---

# 1. Project scope at this baseline

AgWorld currently has two approved screen baselines:

1. **Login Screen V1**
2. **Player Screen V1**

These are the approved visual and geometric foundations for future development. Future work should modify component internals, data, interactions and functionality without changing the approved screen-level geometry.

The Player Screen V1 baseline is additionally governed by `PLAYER_SCREEN_V1_BASELINE.md`.

---

# 2. Login Screen V1

## 2.1 Screen ownership

Canonical runtime files:

- `index.html` — application shell and boot shield
- `login/v1/auth.js` — authentication gate and lifecycle
- `login/v1/login-panel.js` — canonical V1 visual composition
- `login/v1/gate.js` — login gate integration

## 2.2 Approved visual composition

The V1 login screen consists of:

- Full-viewport approved AgWorld login background
- AgWorld official horizontal logo centred in the upper screen
- Floating login panel centred horizontally
- Game Changer official brand block on the left of the panel
- Username and password form on the right
- Remember Me control
- Enter AgWorld primary action
- Create Account secondary action
- No legacy login artwork inside the canonical login panel
- No underlying application flash during authentication or refresh

## 2.3 Canonical desktop geometry

### Viewport

- Login gate: fixed at `inset: 0`
- Overflow: hidden
- Canonical background: `assets/backround v1.3.png`
- Fallback background: `assets/ag_world_login_v2.jpg`

### AgWorld logo

- Horizontal centre: 50%
- Vertical position: `clamp(18px, 4.5vh, 60px)`
- Width: `min(900px, calc(100vw - 72px))`
- Maximum height: 40vh
- Object fit: contain

### Login panel

- Horizontal centre: 50%
- Vertical centre: 63% of viewport
- Width: `min(742px, calc(100vw - 36px))`
- Maximum width: 742px
- Padding: 19px vertical × 26px horizontal
- Border radius: 15px
- Internal layout: flex row
- Internal gap: 22px

### Game Changer left column

- Flex basis: 42%
- Right divider separates branding/actions from credentials
- Official Game Changer logo maximum width: 310px
- Official Game Changer logo maximum height: 108px

### Actions

- Primary and account actions: 38px high
- Full width of the Game Changer action column

### Form

- Input height: 39px in canonical V1 presentation
- Compact vertical rhythm
- Password remains user-entered and is not persisted by Remember Me

## 2.4 Mobile breakpoint

At 720px and below:

- Login panel becomes a single vertical stack
- Panel top: 58%
- Width: `min(442px, calc(100vw - 28px))`
- AgWorld logo maximum width: `min(430px, calc(100vw - 48px))`
- Game Changer divider changes from right border to bottom border

## 2.5 Login lifecycle

1. Boot shield covers the underlying application before application code paints.
2. Authentication checks current session state.
3. If authenticated, the canonical application shell is released.
4. If unauthenticated, the login gate is mounted.
5. The V1 presentation module applies the approved visual composition.
6. The boot shield is removed only after the login gate or approved authenticated state is ready.

## 2.6 Security baseline

Remember Me now stores only the username/email. Legacy plaintext password entries are removed from browser storage during login initialisation.

Production authentication must continue to rely on Supabase Auth or another trusted authentication provider. The browser must never become the authority for credential validation.

---

# 3. Player Screen V1

## 3.1 Canonical screen-level components

The locked V1 Player Screen contains:

1. Left navigation rail
2. Player Profile
3. Skill Profile
4. Current Mission / Mission Control
5. Advisory Bay
6. Primary map surface
7. Territory Stats pullout
8. Floating Command Center
9. Map header and map controls
10. Player/game mode controls

These components are locked as screen-level composition elements.

## 3.2 Canonical shell geometry

The implementation uses a canonical 1280px-wide desktop geometry and scales the principal left-stage widths from the current shell width.

Reference desktop geometry:

- Sidebar: 180px
- Missions/player column: 285px
- Combined left stage: 465px
- Map at 1280px shell: 815px

Runtime formulas:

- `canonicalScale = shellWidth / 1280`
- `sidebarWidth = round(180 × canonicalScale)`
- `missionsWidth = round(285 × canonicalScale)`
- `leftStage = sidebarWidth + missionsWidth`
- `mapWidth = shellWidth - leftStage`

The shell owns the geometry. The map does not own the sidebar or missions layout.

## 3.3 Left-side Player Screen

### Sidebar

Locked:

- Full shell height
- Left edge
- Independent of map geometry

### Player Profile

Locked:

- Upper Player Screen composition
- Established footprint in the missions column
- Player image/data may change internally
- External geometry may not move without a new baseline version

### Skill Profile

Locked:

- Directly below the Player Profile within the approved left composition
- Internal graph and skill information may change
- External panel footprint remains part of the baseline

### Current Mission

Locked:

- Mission Control footprint and location
- Mission data, XP, stars and skill rewards may change internally
- Mission panel boundary is part of the approved geometry

### Advisory Bay

Locked:

- Lower missions/player composition
- Must remain visible and must never be clipped by map or Command Center changes
- Advisor imagery and selection interactions may change internally

---

# 4. Player Map Surface

## 4.1 Map boundary

The map:

- Begins at the right edge of the locked left stage
- Extends from the top of the Player Screen to the bottom of the shell
- Is clipped with a crisp edge
- Does not use soft map shadows or blurred pseudo-edge layers
- Continues behind the floating Command Center

## 4.2 Command Center placement

The Command Center is a shell-level overlay above the map.

It must:

- Float over the ocean portion of the approved South Africa map composition
- Remain below the African landmass
- Remain above the bottom map edge
- Remain horizontally centred within the map
- Leave visible map margins on both sides
- Never touch the map edge

Current geometry model:

- Width: `min(round(mapWidth × 0.93), round(780 × canonicalScale))`
- Height: `max(round(160 × canonicalScale), round(shellHeight × 0.19))`
- Bottom margin: `max(18px, round(shellHeight × 0.024))`
- Horizontal position: centred within the map
- Z-index: above map content

## 4.3 Command Center heading

Locked rules:

- Heading height: 34px
- `COMMAND CENTER` is geometrically centred at 50% of the entire heading bar
- LIVE is independently anchored at the right
- LIVE must never influence title centring
- Command Center has no legacy silver tablet frame
- Command Center has no metallic bezel layer

## 4.4 Command Center content

The internal content begins below the heading:

- Content top: 42px
- Content height: `calc(100% - 42px)`

Internal cards, data, radar/skill graphics and command functionality may evolve without moving the outer V1 geometry.

---

# 5. Territory Stats V1

## 5.1 Behaviour

- Closed by default on every fresh Player Screen load
- User opens it manually
- Located at the far right edge of the map/screen
- Opens outward to the left
- Is independent of the Command Center
- Must never overlap or extend behind the Command Center

## 5.2 Geometry

Runtime rules:

- Right edge: 0
- Top inset: `max(70px, round(74 × canonicalScale))`
- Width: clamped between 228px and 272px according to available map width
- Preferred height: up to 360px scaled, while constrained by available vertical space
- Minimum height: 190px
- Gap above Command Center: minimum 18px

Hard rule:

> Territory Stats and the Command Center are separate vertical assets. Territory Stats is mathematically capped above the Command Center with a visible gap.

---

# 6. Player Screen V1 interaction baseline

## Advisory Bay

- Advisor icons are asset-driven
- Advisors are individually selectable
- Selection state is visible
- Sales Advisor selection opens the Strategic Commander in the approved map location
- Clicking the selected Sales Advisor again removes the Strategic Commander
- The Strategic Commander must not be permanently pinned to the map
- Other advisor behaviours may be implemented later

## Mission Control

Mission presentation supports:

- XP reward
- Skill star rewards
- Per-skill star allocation
- Start Mission interaction

## Player progression

The V1 screen supports:

- Player identity
- XP
- Level/chapter progression
- Skill values
- Skill visualisation
- Mission reward linkage

---

# 7. V1 change-control rules

The following changes require an explicit new screen geometry version:

- Moving the sidebar
- Changing left-stage proportions
- Moving Player Profile, Skill Profile, Mission Control or Advisory Bay as screen-level assets
- Changing map boundaries
- Moving the Command Center outside its approved floating relationship to the map
- Allowing Territory Stats to overlap the Command Center
- Reintroducing a tablet/silver bezel around the Command Center
- Changing the default Territory Stats closed state

Internal component work is permitted without a new geometry version.

---

# 8. Runtime ownership summary

| Area | Canonical owner |
|---|---|
| Boot visibility | index.html boot lock |
| Login authentication | login/v1/auth.js |
| Login visual composition | login/v1/login-panel.js |
| Player screen geometry | main-game-layout-v1.js |
| Player component refinement | profile-menu-refinement.js |
| Player surface composition | agworld-player-surface-final-v1.js |
| Mission Control internals | agworld-player-progression-stack-v1.js and agworld-mission-control-card-polish-v1.js |
| Command/Territory surface | agworld-command-territory-final-v3.js |
| Final Command Center heading surface | main-game-layout-v1.js V62 canonical surface |

---

# 9. Baseline status

**Login Screen V1:** LOCKED  
**Player Screen V1:** LOCKED

Future work should now proceed component by component while preserving these screen-level contracts.
