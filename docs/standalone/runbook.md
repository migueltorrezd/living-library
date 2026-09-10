# Operation and troubleshooting

## Before release

Run asset verification, lint and a production build. Open both a shelf entry and a direct book URL. Test mouse, keyboard, phone framing, first spread, page turning, progress after reload and the last book's return. Test with reduced motion enabled.

## A book never becomes ready

Inspect the failed network request first. A glTF may load while one of its referenced shared files is missing. Check the complete resource graph with `npm run verify:assets`. Version hashes must match the installed model bytes. The global entrance offers retry and text-only reading after a failure or a long wait.

## White or untextured material

Check image decoding, UV channels and the material names used for detail promotion. Do not hide a failed texture by marking the model ready. An incomplete environment capture can also make first-load reflections differ from subsequent views.

## Missing first page or PDF

Verify the configured fixed-origin PDF route, its content type and byte-range response. Check that the worker comes from the same installed `pdfjs-dist` version. The first left/right spread should be committed atomically. Clear only the affected browser reading key when diagnosing a source-version mismatch; do not clear unrelated local storage.

## A book clips or a bookmark becomes unstable

Check physical scale, mesh names, hinge origin, pinned ribbon points and page winding before changing camera padding. Test rapid reversals and long frames, not just a resting screenshot. A new model can violate assumptions even when older books passed.

## Editing generated packages

The package is independent and can be edited normally. The author's exporter records checksums and refuses to overwrite a file that was independently edited since export. Keep local changes in version control before refreshing from an upstream engine. Do not replace a working catalogue with a copied development folder or broad asset directory.
