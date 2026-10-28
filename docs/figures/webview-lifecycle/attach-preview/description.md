[← Webview ライフサイクル](../description.md)

# attachPreview

専用エディタとサイドパネルの共通処理．台帳へ登録し，HTML を設定し，`ready` を受けたら現在の `config` と全文を送る．生成直後には送らない（スクリプト読込前で，`ready` と二重送信になるため）．非表示から戻った webview も `ready` を送るので，同じ経路で再同期できる．dispose 時に購読・台帳エントリ・タイマーを片付ける．

## ソース

- [`src/extension.ts`](../../../../src/extension.ts) — `attachPreview`，`buildHtml`
