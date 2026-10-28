[← プレビュー更新パイプライン](../description.md)

# flush(key)

送信対象を選び，必要な分だけ送る．

- `sentVersion === undefined`（webview がまだ `ready` でない）→ 送らない．`ready` 時に最新を送るため．
- `!panel.visible`（非表示）→ 送らない．再表示時に webview が再ロードされ `ready` で同期される．
- `sentVersion === doc.version`（既に送った版）→ 送らない．
- 送る相手がいるときだけ `getText()` を **1 回** 呼び，その文字列を全プレビューで共有する（数 MB の SVG でも文字列生成は 1 回）．

## ソース

- [`src/extension.ts`](../../../../src/extension.ts) — `flush`，`send`
