[← プレビュー更新パイプライン](../description.md)

# Webview 描画

webview 側の描画．受け取った全文から `<script>` を除き，`innerHTML` に代入するだけ．SVG パーサや DOM 差分計算を持たず，ブラウザのネイティブ描画に任せる．拡張機能側が版で重複を除くので，前回内容との文字列比較（最大数 MB）も行わない．

## ソース

- [`media/preview.js`](../../../../media/preview.js) — `setContent`，`message` リスナー

## 別の視点

- [Webview スクリプト（ライフサイクル）](../../webview-lifecycle/webview-script/description.md)
