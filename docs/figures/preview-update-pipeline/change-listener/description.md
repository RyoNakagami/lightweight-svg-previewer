[← プレビュー更新パイプライン](../description.md)

# 単一の変更リスナー

全プレビューで共有する **1 本だけ** の変更リスナー．以前はプレビューごとに購読していたため，1 打鍵ごとに N 個のコールバックが走っていた．

- `e.contentChanges.length === 0`（保存・dirty 状態の変化のみ）なら即 return．
- URI が `previews` に無い文書（SVG 以外・プレビュー未表示）も即 return．

この 2 つの早期 return により，SVG と無関係な編集ではハッシュ表の参照 1 回で処理が終わる．

## ソース

- [`src/extension.ts`](../../../../src/extension.ts) — `activate` — `onDidChangeTextDocument` ハンドラ
