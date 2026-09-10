# Performance

The library is an asset-heavy experience. Its browser work should remain isolated from the rest of a host website.

- Enter through a normal link. Do not preload its models, PDF worker or Three.js on unrelated pages.
- Use one persistent canvas and model instances. Opening a book should not create a second rendering context.
- Decode shared images once. `book-loader.ts` handles concurrent image-bitmap requests and rejects missing images rather than silently accepting bare materials.
- Prepare models against the completed environment. Compile materials and upload textures in bounded batches before reporting readiness.
- Keep high-resolution print promotion after arrival. Anisotropic filtering preserves oblique text without forcing every book's maximum textures into the initial load.
- Cache content-addressed shared resources for a year. Revalidate HTML and model manifests, whose URLs may stay constant between releases.
- Load the PDF library and worker only when reading begins. Keep page caching bounded.
- Respect reduced motion and pause decorative loading motion when the page is hidden.

The original local thirteen-book verification transferred about 41 MB of initial model resources and opened in about 3.7 seconds on a warm local machine with a cold browser cache. That is a historical development measurement, not a mobile-network guarantee. Package measurements belong in the release's QA record; measure each catalogue independently.

For production review, record cold and warm entry at desktop and phone sizes, transfer bytes before and after entry, initial-ready time, long tasks, visible frame cadence while dragging and returning, and memory after several Read mode visits. Check a slow network and a failed model fetch. A successful build alone does not prove performance.
