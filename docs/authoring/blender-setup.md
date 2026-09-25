# Blender and Blender MCP

Blender is needed to author books, not to view the library. The checked authoring environment for this release was **Blender 5.2.1 LTS on macOS** with the official [Blender Lab MCP server](https://www.blender.org/lab/mcp-server/) **1.0.3** (add-on and server). Installation guidance for other systems is included below; those systems have not been exercised for this release.

## Install Blender

Check `blender --version` first. The MCP add-on needs **Blender 5.1 or newer**. On macOS the executable can be `/Applications/Blender.app/Contents/MacOS/Blender`. Preserve a working installation and its preferences.

- **macOS:** get the Intel or Apple Silicon installer from [Blender's official download page](https://www.blender.org/download/), mount it and move Blender to Applications. Homebrew users can use `brew install --cask blender` if it is not installed.
- **Windows:** use the official installer or portable ZIP. For the portable edition, extract it to a stable folder and locate `blender.exe`.
- **Linux:** extract Blender's official Linux archive and use its executable. Distribution package versions may differ from the tested version.

Run Blender once and finish its initial setup. A GUI session is required for the live MCP bridge. Headless `--background` processes can run the supplied file inspection/export scripts and the server's `*_for_cli` tools, but not the live bridge.

`npm run doctor` reports the detected executable. Set `BLENDER_PATH` for a nonstandard location. In PowerShell use `$env:BLENDER_PATH = 'C:\path\to\blender.exe'`; in a POSIX shell use `export BLENDER_PATH='/path/to/blender'`. The verification tool and the MCP server's background tools both read it.

## Install the add-on

1. In Blender, open **Preferences > System** and turn on **Allow Online Access**. The add-on refuses to start without it, even though it only listens on your own machine.
2. Install the **MCP** add-on (maintainer: Blender Lab) using one of these routes:
   - Drag the install link from [blender.org/lab/mcp-server](https://www.blender.org/lab/mcp-server/) into the Blender window twice: the first drop adds the `lab.blender.org` extension repository, the second installs the add-on. This route gives update notifications.
   - Or download `mcp-1.0.3.zip` from the [project releases](https://projects.blender.org/lab/blender_mcp/releases) and use **Preferences > Get Extensions > Install from Disk**. Use this when the repository route reports that remote data is unavailable.
3. In **Preferences > Add-ons > MCP**, keep host `127.0.0.1` and port `9876`, turn on auto-start, then press **Start MCP Bridge Server**. Save preferences.

Only one add-on can listen on port 9876. If an older MCP add-on is installed (for example the community "MCP for Blender" add-on), disable it first.

## Install uv and connect your agent

Install [uv using its official instructions](https://docs.astral.sh/uv/getting-started/installation/). On macOS, `brew install uv` is sufficient. Verify `uvx --version`, then warm the pinned server once so the first agent connection does not time out while it downloads:

```sh
uvx --from "git+https://projects.blender.org/lab/blender_mcp.git@v1.0.3#subdirectory=mcp" blender-mcp --help
```

For Codex:

```sh
codex mcp add blender \
  --env BLENDER_MCP_HOST=127.0.0.1 \
  --env BLENDER_MCP_PORT=9876 \
  -- uvx --from "git+https://projects.blender.org/lab/blender_mcp.git@v1.0.3#subdirectory=mcp" blender-mcp
```

For Claude Code:

```sh
claude mcp add blender -s user \
  -e BLENDER_MCP_HOST=127.0.0.1 \
  -e BLENDER_MCP_PORT=9876 \
  -- uvx --from "git+https://projects.blender.org/lab/blender_mcp.git@v1.0.3#subdirectory=mcp" blender-mcp
```

Backslashes above are POSIX line continuations. In PowerShell enter each command on one line. Inspect any existing `blender` entry before changing it. Add `BLENDER_PATH` to the environment if Blender is not on `PATH` and you want the background (`*_for_cli`) tools.

Claude Desktop users can instead add the official **Blender** connector (Settings > Connectors) or install the `.mcpb` bundle from the project releases.

For a client using an `mcpServers` JSON object, merge [the example configuration](../../examples/mcp/blender.json) into its existing configuration. Do not replace the whole file. GUI clients may need the absolute path to `uvx`: find it with `command -v uvx` on macOS/Linux or `where.exe uvx` on Windows.

Start a fresh agent session if tools are not discovered. Keep one client responsible for editing the scene.

## Prove the connection

Ask the agent:

> Use Blender MCP to read the current file and scene. Report the file path, whether it has unsaved changes, and the object count. Do not create, delete, save or move anything.

Successful `get_blendfile_summary_path_info` and `get_objects_summary` responses prove the connection. A configured server entry alone does not. Then have the agent open a **copy** of `blender/books/naval.blend`, inspect the root with `slug == "naval"`, its descendants and packed images. Object names can have numeric Blender suffixes.

The server also bundles the Blender Python API reference and user manual (`search_api_docs`, `get_python_api_docs`, `search_manual_docs`). Agents should look up API names there instead of guessing.

`execute_blender_code` runs Blender Python without real guards; the add-on's sandbox is not a security boundary. Keep the bridge on loopback and use trusted scripts. No paid generation provider is needed.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Add-on reports online access must be enabled | Preferences > System > Allow Online Access, then Start MCP Bridge Server |
| Connection refused on 9876 | GUI Blender open, MCP add-on enabled, bridge server started |
| Bridge fails to bind 9876 | Another add-on (such as an older MCP add-on) already uses the port; disable it |
| Extension "not found in the remote repository" | Install `mcp-1.0.3.zip` from disk instead |
| Cannot spawn uvx | Absolute executable path in client configuration |
| First connection times out | Run the warm-up `uvx ... --help` command, then reconnect |
| Tools absent after configuration | Fresh agent session/client reload, preserving unsaved work |
| Headless bridge refuses to start | Use GUI Blender for the live bridge; headless only for file tools |
| Pink/missing materials | Open a packed source; pack all textures for new work |

An agent can perform installation when requested as part of setup. Preserve existing client settings and report any remaining client-side restart that requires the user.
