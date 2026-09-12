# AgWorld SADC Board and Player Drawers — Version 4

Product-owner direction, 12 September 2026. This supersedes V3 where described below.

## Opening map and selection

The game starts with all main drawers closed, framing the 16 SADC country polygons and their small clickable national flags. South Africa is the initial statistical scope. Clicking a country or its flag frames that country at provincial zoom and loads its first administrative divisions. South Africa has nine provinces. AFRICA exposes the wider 48-country sub-Saharan board; SADC restores the opening region; NATIONAL returns to South Africa's country overview.

Country geometry and flags appear below zoom 5.5. South African provinces appear from 5.5 to below 8, municipalities from 8 to below 11, towns from 11 to below 13, and farms/assets from 13 onward. Contractors, competitors and facilities share the farm threshold. Zoom reveals geometry without changing the selected statistics. Province and municipality clicks select statistics without changing zoom. Outside South Africa, first administrative divisions remain visible at closer zoom; municipal and town coverage is currently South African.

Country outlines and flags are hosted locally. Provincial geometry loads only for the explored country. Islands and interior rings are retained. Source versions, licenses and simplification are recorded in [the geographic data index](data/gis/africa/README.md) and the map credits.

## Market colors and values

Farm and contractor records are grouped by mapped geography. Country totals exclude records outside the selected country's polygons. Influence uses recorded drone quantities where available, with relationships, assets and explicit Customer/Client/Competitor status as fallback. Open entities count in the denominator. Country, province and municipal statistics use the same calculation as polygon colors.

Company-dominated areas are green, competitor-dominated areas red, balanced influence amber and uninfluenced areas gray. Selection adds a pale outline without replacing the control fill. Farm/contractor counts and Company/competitor/contested/open counts are distinct from the weighted percentages. Live data updates refresh the selected scope without choosing another territory.

## Drawers and dashboard

The left side has three states: closed; menu only with no highlighted route; and menu plus the chosen panel. Player Panel retracts the information panel underneath the menu. Clicking the highlighted route also retracts it. Menu closes both. Mounted forms and remembered routes remain intact. Top and bottom drawers adjust to available map width.

Dashboard places four floating dark game cards on a white workspace. Profile, Sales Funnel and Current Mission surfaces open their full sidebar sections, including keyboard activation. Existing action buttons retain their specific actions. Advisory Bay retains six individual advisor actions.

Map Menu contains developer diagnostics, navigation, import/export, entity creation and 16 map-layer controls. Developer Mode is hidden with its drawer. Territory Stats is vertically centered on the right, constrained between the open Map Menu and Command Center. Its aluminum frame remains.

A floating AgWorld icon opens a separate six-advisor drawer at the upper left of the map. It shares the advisor selection and System Administrator voice service with Dashboard. Opening the player menu closes and hides the map advisor drawer and launcher. Closing the advisor drawer stops its guide.

## Verification

Exercise 24 main drawer combinations, independent advisor access, card navigation, keyboard operation, map layers, developer diagnostics, country/flag drill-down, explicit province/municipality selection, country data isolation, live control colors and geographic asset integrity. Run the existing login, recovery, account, mission, sales, entity and responsive tests with isolated fixtures. Do not modify production records for testing.
