# Maintaining this standalone library

This repository is independent of the author's personal website and source workspace. It includes the selected public collection and can be installed, edited and deployed on its own.

Use a branch for a new edition. Keep the current library intact while researching and authoring under `.tmp/<task>/`. The [export guide](../authoring/export-and-register.md) describes installing a staged edition and updating every related catalogue record.

Keep editable sources, runtime variants, source references and version hashes together. Do not delete shared model resources simply because one book no longer uses them; other books may still reference the same hash.

After intentional changes run `npm run refresh:manifest`, `npm run verify:assets`, `npm run lint` and `npm run build`. Check actual desktop/mobile behaviour before publishing. For hosting under a path prefix, follow [deployment](deployment.md).
