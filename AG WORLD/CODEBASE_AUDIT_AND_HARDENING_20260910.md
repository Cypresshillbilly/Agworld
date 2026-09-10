# AgWorld V1 Codebase Audit and Production Hardening Stock Take

**Audit date:** 10 September 2026  
**Scope:** Login Screen V1, Player Screen V1 and all directly loaded runtime dependencies  
**Audit method:** Static repository review, runtime entry-point inspection, load-order analysis, duplicate-load inspection, geometry-owner inspection, stale-layer inspection and security review.

---

# Executive summary

The two approved screens are now stable enough to serve as **official visual baselines**.

The repository is not yet a clean production architecture. It has accumulated a large amount of iterative patch history, particularly around Player Screen layout and the Command Center. The most important baseline risk is no longer visual correctness; it is maintainability.

The hardening work completed in this audit:

1. Removed a duplicate runtime load of `agworld-command-territory-final-v3.js`.
2. Removed browser persistence of plaintext passwords from Remember Me.
3. Added automatic cleanup of legacy plaintext password storage keys.
4. Preserved the approved Login V1 and Player Screen V1 geometry.
5. Documented canonical geometry, dimensions, ownership and change-control rules.
6. Identified remaining stale patch stacks and production blockers without deleting unverified dependencies.

---

# 1. Runtime entry-point audit

## index.html

The application entry point currently loads:

- Core/bootstrap modules
- Agriculture profile modules
- API and GIS modules
- Map/world modules
- HUD and game mode modules
- Login V1 modules
- Progression and mission modules
- Entity and relationship modules
- Backend/shared world modules
- Final Player Screen layout modules

### Finding: excessive script count

Severity: Medium maintainability / Low immediate visual risk.

The Player Screen is assembled through many independently loaded scripts. This works, but ordering is currently part of application behaviour.

### Finding: duplicate final Command/Territory script

Severity before fix: Medium.

The same `agworld-command-territory-final-v3.js` file was loaded twice with different cache query strings. This could duplicate:

- style injection
- mutation observers
- timers
- event listeners
- DOM paint passes

**Status: fixed.** Only the canonical runtime load remains.

---

# 2. Player geometry audit

## main-game-layout-v1.js

Current size is approximately 148 KB and contains a long historical patch stack.

The approved V1 geometry is correctly represented near the active Player Profile branch:

- Sidebar scaled from 180px canonical width
- Missions scaled from 285px canonical width
- Map fills the remaining shell width
- Map extends to shell bottom
- Command Center floats over the map
- Territory Stats remains above and separate from Command Center

### Finding: legacy patch stack remains

Severity: High maintainability / Medium regression risk.

The file still contains historical styling and layout layers with versions such as:

- v26 hard dark finish
- v28 strict split
- v29 strict split fix
- v30 flex split reset
- v32 full area
- v34 exact split
- later visual overrides
- V62 canonical Command Center surface

Many of these rules remain in the file because each iteration overrode the previous one rather than replacing it.

### Audit decision

Do not delete these blocks blindly during baseline lock.

They may still support:

- non-profile modes
- Company Command Center modes
- entity-specific surfaces

Removing them without a complete mode-by-mode runtime test could break functionality outside the approved Player Screen.

### Production recommendation

The next technical refactor should extract:

```
ui/
  player-screen/
    player-screen-layout.js
    player-screen-layout.css
    player-screen-components.js
  command-center/
    command-center.js
    command-center.css
  territory-stats/
    territory-stats.js
    territory-stats.css
```

Then migrate one verified active rule set at a time and delete historical patch blocks only after regression testing.

---

# 3. Geometry ownership audit

### Positive result

The V1 Player Screen now has a clear intended geometry owner:

`main-game-layout-v1.js`

The baseline branch explicitly computes:

- shell width
- shell height
- sidebar width
- missions width
- map width
- Command Center position
- Territory Stats maximum vertical extent

### Remaining risk

Other loaded scripts can still inject styles or mutate the same DOM elements.

Examples of high-risk shared surfaces:

- `profile-menu-refinement.js`
- `agworld-player-surface-final-v1.js`
- `agworld-command-territory-surface-v2.js`
- `agworld-command-territory-final-v3.js`
- `unified-panel-polish-v1.js`

### Rule going forward

No new screen-level geometry code should be added outside the canonical geometry owner.

Component modules may style only their own internal DOM.

---

# 4. Login V1 audit

## Positive findings

- Boot shield prevents underlying app flash
- Login presentation is applied through a canonical V1 visual module
- Login gate is idempotent
- Official AgWorld and Game Changer assets are explicitly used
- Mobile breakpoint exists

## Finding: plaintext password persistence

Severity before fix: High.

Remember Me previously stored passwords in browser localStorage.

**Status: fixed.**

The current implementation:

- stores only username/email
- removes legacy plaintext password keys
- relies on authentication/session providers for session persistence

This follows the general principle that sensitive credentials should not be stored in browser localStorage. citeturn0search0turn0search1turn0search3

## Remaining authentication blocker

Master authentication still contains client-side credential verification data.

Severity: High for true production deployment.

Client-side authentication logic must not be the final authority for privileged production access. Authentication and authorization should be centralised on a trusted service. citeturn0search10turn0search4

---

# 5. Supabase audit

The browser client uses a publishable Supabase key. A publishable key is intended to be visible in browser code, but security depends on correctly configured Row Level Security and least-privilege grants. citeturn2search0turn2search1turn2search3

## Required production verification

Before declaring the project production-ready:

1. Confirm RLS is enabled on every exposed table.
2. Review anon and authenticated grants.
3. Review every RLS policy.
4. Run allow/deny tests for critical operations.
5. Review Supabase Security Advisor findings.

Supabase's current production guidance specifically requires RLS review before production release. citeturn2search8turn2search3

---

# 6. Stale repository inventory

The repository contains many historical versioned files, including:

- app-gis-loader-v2 through v24
- multiple game/map variants
- multiple command surface variants
- multiple progression and mission iterations

These files are not all necessarily runtime dependencies.

## Cleanup policy

Do not delete historical files based only on their filenames.

A file can be deleted only after:

1. Repository reference search
2. Runtime entry-point verification
3. Manual regression check of affected mode
4. Confirmation that no deployment workflow references it

### Immediate safe cleanup completed

- Duplicate runtime script include removed

### Deferred cleanup

Historical GIS versions and old patch files remain pending dependency verification.

---

# 7. Observer and timer audit

Several modules use:

- MutationObserver
- delayed setTimeout paint passes
- repeated DOM mutation scanning
- periodic cleanup

These were effective during iterative visual stabilisation but are expensive compared with component-owned lifecycle methods.

## Production recommendation

For future modules:

- one observer per owned root where possible
- disconnect observers when the target is stable
- avoid whole-document mutation scans
- avoid repeating paint timers for permanent state
- use explicit lifecycle events instead

---

# 8. CSS/style audit

Current visual composition relies heavily on:

- injected style elements
- `!important`
- later-loaded overrides
- cache-versioned script order

This is the main maintainability risk.

## Rule going forward

New baseline work should prefer:

1. named component classes
2. dedicated stylesheet/module
3. one component owner
4. CSS variables for shared design tokens
5. no global override unless it is a deliberate platform rule

---

# 9. Current production readiness status

## Baseline stability

**Login Screen V1:** Stable baseline  
**Player Screen V1:** Stable baseline

## Engineering status

**Ready for controlled feature development:** Yes

**Ready for unrestricted production release:** Not yet

## Remaining production blockers

P0:

- Move privileged Master authentication authority fully server-side.
- Verify Supabase RLS, grants and policies.
- Confirm logout/session invalidation and authenticated route protection.

P1:

- Break the 148 KB main-game layout patch stack into owned modules.
- Consolidate duplicate/overlapping Command Center style rules.
- Reduce global DOM observers and repeated paint timers.
- Add automated smoke/regression tests for Login V1 and Player Screen V1.

P2:

- Dependency-audit and remove historical GIS/versioned files.
- Introduce a build manifest or bundling step.
- Replace cache-string version management with build-generated asset versions.

---

# 10. Regression acceptance checklist

Before any future geometry change is accepted, verify:

## Login V1

- No underlying application flash
- AgWorld logo centred correctly
- Game Changer brand visible
- Login panel desktop geometry preserved
- Mobile breakpoint preserved
- Remember Me does not persist passwords
- Authenticated refresh returns to the approved application

## Player Screen V1

- Full application viewport is used
- Sidebar intact
- Player Profile intact
- Skill Profile intact
- Current Mission intact
- Advisory Bay fully visible
- Map reaches shell bottom behind Command Center
- Command Center floats over ocean
- Command Center remains below landmass
- Command Center remains centred horizontally in map
- COMMAND CENTER title is exactly centred
- LIVE remains right aligned
- No tablet/silver frame
- Territory Stats is closed on load
- Territory Stats opens left from far right
- Territory Stats never overlaps Command Center

---

# 11. Audit conclusion

The official V1 screen baselines are now documented and protected conceptually.

The immediate stale runtime duplication and plaintext Remember Me issue have been removed.

The next phase should not add more patch layers. Development should proceed through component-owned modules while preserving the locked Login V1 and Player Screen V1 geometry.

The large historical layout stack remains the principal technical debt and should be refactored deliberately rather than deleted by guesswork.
