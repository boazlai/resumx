# Telemetry

Resumx collects anonymous usage data to understand where users get stuck and improve the tool. Telemetry is enabled by default and can be disabled at any time.

## How to opt out

Set the environment variable before running any command:

::: code-group

```bash [macOS / Linux]
export RESUMX_TELEMETRY=0
```

```powershell [Windows (PowerShell)]
$env:RESUMX_TELEMETRY = "0"
```

:::

To make it permanent, add the export to `~/.bashrc` or `~/.zshrc`. On Windows, run `setx RESUMX_TELEMETRY 0` in an admin terminal.

The [`DO_NOT_TRACK=1`](https://consoledonottrack.com/) standard is also respected.

## What we collect

| Event                | Properties                                                             | Purpose                                    |
| -------------------- | ---------------------------------------------------------------------- | ------------------------------------------ |
| `cli_render_success` | Output formats, duration, view count, Resumx version, OS, Node version | Understand usage patterns and performance  |
| `cli_render_failure` | Error class, Resumx version, OS, Node version                          | Find and fix the most common failure modes |

## What we never collect

- Resume content
- File paths
- Command arguments
- Environment variables
- Any personally identifiable information

All telemetry code is open source. You can audit the implementation in [`src/lib/telemetry/`](https://github.com/resumx/resumx/tree/main/src/lib/telemetry).
