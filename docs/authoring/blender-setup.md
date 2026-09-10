# Blender and Blender MCP

Blender is needed to author books, not to view the library. The checked authoring environment for this release was **Blender 5.2.1 LTS on macOS**, with **blender-mcp 1.9.1** using Python 3.11. Installation guidance for other systems is included below; those systems have not been exercised for this release.

## Install Blender

Check `blender --version` first. On macOS the executable can be `/Applications/Blender.app/Contents/MacOS/Blender`. Preserve a working installation and its preferences.

- **macOS:** get the Intel or Apple Silicon installer from [Blender's official download page](https://www.blender.org/download/), mount it and move Blender to Applications. Homebrew users can use `brew install --cask blender` if it is not installed.
- **Windows:** use the official installer or portable ZIP. For the portable edition, extract it to a stable folder and locate `blender.exe`.
- **Linux:** extract Blender's official Linux archive and use its executable. Distribution package versions may differ from the tested version.

Run Blender once and finish its initial setup. A GUI session is required for the MCP add-on's event loop. Headless `--background` processes can run the supplied file inspection/export scripts, but cannot serve this MCP add-on.

`npm run doctor` reports the detected executable. Set `BLENDER_PATH` for a nonstandard location. In PowerShell use `$env:BLENDER_PATH = 'C:\path\to\blender.exe'`; in a POSIX shell use `export BLENDER_PATH='/path/to/blender'`. This variable is used by the verification tool, not by Blender itself.

## Install uv and the add-on

Install [uv using its official instructions](https://docs.astral.sh/uv/getting-started/installation/). On macOS, `brew install uv` is sufficient. Verify `uv --version` and `uvx --version`, then:

```sh
uvx --python 3.11 blender-mcp==1.9.1 install-addon
```

This installs the package's bundled add-on. For a nonstandard Blender installation, inspect `install-addon --help` and use `--addons-dir` to select the correct version's add-ons folder. Preserve any customized existing add-on.

In Blender Preferences, enable **Interface: MCP for Blender**, expand its preferences and disable telemetry consent. Save preferences. Open the viewport sidebar with `N`, locate **MCP for Blender**, and start its server. Some builds call the button “Connect to Claude”; the connection also works with other MCP clients. Refer to [the upstream project](https://github.com/ahujasid/blender-mcp) if labels change.

## Connect your agent

For Codex, the locally checked CLI syntax is:

```sh
codex mcp add blender \
  --env BLENDER_HOST=127.0.0.1 \
  --env BLENDER_PORT=9876 \
  --env BLENDER_MCP_DISABLE_TELEMETRY=1 \
  -- uvx --python 3.11 blender-mcp==1.9.1
```

Backslashes above are POSIX line continuations. In PowerShell enter it on one line. Inspect any existing `blender` entry before changing it.

For a client using an `mcpServers` JSON object, merge [the example configuration](../../examples/mcp/blender.json) into its existing configuration. Do not replace the whole file. GUI clients may need the absolute path to `uvx`: find it with `command -v uvx` on macOS/Linux or `where.exe uvx` on Windows.

Start a fresh agent session if tools are not discovered. Keep one client responsible for editing the scene. Server-side telemetry and the add-on telemetry checkbox are separate settings; disable both.

## Prove the connection

Ask the agent:

> Use Blender MCP to read the current scene. Report its name and object count. Do not create, delete, save or move anything.

A successful `get_scene_info` response proves the connection. A configured server entry alone does not. Then have the agent open a **copy** of `blender/books/naval.blend`, inspect the root with `slug == "naval"`, its descendants and packed images. Object names can have numeric Blender suffixes.

MCP can execute Blender Python. Keep its socket on loopback and use trusted scripts. If your installed version offers a safe mode blocking file access, leave it enabled unless you intentionally need the file-based authoring workflow. Do not silently disable it to bypass a failed action. No paid generation provider is needed.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Cannot spawn uvx | Absolute executable path in client configuration |
| Connection refused on 9876 | GUI Blender open, matching add-on enabled, sidebar server started |
| Tools absent after configuration | Fresh agent session/client reload, preserving unsaved work |
| Python dependency conflict | Keep the explicit Python 3.11 and MCP version pins |
| Headless server refuses to start | Use GUI Blender for MCP; headless only for file tools |
| Pink/missing materials | Open a packed source; pack all textures for new work |

An agent can perform installation when requested as part of setup. Preserve existing client settings and report any remaining client-side restart that requires the user.
