[← Webview ライフサイクル](../description.md)

# Webview スクリプト

読込完了時に `ready` を送り，`update` / `config` を受ける．ズーム倍率と fit 状態を `vscode.setState` に保存し，再ロード時に `getState` で復元する．これにより `retainContextWhenHidden` を外してもタブ切替でズームが失われない．

## ソース

- [`media/preview.js`](../../../../media/preview.js) — `acquireVsCodeApi`，`applyZoom`（`setState`），`getState`，`ready` 送信

## 別の視点

- [Webview 描画（更新パイプライン）](../../preview-update-pipeline/webview-renderer/description.md)
