# Lighting and materials

The book's relief is a combination of geometry, material maps and reflected studio light. Increasing a normal map alone cannot repair an incorrectly shaped hinge or page block.

`BookLighting.tsx` owns the studio, with reflector values in `src/lib/book-studio.json`. Three feathered rectangular softboxes (smoothstep falloff over the outer 30 percent) provide a warm vertical key, a cool side reflection and an overhead edge. The current positions are (-4, 3, 5), (5, 1, 3) and (0, 6, -2), with intensities 4.5, 1.4 and 2.5. A 512px environment captures this setup during preparation. Ambient intensity is 0.12, warm directional key 2.1, cool fill 0.65 and a warm bounce of 0.65 from below at (-1, -6, 3). The bounce stands in for a pale surface under the book: page edges and board undersides read as paper rather than as dark slabs. The renderer uses Khronos PBR Neutral tone mapping, which keeps printed cover colours; ACES Filmic had shifted saturated reds and oranges and greyed white cases.

The shelf rotates that reflected studio to (-0.65, 0.75, 0.25), with intensity 1.1. Editorial presentation returns it to zero rotation and intensity 1. The studio settles during the first 30 percent of extraction, before the book begins turning. This avoids moving a strong highlight and the case corner at the same instant.

Books do not cast shadows onto their neighbours in the picker or return phase, and only the active book casts at any time. Editorial and opening views use cast shadows. Fine paper cuts receive shadows but do not cast individually sampled dark stripes. Lighting belongs to the persistent scene; it is not reset by remounting a second detail canvas.

Printing uses colour, roughness/metalness, normal and optional varnish maps. Cloth fibres and coated paper have different roughness and relief. Photographed spine UVs use a separate stock coordinate set so a perspective correction does not stretch the fabric texture. Cut-paper maps have directional, irregular layers. Board overhang, hinge channel, soft edges and the recessed text block remain actual geometry.

The per-book UI palette is an authored background/ink pairing derived from its cover, not an average-colour extraction. Change the supporting text and rule colours with the pair, then verify contrast. The optional `portfolio` loading theme only alters the entrance's charcoal field and muted orange/blue miniatures; it does not recolour the books or editorial fields.

## Surface pass (2026-10-05)

Two Blender-authored layers are added when a model loads (`src/lib/book-surface.ts`), configured in `src/lib/book-substrates.json`:

- **Substrate relief.** Seamless 1024 px normal tiles for satin paper, uncoated paper, soft-touch laminate and plain-weave cloth, baked from periodic procedural nodes (`blender/tools/substrate_bake.py`, normals from `substrate_maps.py`). They repeat on the physically scaled TEXCOORD_0 (one unit is about 120 mm on every model), so grain has the same physical size on every edition, and apply to the front print, case material and back artwork. Mip averaging flattens distant grain; the clearcoat keeps its smooth normal. Strength is per edition. In this collection the five editions shared with the maintained library (Naval, The Book of Elon, How to Fail, Le Petit Prince, Cien años de soledad) use the substrate layer; the eight classics keep the grain baked into their own finish maps.
- **Contact occlusion.** Closed-book Cycles ambient occlusion (6 mm reach) is baked per vertex into a custom `_OCCLUSION` attribute on the case, spine, page block and endbands (`blender/tools/ao_bake.py`, written back by `inject_ao.py`). It darkens indirect light like an aoMap, plus a share of direct diffuse (`power` 2.0, `direct` 0.55), so the joint groove, the recess under the boards and the page block beside the spine keep their depth. Printed decals and the moving ribbon do not occlude. The bake describes the closed book; opening the cover does not update it.

For the five shared editions, front relief maps that held only tiled paper noise were removed; Le Petit Prince keeps its registered relief, cleaned, with a 0.15 mm foil deboss.

## Adding occlusion to a new book

1. Export the GLB as described in [export and register](../authoring/export-and-register.md).
2. In Blender (MCP or the Python console), run `blender/tools/ao_bake.py` with `SLUG`, `SRC_FOR={SLUG: '<path to the .glb>'}` and `OUT='.tmp/ao'` defined, from the repository root.
3. `python blender/tools/inject_ao.py <folder with the .glb> .tmp/ao <slug>` writes `_OCCLUSION` into the GLB, keeping every other attribute and image byte-identical.
4. Package with `npm run pack:book`; the attribute survives packing.

Optional substrate relief for a new edition: add its slug to `src/lib/book-substrates.json` with a family (`satin-paper`, `uncoated`, `soft-touch` or `cloth`) and a strength. The tiles are rebuilt by `blender/tools/substrate_bake.py` and `substrate_maps.py` (Python with numpy and Pillow).
