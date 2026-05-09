# Changelog

All notable changes to **Lightweight SVG Previewer** are documented here. The
format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.0.1] - 2026-05-09

### Added

- Live preview of `*.svg` files in a side webview, opt-in via the
  keybinding / command (set `lightweightSvgPreviewer.autoOpen: true` to
  open automatically when an SVG file is opened in a text editor).
- Configurable debounce (`lightweightSvgPreviewer.debounceMs`, default 150 ms)
  for real-time edits.
- `lightweightSvgPreviewer.autoOpen` (default `false`) to enable
  auto-opening.
- `lightweightSvgPreviewer.background`: `checkerboard` (default) / `editor` /
  `transparent` / `white` / `black`.
- Command **SVG Preview: Open SVG Preview to the Side** (palette / editor
  title / Explorer context menu).
- Command **SVG Preview: Toggle Preview** with default keybinding
  <kbd>Ctrl</kbd>+<kbd>K</kbd> <kbd>V</kbd> (chord), scoped to focused
  `*.svg` editors.
- Toolbar with zoom in / zoom out / reset (100%) / fit-to-window, plus
  `Ctrl/Cmd + scroll wheel` zoom in the preview pane.
- `configurationDefaults` makes VS Code open `*.svg` in the default text
  editor instead of the built-in image preview.
- Strict CSP with per-panel nonce; no inline scripts.
- Unit tests for pure helpers via `node:test` (zero runtime dependencies).
