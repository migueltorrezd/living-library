# Binding, pages and ribbons

The browser runs a reduced-order simulation designed for a small, convincing interactive book. It does not simulate hundreds of sheets independently.

## Covers and pages

`BookHinge` models cover motion and damping. `PaperDynamics` uses forty length-constrained segments and twelve rendered rows, stepped at up to 240 Hz. Its binding support and cover contact keep the page connected to the gutter and seated over the board. The cover closes only after the moving sheet has returned to rest. Very thin paperbacks and cloth hardcovers use different clearances.

The live sheet and supported left/right print surfaces retain their own winding, UVs and offsets. A first spread is published only after both sides have usable print, preventing a blank initial left page. Four print textures and a bounded eight-page cache limit memory use.

## Bookmarks

A ribbon has a hidden pinned attachment and a fully deformable exposed length. Seventy-five particles form 24 longitudinal spans across three rails. The visible continuous mesh interpolates 72 spans, producing 365 vertices. Contact constraints use the moving book, damping absorbs abrupt gestures and the solver can settle at rest. The attachment is fixed; the remainder is not a rigid tail with only an animated tip.

Custom models must preserve the expected ribbon topology or adapt the importer. Pinning, stretch, tunnelling during rapid reversals and contact on the final shelf pose need explicit checks.

## Reading sources

`reading.ts` lists the editions that support complete in-book reading. Text sources contain ordered heading and paragraph blocks; pagination preserves every word. PDF sources retain their original page composition and illustrations. The Naval source is the author's complete 2020 PDF, which differs from the later physical hardcover represented by the model.

Read mode frames the actual pages: a spread at 700px and wider, or one page at smaller widths. Magnification ranges from 100 to 250 percent. Arrow keys turn pages, Shift plus arrow keys pan a magnified view, Home fits the book and Escape restores focus to its entry control. Progress is stored locally under a slug and source-version key. Changing the order of books does not change that key.

An available web page or email-gated ebook is not automatically a complete embedded reading source. The external links retain signup and format labels. No account registration or paid service is invoked by the reader. The fixed-origin Naval proxy supports byte ranges and never accepts an arbitrary remote URL.
