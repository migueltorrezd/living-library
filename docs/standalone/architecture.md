# Architecture

The HTML document owns layout and input. A single fixed, pointer-transparent React Three Fiber canvas paints the books at positions measured from that document. Real links, headings, lists and buttons remain available to keyboards, assistive technology and the text-only fallback.

## Runtime map

| File | Responsibility |
| --- | --- |
| `LibraryExperience.tsx` | Shelf, continuous editorial sequence, URL/history, measured rows and interaction targets |
| `LibraryScene.tsx` | Persistent models, camera projection, pickup/return choreography and staged texture promotion |
| `BlenderBook.tsx` | Versioned asset URLs, cloned model instances, shared decoded images and material setup |
| `BookLighting.tsx` | Memoized reflected studio and directional lights |
| `LibraryEntrance.tsx` | Global entrance, actual readiness, reduced motion and failed-download recovery |
| `useBookMechanics.ts` / `book-physics.ts` | Cover hinge, flexible leaf and supported contact |
| `useRibbonMechanics.ts` / `ribbon-physics.ts` | Continuous ribbon deformation and book contact |
| `usePrintedPages.ts` / `printed-pages.ts` | Logical pages, PDF rasterization, atomic spreads and print texture cache |
| `ReadMode.tsx` | Same-object reading view, page controls, magnification and progress |
| `useLibrary.ts` | Reactive phase and book state, plus non-reactive per-frame motion |

## One object across views

The states are shelf, preparing, entering, reading, closing and leaving. A clicked book is pulled forward before turning. Neighbours move clear in groups. On return the book aligns in front of the slot, slides in, then the surrounding stack settles. The active model stays mounted; higher-resolution print textures replace matching materials after arrival.

Pickup lasts 0.9 seconds and return 2.8 seconds. Quintic easing gives zero endpoint velocity and acceleration. Editorial text appears after arrival. Reduced motion uses the endpoints without the travel sequence. Native document scroll moves between complete book sections rather than remounting a page-sized carousel.

The renderer uses model dimensions in decimetres after applying a scale of ten to glTF's metre coordinates. Screen-to-world placement depends on the camera and measured DOM rectangles. Padding-aware projected corners bound the shelf and travel width. This is a framing constraint, not a guarantee against every possible custom-model intersection.

## URLs and installation paths

Next.js serves `/` and `/books/[slug]`. Every listed slug has a generated route. Selection also updates browser history without remounting the whole scene. `library-config.ts` normalizes an optional build-time base path for history, model files, reading JSON and the PDF worker.

Branding is data. The reusable engine contains no website account, credentials or authentication. A return link can leave a hosted installation through a normal document navigation, releasing its rendering context.
