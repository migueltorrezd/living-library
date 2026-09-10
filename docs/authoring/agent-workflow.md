# Research and author a book

Use this guide with `AGENTS.md`. The included .blend files contain one finished book each, packed textures and a simple studio preview. They preserve current geometry, materials, UVs and hierarchy. Archived revisions and unrelated scenes are excluded. Browser lighting and live page/ribbon mechanics are implemented separately in TypeScript.

## 1. Identify the edition

Start from the user's link, cover image or ISBN. Find the publisher or author's edition page, then corroborate with a reliable bookseller or library record. Match **title, author, language, ISBN, binding, printing and front artwork**. Image search helps discovery but does not establish that a result is the same edition.

```sh
npm run research:book -- --isbn 9780141395869 --out .tmp/new-book/research.json
```

This reads the [Open Library ISBN API](https://openlibrary.org/dev/docs/api/books) into a new research file, preserving its complete returned edition object. Cross-check the publisher: library metadata can be incomplete or incorrect. Physical dimensions and asset rights are deliberately left unset.

Record width, height and spine depth in millimetres, in that order, with sources for each. Distinguish book measurements from slipcase, gift-set or shipping-package dimensions. Label estimated depth. Page count helps estimate paper thickness but cannot establish stock or binding on its own.

Keep an edition research folder with notes, URLs, dates, original images and sidecars. Use `examples/book-research.json` as a checklist. If two plausible editions remain, present the evidence and ask one focused edition question while continuing independent work.

## 2. Find front, spine and back

Search the exact ISBN plus “spine”, “back cover”, “hardcover” or local-language equivalents. Inspect publisher galleries, author websites and bookseller photographs. A side photograph can be more useful than a generic flat front. Do not mix a paperback spine with a different hardcover.

```sh
npm run fetch:asset -- \
  --url 'https://m.media-amazon.com/images/I/61ptYzpPOsL._SL1500_.jpg' \
  --out .tmp/new-book/naval-front.jpg \
  --source 'https://www.navalmanack.com/' \
  --rights 'Publisher cover artwork; no blanket reuse permission'
```

The downloader accepts JPEG, PNG, WebP and PDF, checks file signatures, follows bounded HTTPS redirects, limits transfers to 64 MiB, refuses existing files, and records original/final URLs and SHA-256. It does not decide whether redistribution is permitted.

Inspect assets at native resolution. Prefer a sharp 1500–3000 px source to an enlarged thumbnail. Preserve aspect ratio and colour profile. Do not invent small text through AI enlargement. Keep photographed originals intact; express crop/perspective registration in UVs or a documented derivative. Do not remove watermarks.

If a side cannot be found, mark it as reconstructed and use restrained original typography. Never fabricate publisher marks or call a custom back a scan. `COLLECTION.json` records these qualifications for the supplied models.

## 3. Choose materials and construction

Begin with the nearest construction in `blender/books/`: cloth hardcover (`meditations`), jacketed case (`the-book-of-elon`) or paperback (`origin-of-species`). Save a working copy. Through MCP, inspect root, descendants, modifiers, material slots and UVs.

These are construction references, not universal mock-ups. A new format can require different boards, spine radius, hinge position, paper block and clearances. Do not stretch a finished book and assume its paper/cloth grain remains physically correct. Recalibrate after geometry edits; model metadata must agree with actual geometry.

Meshes use decimetre design coordinates beneath a root calibrated per axis to true metre output. Blender is Z-up, thickness along Y. glTF exports Y-up in metres; the browser scales it by ten. `dimensionsMm` is complete exterior `[width, height, depth]`. Record `width`, `height`, `depth` in design-space units used by the mechanics; body depth can exclude boards. `boardMm` and `paperGapMm` are physical millimetres. Do not replace all these fields with the same measurement.

Preserve the runtime naming contract:

- `FrontHinge…`: front-cover pivot; the cover and its printing move together.
- `TurningLeaf…`: flexible leaf parent. `Curved title leaf…` supplies deformable geometry; `Interior…` identifies printed interior meshes.
- `Ribbon…`: continuous ribbon surface, adapted by the runtime.
- `Printed case…` or `Wrapped printed cover…`, `Back board…`, `Rounded cloth spine…`: exterior case.
- `superseded` and `collision_proxy` objects: excluded from the web export.

Read `useBookMechanics.ts`, `usePrintedPages.ts`, `useRibbonMechanics.ts`, `book-physics.ts` and `ribbon-physics.ts` before changing this contract. Prefixes matter; numeric Blender suffixes are expected.

Separate print UVs from substrate UVs. Artwork keeps its proportions while paper or cloth repeats at a physical scale. Use OpenGL tangent normals, Non-Color data for normal/roughness maps and colour-managed artwork. Gloss/foil masks should follow actual print regions with an explicitly recorded artistic interpretation. Binding relief needs geometry where it changes silhouette/contact. Paper edges need subtle layered variation, not deep grooves or a white slab.

Useful sources are [Poly Haven](https://polyhaven.com/) and [ambientCG](https://ambientcg.com/). Their CC0 book-pattern and Paper001 substrates appear in the supplied examples. Preserve source records even when attribution is optional. Search existing assets before downloading duplicates. Paid generation, subscriptions and third-party models require a budget/rights decision; none is needed by default.

## 4. Export and register

Pack images and inspect with `blender/tools/inspect_book.py`. Keep editable masters separate from web variants. Follow [Export and register](export-and-register.md) for exact commands and required records.

No script automatically turns an ISBN into a verified photorealistic book. Tools cover metadata acquisition, source inspection, export and lossless packaging. The agent handles edition research, geometry/material work and visual comparison.

## 5. Reading and purchase links

Prefer the author's or publisher's purchase page. A matching Amazon edition is acceptable. Link the exact edition with an accurate format label.

Add a complete reading source only when legitimately offered for that use. Verify translation/edition, source notices and applicable public-domain status. A modern cover does not make its translation free. Free-to-read and redistribution permission differ. Never bypass access controls or bundle a purchased ebook.

Text/PDF can print directly onto the 3D sheets. Naval's official free 2020 edition is fetched on demand; the visible hardcover is a later printing. Classical-book excerpts do not imply the modern displayed edition is included. Keep reading version/progress identifiers accurate and omit unsupported Read controls.

## 6. Inspect the real result

Compare front, spine, back, both ends and grazing reflections against references. Review the app at desktop and mobile sizes: initial loading, pickup, arrival/texture promotion, full rotation, hinge contact, both first-spread pages, forward/back turns, bookmark settling, shelf return, neighbour clearance and the last slot. Check reduced motion, keyboard access and failed downloads.

Preserve restrained controls, transparent header, progress rail, generous book scale and per-book palettes. New controls should serve a clear purpose and share existing typography/spacing. Keep development labels out of visitor UI.

Run asset checks, lint and build. Retain representative captures, viewport sizes and reconstruction limits. State local versus published status. A static image or finite physics values cannot establish collision-free motion for every custom model.
