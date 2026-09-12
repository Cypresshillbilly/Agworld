# AgWorld Immersive Drawers — Version 3

[Territory Board and Nested Player Hub V4](PLAYER_SCREEN_V4_BASELINE.md) now governs map selection and the independent navigation/information drawers. The aluminum and landscape styling below remains current.

Approved by the product owner on 12 September 2026. This supersedes V2's fixed-panel visibility, thin bezel and Enter AgWorld rules. V2's player data, mission, advisor and route requirements remain in force.

- The live map is the persistent game world. Login and refresh start with all four drawers closed. Only their edge handles and Developer Mode remain above the map.
- Player Hub opens from the far left and contains both the navigation rail and the player workspace. Dashboard is the default route; closing and reopening the drawer preserves the selected route and its mounted contents.
- Map Menu opens down from the top. It contains the map tools and account controls. There is no Enter AgWorld or Player View button.
- Command Center opens up from the bottom. Selecting a farm or entity after boot opens its existing command information. Closing it does not reset the map or selected entity.
- Territory Stats opens from the right. Its closed footprint is only its 28px handle; no panel border or shadow should remain along the screen edge.
- Each drawer operates independently, including all 16 open/closed combinations. All can remain open together. Collapsed contents are inert and excluded from the accessibility tree; handles report their expanded state and support keyboard activation.
- The open Player Hub keeps the V2 widths: 180px navigation plus 350px workspace at a 1280px shell, scaling with shell width. The map, Map Menu and Command Center use the remaining width and expand when the left drawer closes.
- Dashboard geometry remains stable when Command Center closes: profile, personal Sales Funnel, complete non-scrolling mission and six advisors retain their positions. The advisor bay aligns with the Command Center's display below its thicker frame.
- Command Center and Territory Stats share a photographic brushed-aluminum material, a thick machined silver frame, a dark inset gasket and the established deep teal display surface. Do not replace other game cards with silver panels.
- The sidebar farmland covers the full height, anchored at the bottom, with its sky blended gradually into the dark teal navigation. Keep readable pale menu text and the approved readable tagline at the foot. Move navigation below the complete logo symbol and wordmark; mask only the embedded micro-taglines.
- Transitions take approximately 280ms and respect reduced motion. Toggling a drawer must not recreate the map, reload player data, clear forms or award mission progress.

## Acceptance checks

Exercise all 16 drawer combinations, default closed state after login and refresh, unchanged map and profile DOM identity, selected route preservation, keyboard activation, hidden-panel inertness, and 1280×720 / 1280×900 / 1600×1000 layouts. Verify relevant mission artwork, full mission visibility, skills in Profile, Administrator audio controls, sales isolation, login/logout and failure recovery. Check live assets after deployment.
