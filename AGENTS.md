# Working on Living Library

Read `docs/authoring/agent-workflow.md` before authoring books and `docs/authoring/blender-setup.md` before changing Blender or MCP configuration. Runtime architecture and interactions are documented in `docs/standalone/`.

## Start

- Inspect current files and Git changes. Preserve other work and existing books.
- Run `npm ci`, `npm run doctor`, `npm run verify:assets`, then `npm run dev`.
- Use Node.js 22 or 24 and pinned dependencies. No external AI service is required for the app.
- Work in `.tmp/<task>/`. Keep final models, source records and relevant verification evidence. Do not commit caches, credentials or workstation paths.

## Blender and research

- Use a separate working copy. Inspect the live Blender scene through MCP before editing; never erase an existing scene or restart the user's session for convenience.
- Confirm edition by ISBN, language, format and photographs. Publisher/author sources come first. Width, height and spine depth are distinct. Identify estimates and package dimensions.
- Keep source URLs, original pixel dimensions, hashes and rights notes. Missing spine/back artwork remains a stated reconstruction. Do not invent publisher marks or realistic-looking unreadable lettering.
- Use original cover pixels. Separate printing from paper/cloth UVs and normal/roughness maps. Do not silently use paid generation, subscriptions or scraped paid book text.
- Preserve named hinges, leaves and ribbons. Geometry is authored in decimetres under a calibrated root; glTF exports in metres. Consult the runtime before changing hierarchy or topology.
- MCP executes code locally. Bind to loopback, disable telemetry in both server and add-on, preserve client configuration and never expose it to the internet.

## Completion

- Stage exports with `blender/tools/export_book.py` and `scripts/pack-book.mjs`. They do not install automatically.
- Register every record described in `docs/authoring/export-and-register.md` and update hashes. Order the collection by cover area.
- Verify actual desktop/mobile rendering: loading, pickup, full rotation, texture promotion, opening, both pages, page turns, ribbon settling, shelf return and last-book clearance. Check reduced motion and keyboard operation.
- Run `npm run verify:assets`, `npm run lint`, `npm run build`; use `npm run verify:blender` when changing sources.
- State what was tested and what remains uncertain. Local success is not a deployment. Do not claim universally collision-free physics from a static image or numerical check.
