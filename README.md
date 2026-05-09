# Lightweight SVG Previewer

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/ryonak.lightweight-svg-previewer?label=Marketplace)](https://marketplace.visualstudio.com/items?itemName=ryonak.lightweight-svg-previewer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-node%3Atest-43853d)](#development)

A no-frills VS Code extension that opens `*.svg` files as text and shows a
**live, side-by-side preview** in a webview. Zero runtime dependencies, strict
CSP, fast on 1 MB+ SVGs.

> Edit your SVG. Watch it render. That's the whole product.

---

## ✨ Features

- 📝 **Text-first editing.** Sets `workbench.editorAssociations` so `*.svg`
  opens in the default text editor (instead of VS Code's built-in image
  preview).
- ⚡ **Live preview, side-by-side.** Toggle a webview in
  `ViewColumn.Beside` with <kbd>Ctrl</kbd>+<kbd>K</kbd> <kbd>V</kbd>
  (or set `autoOpen: true` to open it whenever an SVG is opened). Edits are
  reflected in real time with a configurable debounce (default 150 ms —
  comfortably under a 200 ms target).
- 🪶 **Lightweight.** No bundlers, no SVG parsers, no DOM diffing. The
  webview swaps `innerHTML`. Comfortable on 1 MB+ SVGs because the debounce
  coalesces edits and rendering uses the browser's native engine.
- 💾 **Stable while hidden.** `retainContextWhenHidden: true` plus
  message-based updates means tab switches don't trigger reloads.
- 🔍 **Zoom & fit.** Toolbar buttons (`−` / `100%` / `+` / `fit`) and
  `Ctrl/Cmd + scroll` to zoom.
- 🛡️ **Strict CSP.** Per-panel `script-src 'nonce-…'`; no inline scripts,
  no remote resources, scripts inside SVG are stripped on render.
- 🧰 **Zero runtime deps.** Only `typescript` / `@types/*` / `@vscode/vsce`
  are dev-time tooling.

## 🚀 Quick Start

### Install from VSIX (local)

```bash
npm install
npm run compile
npm run package          # → lightweight-svg-previewer-0.0.1.vsix
code --install-extension lightweight-svg-previewer-0.0.1.vsix
```

Reload VS Code, open any `.svg`, and press <kbd>Ctrl</kbd>+<kbd>K</kbd>
<kbd>V</kbd> to toggle the preview on/off.

### Install from Marketplace

> Available once published. The Marketplace listing will use the publisher
> id `ryonak`.

```bash
code --install-extension ryonak.lightweight-svg-previewer
```

## ⚙️ Configuration

| Key                                    | Type      | Default        | Description                                                          |
| -------------------------------------- | --------- | -------------- | -------------------------------------------------------------------- |
| `lightweightSvgPreviewer.debounceMs`   | `number`  | `150`          | Delay between the last edit and a preview refresh. Range: `0`–`2000`. |
| `lightweightSvgPreviewer.autoOpen`     | `boolean` | `false`        | Auto-open the preview when an SVG file is opened. Off by default — open via the keybinding or command. |
| `lightweightSvgPreviewer.background`   | `string`  | `checkerboard` | One of `checkerboard` / `editor` / `transparent` / `white` / `black`. |

Settings update live — no reload required.

## 🔧 Commands & Keybindings

| Command                                          | Title                                | Default keybinding                                  | When                                                      |
| ------------------------------------------------ | ------------------------------------ | --------------------------------------------------- | --------------------------------------------------------- |
| `lightweightSvgPreviewer.showPreview`            | SVG Preview: Open SVG Preview to the Side | —                                                   | Always (palette / editor title bar / Explorer context).   |
| `lightweightSvgPreviewer.togglePreview`          | SVG Preview: Toggle Preview          | <kbd>Ctrl</kbd>+<kbd>K</kbd> <kbd>V</kbd> (chord)   | `editorTextFocus && resourceExtname == .svg`              |

> The keybinding follows VS Code's <kbd>Ctrl</kbd>+<kbd>K</kbd> chord
> family (same prefix as <kbd>Ctrl</kbd>+<kbd>K</kbd> <kbd>V</kbd> for the
> built-in Markdown preview). Rebind via **Preferences: Open Keyboard
> Shortcuts** if you have a conflict.

## 🧠 How it works

```
┌───────────────────────────┐       postMessage       ┌──────────────────────┐
│ Text Editor (.svg)        │────────────────────────▶│ Webview (ViewColumn  │
│  onDidChangeTextDocument  │     debounce 150ms      │   .Beside)           │
│  onDidOpenTextDocument    │                         │   innerHTML swap     │
└───────────────────────────┘                         └──────────────────────┘
        ▲                                                       │
        │  ready / config messages                              │
        └───────────────────────────────────────────────────────┘
```

- One webview per document (`Map<docUri, WebviewPanel>`).
- One `setTimeout` debounce timer per document; cleared on every keystroke.
- Update messages carry the **full document text**. Coalescing happens via
  the debounce so very large SVGs only re-render once per quiet period.
- HTML is generated per-panel with a fresh CSP nonce (no inline scripts).

## 🏎️ Performance

- The default 150 ms debounce keeps end-to-end refresh under ~200 ms on
  a typical machine.
- For very large SVGs (≥ 1 MB) raise the debounce to keep typing snappy:
  ```jsonc
  "lightweightSvgPreviewer.debounceMs": 300
  ```
- Memory: the extension keeps no edit history, doesn't snapshot the
  document, and reuses the webview across edits. Each panel is one
  `WebviewPanel` retaining one `<div>` of SVG markup.

## ❓ FAQ / Troubleshooting

**How do I open the preview?**
By default the preview is **not** opened automatically. Use the keybinding
<kbd>Ctrl</kbd>+<kbd>K</kbd> <kbd>V</kbd> while focused on an `.svg`, run
**SVG Preview: Open SVG Preview to the Side** from the command palette, or
right-click an `.svg` in the Explorer. To opt in to auto-open, set
`lightweightSvgPreviewer.autoOpen` to `true`.

**My `.svg` opens as an image, not as text.**
You have a stronger user-level entry in `workbench.editorAssociations`. Open
`settings.json` and remove the `*.svg` entry — the extension's
`configurationDefaults` will then take over.

**Updates feel slow.**
Lower `lightweightSvgPreviewer.debounceMs` toward `50`. Pushing it below
`30` is rarely useful: most of the perceived delay is the browser's reflow
on `innerHTML` for large SVGs, not the debounce itself.

**My SVG contains `<script>`. Will it execute?**
No. The webview enforces a strict CSP (`script-src 'nonce-…'`) and the
extension also strips `<script>…</script>` blocks before rendering.

**Will this work over SSH / WSL / Codespaces?**
Yes. The extension does no native I/O — only string passing through
`postMessage`.

## 🚧 Limitations / Non-goals

- No SVG editing GUI.
- No DOM inspector / element picker.
- No animation timeline; SMIL and CSS animations render as the browser does.
- No export. Use VS Code's built-in image preview if you need PNG export.

## 🛠️ Development

```bash
git clone https://github.com/RyoNak/lightweight-svg-previewer
cd lightweight-svg-previewer
npm install

npm run typecheck   # tsc --noEmit
npm test            # node --test (zero new deps)
npm run compile     # → dist/extension.js
npm run package     # → *.vsix via @vscode/vsce
```

Run the extension in a development host: open the folder in VS Code and
press <kbd>F5</kbd>.

### Project layout

```
src/
  extension.ts     — activation, panel manager, debounce, message wiring
  util.ts          — pure helpers (testable in node:test)
  util.test.ts     — unit tests
media/
  preview.js       — webview script: message → innerHTML
  preview.css      — fit-to-window, theme variables
images/
  icon.svg         — source for marketplace icon
  icon.png         — 128×128 marketplace icon
```

### Tests

`npm test` compiles TypeScript and runs Node's built-in test runner against
`dist/**/*.test.js`. The test suite covers the pure helpers in `src/util.ts`:

- file-name / language-id detection
- nonce generation (length, charset, uniqueness)
- CSP construction
- config coercion (debounce clamping, background enum, fallbacks)
- defensive `<script>` stripping

The webview-side script and the `vscode`-API-coupled glue in
`extension.ts` are not unit-tested — exercise those by pressing <kbd>F5</kbd>
in the development host.

## 📜 Changelog

See [CHANGELOG.md](CHANGELOG.md).

## 🤝 Contributing

Issues and PRs welcome at
[github.com/RyoNak/lightweight-svg-previewer](https://github.com/RyoNak/lightweight-svg-previewer).
Please run `npm test` and `npm run typecheck` before submitting.

## 📄 License

[MIT](LICENSE) © RyoNak
