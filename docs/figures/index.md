# Lightweight SVG Previewer — 軽量・高速化の工夫

対象：`src/`，`media/`，`package.json`（0.1.0）．
解析コミット：`0d1645c`．**未コミットの変更（0.1.0 の作業ツリー）を含めて解析した**ため，各要素の `working_tree_dirty` は `true`．
言語：日本語．

## 視点

| 視点 | 問い |
| --- | --- |
| [プレビュー更新パイプライン](preview-update-pipeline/description.md) | 1 回の編集がプレビューに届くまでに，どこで仕事を省いているか |
| [Webview ライフサイクル](webview-lifecycle/description.md) | 起動・生成・非表示・再表示で，起動コストとメモリをどう抑えているか |

## 工夫の一覧

| # | 工夫 | 効果 |
| --- | --- | --- |
| 1 | 変更リスナーを 1 本に集約し，無関係な文書は即 return | 打鍵ごとのコールバック数がプレビュー数に比例しない |
| 2 | 文書単位の debounce（既定 150 ms） | 連打中は描画しない |
| 3 | 版（`document.version`）と可視状態で送信を間引く | 同じ内容・見えない webview に送らない |
| 4 | `getText()` は 1 回だけ呼んで共有 | 大きな SVG でも文字列生成は 1 回 |
| 5 | 設定をキャッシュ | 打鍵ごとに `getConfiguration` を呼ばない |
| 6 | 初回送信は `ready` の 1 回 | 二重送信をなくす |
| 7 | `retainContextWhenHidden` を使わず `setState` でズームを保持 | 非表示タブがメモリを持たない |
| 8 | `workspaceContains` を外した遅延 activation | 起動時のワークスペース走査なし |
| 9 | webview は `innerHTML` 差し替えのみ | パーサ・差分計算の依存とコストなし |

## 描画状態

tikzc 1.3.0 で 2 図とも `check: pass`，PNG を目視確認済み（`visual: inspected`）．
