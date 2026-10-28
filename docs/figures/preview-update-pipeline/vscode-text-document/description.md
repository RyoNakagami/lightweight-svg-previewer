[← プレビュー更新パイプライン](../description.md)

# VS Code TextDocument

VS Code の `TextDocument`．編集のたびに `onDidChangeTextDocument` を発火する．拡張機能は文書のコピーを持たず，必要なときだけ `getText()` で読む．

## ソース

- [`src/extension.ts`](../../../../src/extension.ts) — `activate` 内の `onDidChangeTextDocument` 購読
