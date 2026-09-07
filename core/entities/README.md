# AG World V2 Core Entity Engine

This directory is the frozen V2 foundation for dynamic map entities.

## Core rule

All dynamic map objects use one shared entity model:

- Farm
- Contractor
- Competitor
- Company
- Company Facility

Static geography and territories remain outside the entity engine.

## Layering

Database/API → Repository → Service → Map/UI

No V2 module should override global browser APIs such as `window.fetch` or `localStorage`.

## Status

This is the first V2 compatibility layer. Existing Farm code is not removed yet; it will be migrated incrementally into this engine.
