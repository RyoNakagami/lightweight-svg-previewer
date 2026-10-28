[← Webview ライフサイクル](../description.md)

# プレビュー専用エディタ

`*.svg` を開いたときの既定エディタ（`CustomTextEditorProvider`）．テキストエディタを開かないので，SVG を「見るだけ」のときはエディタ描画のコストが掛からない（推測：トークナイズ・minimap 等）．`resolveCustomTextEditor` で webview オプションを設定し `attachPreview` に渡すだけの薄い層．

## ソース

- [`src/extension.ts`](../../../../src/extension.ts) — `SvgPreviewEditorProvider`
