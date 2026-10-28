[← Webview ライフサイクル](../description.md)

# VS Code Webview ホスト

`retainContextWhenHidden` が無い webview は，非表示になると VS Code が中身を破棄し，再表示時に同じ HTML から再ロードする．非表示タブは描画済み SVG の DOM を保持しないのでメモリを使わない．代償として再表示時に再描画が 1 回走る（大きな SVG では一瞬遅れることがある）．`setState` の値はホストが保持する．

## ソース

- [`src/extension.ts`](../../../../src/extension.ts) — `createWebviewPanel` / `registerCustomEditorProvider` の呼び出し（`retainContextWhenHidden` 未指定）
