# Agriculture Build

This directory is the logical boundary for the GAME CHANGER Agriculture build.

Phase 2 migration rule:
- new Agriculture-specific code is added here;
- manifests describe existing live modules before physical moves;
- existing root modules remain temporarily as compatibility modules;
- no Agriculture-specific module should be added to GAME CHANGER core.

Current capabilities:
- Agriculture Sales Profile
- Mission delivery
- Mission detail and completion
- South African territory map
- Farm visualisation and data layers

The next migration pass will move implementation modules behind these manifests and retire root-level compatibility paths only after page-by-page validation.