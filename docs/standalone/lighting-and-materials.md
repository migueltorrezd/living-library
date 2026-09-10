# Lighting and materials

The book's relief is a combination of geometry, material maps and reflected studio light. Increasing a normal map alone cannot repair an incorrectly shaped hinge or page block.

`BookLighting.tsx` owns the studio. Three rectangular reflectors provide a warm vertical key, a cool side reflection and an overhead edge. The current positions are (-4, 3, 5), (5, 1, 3) and (0, 6, -2), with intensities 4.5, 1.4 and 2.5. A 512px environment captures this setup during preparation. Ambient intensity is 0.12, warm directional key 2.1 and cool fill 0.65.

The shelf rotates that reflected studio to (-0.65, 0.75, 0.25), with intensity 1.1. Editorial presentation returns it to zero rotation and intensity 1. The studio settles during the first 30 percent of extraction, before the book begins turning. This avoids moving a strong highlight and the case corner at the same instant.

Books do not cast shadows onto their neighbours in the picker or return phase. Editorial and opening views use cast shadows. Fine paper cuts receive shadows but do not cast individually sampled dark stripes. Lighting belongs to the persistent scene; it is not reset by remounting a second detail canvas.

Printing uses colour, roughness/metalness, normal and optional varnish maps. Cloth fibres and coated paper have different roughness and relief. Photographed spine UVs use a separate stock coordinate set so a perspective correction does not stretch the fabric texture. Cut-paper maps have directional, irregular layers. Board overhang, hinge channel, soft edges and the recessed text block remain actual geometry.

The per-book UI palette is an authored background/ink pairing derived from its cover, not an average-colour extraction. Change the supporting text and rule colours with the pair, then verify contrast. The optional `portfolio` loading theme only alters the entrance's charcoal field and muted orange/blue miniatures; it does not recolour the books or editorial fields.
