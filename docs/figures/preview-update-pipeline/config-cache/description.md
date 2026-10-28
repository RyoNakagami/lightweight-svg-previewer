[← プレビュー更新パイプライン](../description.md)

# 設定キャッシュ

設定値（`debounceMs` / `autoOpen` / `background`）をモジュール変数 `config` に保持する．打鍵ごとに `getConfiguration` を呼ばず，`onDidChangeConfiguration` で本拡張機能のセクションが変わったときだけ読み直す．`background` が変わったときだけ全プレビューへ `config` メッセージを送る．

## ソース

- [`src/extension.ts`](../../../../src/extension.ts) — `config`，`readConfig`，`activate` の `onDidChangeConfiguration`
