# Release verification

Checks recorded on 10 September 2026 for this standalone public package.

| Area | Evidence |
| --- | --- |
| Local installation | Clean `npm ci` on Node.js 24.14.0; dependency audit reported no known vulnerabilities at install time |
| Application | Production build generated the shelf and all 13 book routes; ESLint completed without warnings |
| Asset graph | 13 selected books, 39 runtime variants, referenced resources, source files and package hashes checked by `npm run verify:assets` |
| Blender portability | All 13 .blend files opened separately in Blender 5.2.1 LTS; one scene/book, packed images, no embedded scripts or workstation references |
| Physical bounds | Exterior cases checked against the selected catalogue within 0.6 mm tolerance; research estimates remain identified in COLLECTION.json |
| Authoring round trip | Naval .blend exported to GLB, then all three web variants; retained vertex attributes, topology and texture encoding verified by the packager |
| Research | Live Open Library ISBN 9780141395869 returned Meditations; original response retained during local verification |
| Asset acquisition | Live Naval image downloaded with URL/rights/hash sidecar; attempted overwrite was rejected |
| Desktop | 1440 × 960 browser viewport: loaded shelf, selected Naval through sidebar, arrived at book view without horizontal overflow |
| Mobile | 390 × 844 emulation: direct Naval route, loaded book, correct viewport width, Read mode with the complete 242-page official PDF |
| Routing | Known book returned HTTP 200; unknown book returned 404; fixed Naval endpoint returned a valid PDF range with HTTP 206 |

The [desktop capture](images/library-desktop.png) and [mobile capture](images/library-mobile.png) are real app screenshots from this verification.

`.github/workflows/check.yml` repeats dependency installation, asset verification, lint and production build on Linux for pushes and pull requests.

## Practical limits

Windows/Linux Blender installation and physical mobile-device performance were not tested locally. Browser emulation verifies layout and interaction, not device GPU speed. Remote research and reading sources can time out, change or become unavailable. Open Library and one large publisher image initially timed out; the ISBN retry and an alternate original image source succeeded.

The included Blender files are finished editable models, not the complete history of every discarded experiment. Their preview lights are separate from the web studio. Some edition sides and material finishes are reconstructions, and some measurements are estimates, as recorded in the catalogue. Packaging/structural checks do not prove collision-free behaviour at every possible angle or certify a newly authored book's visual quality.
