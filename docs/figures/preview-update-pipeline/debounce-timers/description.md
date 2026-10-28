[← プレビュー更新パイプライン](../description.md)

# 文書単位の debounce

文書 URI ごとに 1 つの `setTimeout`．打鍵のたびに clear して張り直し，`debounceMs`（既定 150 ms）静止したときだけ `flush` を呼ぶ．同じ文書を複数のプレビューが表示していてもタイマーは 1 つなので，連打中の処理は「タイマー張り直し」だけになる．最後のプレビューが閉じたらタイマーも破棄する．

## ソース

- [`src/extension.ts`](../../../../src/extension.ts) — `debounceTimers`，`activate`，`attachPreview` の `onDidDispose`
