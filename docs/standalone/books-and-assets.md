# Books and assets

`COLLECTION.json` records each included title, author, edition, physical size, research source and original model hash. `src/lib/model-manifest.json` is the runtime index.

Each book has detail, library and shelf glTF variants. Referenced buffers and images live in `public/models/optimized/shared/` with content-addressed filenames. The library variant preserves visible geometry; detail promotion changes printing textures after arrival. The closed shelf variant remains available but the persistent scene mounts the library variant.

Editable sources are in `blender/books/<slug>.blend`, one scene/book per file. Textures are packed. These are extracted from the original Blender masters, preserving current geometry, materials, UVs and named hierarchy. Archived experiments and unrelated scenes are excluded. A simple source-preview studio is included; the browser's actual lighting lives in `BookLighting.tsx`. Live page and ribbon physics are TypeScript, not baked Blender animation.

The original modeling coordinates are decimetres beneath calibrated root transforms; glTF output is in metres and the browser displays it at scale ten. Inspect the source record in `blender/specs/` before changing dimensions.

`package-manifest.json` hashes the distributable files, including editable sources. Run `npm run refresh:manifest` after intentional changes, then `npm run verify:assets`. Use `npm run verify:blender` for Blender file portability and physical case bounds.

For a new edition, follow [the authoring workflow](../authoring/agent-workflow.md) and [export/registration guide](../authoring/export-and-register.md).

## Reconstruction limits

Some backs, spines, small marks and manufacturing details are reconstructed from incomplete references. Source resolution limits extreme close-ups. Some dimensions are estimates, or refer to a specific printing or book inside a larger anniversary package. The collection notes preserve those distinctions. These are visual reconstructions, not manufacturing specifications or publisher-endorsed digital editions.
