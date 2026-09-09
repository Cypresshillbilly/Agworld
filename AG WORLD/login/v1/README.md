# AG WORLD LOGIN — OFFICIAL WORKING VERSION 1

**Status:** LOCKED BASELINE  
**Locked:** 2026-09-09

This directory is the single canonical source of truth for the approved AG World login page.

## Canonical V1 runtime
- `login-panel.js` — approved panel layout and official brand presentation
- `auth.js` — login, Remember Me, Create Account and authentication flow
- `gate.js` — login gate integration

## V1 acceptance state
- No underlying application flash on refresh
- Both login actions render together
- ENTER AG WORLD uses real authentication
- CREATE ACCOUNT opens the employee account flow
- Company Facility is part of account creation
- Remember Me persists credentials when selected
- Official AgWorld and Game Changer branding are used
- Approved panel scale, logo spacing and clear gap to the AgWorld logo

**Rule:** Future login work starts from this V1 baseline. No additional legacy login overlays or duplicate login scripts may be added underneath it.
