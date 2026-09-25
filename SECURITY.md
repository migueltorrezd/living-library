# Security

Do not put credentials or private material in a public issue. For a sensitive report, use GitHub's private vulnerability reporting if enabled, or the contact destination on the repository owner's public profile.

The web app runs without AI credentials. Optional Blender MCP (the official Blender Lab server and add-on) executes local code and must remain on loopback. Preserve existing client settings. The add-on requires Blender's Allow Online Access preference but only listens on your own machine. Inspect downloaded scripts and do not enable automatic execution in arbitrary Blender files.

Reading endpoints use fixed upstream sources. Do not turn them into an unrestricted URL proxy. Asset research tools download files into explicit local destinations and do not authorize redistribution or payment.
