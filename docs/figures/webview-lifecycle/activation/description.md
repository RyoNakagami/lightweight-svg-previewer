[← Webview ライフサイクル](../description.md)

# 遅延 activation

`activationEvents` は `onCustomEditor:lightweightSvgPreviewer.editor` と `onLanguage:xml`（`autoOpen` 用）だけ．以前あった `workspaceContains:**/*.svg` はワークスペース全体を起動時に走査するため削除した．コマンド用の activation は VS Code が自動で生成する．`activate()` ではプロバイダとコマンドを登録し，`mediaRoot` と設定を一度だけ求める．

## ソース

- [`package.json`](../../../../package.json) — `activationEvents`，`contributes.customEditors`
- [`src/extension.ts`](../../../../src/extension.ts) — `activate`
