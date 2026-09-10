# Deployment

## Standalone Next.js server

The default package serves the shelf at `/` and book routes at `/books/[slug]`. Run `npm ci`, `npm run verify:assets`, `npm run build` and `npm start`. Use Node 22 or 24. Vercel can build this directory as a normal Next.js project with no database or secret variables.

For a subpath installation, set `NEXT_PUBLIC_LIBRARY_BASE_PATH=/library` before building. It is compiled into routing, model URLs and worker URLs. Changing it requires another build. Next.js prefixes internal links; `library-config.ts` prefixes raw asset and history URLs.

`src/lib/library-settings.json` can set a normal return link to a parent site. `navalPdfUrl` is normally empty, using the included fixed-origin API route. If a host serves the app as static files, set it to the host's equivalent endpoint before export. Do not turn the endpoint into an arbitrary URL proxy.

## Static website integration

A static export must omit the request-dependent PDF API route and use an equivalent endpoint on the host. The compiled app can then be served under its base path as a separate document. The host must map shelf and valid book URLs to their generated HTML, preserve the base path for assets and return 404 for unknown slugs.

Keep the library's generated `_next` directory beneath the library path, separate from the host's Next.js assets. Do not mount the full portfolio shell around the library or inject its CSS globally. A document navigation into the library releases the portfolio's WebGL scene and preserves the intended change in atmosphere.

## Cache and rollback

Use `public, max-age=31536000, immutable` for content-addressed files under `models/optimized/shared/` and hashed JavaScript chunks. Do not give unversioned HTML that policy. Publish HTML and its resources together. Roll back the whole release, including its assets, rather than only the JavaScript.

After deployment, check `/`, a direct book link, an unknown slug, model/worker responses, mobile entry, Read mode, browser back and the return link. Keep the prior immutable release until those checks pass. No deployment is performed by `npm run build`.

References: [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports) and [basePath](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath).
