[← Webview ライフサイクル](../description.md)

# サイドプレビュー

テキストエディタ横の webview パネル．`sidePanels` で文書ごとに 1 枚に限定し，既にあれば `reveal` するだけ．`createWebviewPanel` に `retainContextWhenHidden` を渡さない．

## ソース

- [`src/extension.ts`](../../../../src/extension.ts) — `openPreview`，`sidePanels`，`togglePreview` / `showPreview` コマンド
