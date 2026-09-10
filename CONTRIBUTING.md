# Contributing

Use Node.js 22 or 24, run `npm ci`, and start with `AGENTS.md`. Keep each change scoped and preserve the collection's interaction, accessibility and performance.

For an edition, include its research sources, rights notes, dimensional qualifications, portable Blender source, optimized assets and all catalogue records. Never present an estimated spine or reconstructed back as a verified publisher scan. Follow the [authoring guide](docs/authoring/agent-workflow.md).

Run `npm run refresh:manifest` after intentional file changes, then `npm run verify:assets`, `npm run lint` and `npm run build`. Source changes also need `npm run verify:blender`. Review desktop/mobile rendering and retain evidence of material or motion changes.

Describe the problem, resulting behaviour, tests and remaining limitations in the pull request. Do not commit credentials, local paths, node_modules, build output or temporary research downloads. Third-party art and texts retain their own rights.
