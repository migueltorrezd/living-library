# Export and register an edition

Run commands from the repository root. The file tools use a separate headless Blender process and never save the input master. MCP is optional for export, useful for interactive authoring.

## Check an editable source

```sh
blender --background --factory-startup --python-exit-code 1 \
  --python blender/tools/inspect_book.py -- blender/books/naval.blend
```

Use the absolute Blender executable if it is not on PATH. In PowerShell prefix a quoted executable with `&` and enter commands on one line.

The source must have one scene and one root carrying its slug, complete case parts, packed images and no workstation references or embedded scripts. To check all included books and dimensions:

```sh
npm run verify:blender
```

This is a structural check, not a visual or physics verdict.

## Export a GLB

```sh
blender --background --factory-startup --python-exit-code 1 \
  --python blender/tools/export_book.py -- \
  --input blender/books/naval.blend --slug naval --output .tmp/naval.glb
```

The exporter finds the active scene's matching root, centers it, keeps calibrated scale and excludes superseded surfaces/collision proxies. It exports selected hierarchy, materials, UVs and custom properties. It refuses to overwrite an existing GLB.

For a new book, use the newly authored working .blend and its unique slug. A template's original slug must be changed on the root as well as in metadata.

## Package the web variants

Copy a comparable record from `blender/specs/` and update its fields for the actual new geometry. This is a model input record, separate from `examples/book-research.json`.

```sh
npm run pack:book -- \
  --input .tmp/naval.glb \
  --spec blender/specs/naval.json \
  --out .tmp/naval-web
```

The output directory must not exist. It contains:

- `public/models/optimized/<slug>.gltf`: full-resolution detail.
- `<slug>-library.gltf`: same visible geometry, smaller travel textures.
- `<slug>-shelf.gltf`: closed-book variant with hidden interiors removed.
- `shared/`: content-addressed images and buffers plus image provenance sidecars.
- `model-record.json`: URLs and new asset hashes.
- `verification.json`: decoded geometry and texture-encoding checks.

Geometry is meshopt-compressed without simplifying, quantizing or welding the input attributes. The tool reads its own output and compares every retained attribute and triangle winding. Smaller library/shelf textures are deliberately mip-sized; encoding after that resize is lossless. Detail retains original pixel dimensions. Library/detail geometry and material names must stay compatible because the app promotes print textures after arrival.

This packaging tool can encode a freshly exported Blender image differently from an earlier exporter version, so a regenerated file need not have the same hash as the shipped runtime. Review appearance after every source/export change.

## Install the reviewed edition

Keep the current library intact until the staged source and rendered model are ready. Copy the staged optimized files into the matching `public/models/optimized/` locations. Preserve existing shared files used by other books.

Update these records together:

| File | Required change |
| --- | --- |
| `src/lib/books.ts` | slug, title, author, description, cloth/foil/ink, thickness; insert in cover-area order |
| `src/lib/model-manifest.json` | insert/replace the staged model-record, with physical/design dimensions and hashes |
| `src/lib/book-editorial.ts` | original summary, factual biography, source link, optional supported praise/resources |
| `src/lib/book-palettes.ts` | ground, ink, supporting and rule colours with readable contrast |
| `src/lib/book-buy-links.ts` | exact-edition purchase/free-reading destinations |
| `COLLECTION.json` | edition identity, dimensions, evidence/uncertainty, source URLs, original model hash |
| `blender/books/<slug>.blend` | portable final editable source |
| `blender/specs/<slug>.json` | corresponding model record for future exports |

Add the cover thumbnail under `public/covers/` and point the manifest's `cover` to it. The remaining source image must stay unaltered or have a documented derivative. Do not assume `thickness` or body `depth` equals the complete exterior case depth.

For a reading edition, update `src/lib/reading.ts` and the appropriate fixed source/data route. Keep remote proxy origins explicit; never create a general user-supplied URL proxy. Retain source notices. Add a new progress version if pagination/text changes.

Run `npm run refresh:manifest` after intentional file changes, then:

```sh
npm run verify:assets
npm run lint
npm run build
npm start
```

Review the real shelf, close-up, pages and return animation at several angles and mobile widths. Keep all existing books working, including direct URLs and history navigation. Commit the source, optimized assets, matching metadata and relevant evidence together.
