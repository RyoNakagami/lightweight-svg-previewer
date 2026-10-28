[← プレビュー更新パイプライン](../description.md)

# プレビュー台帳

`Map<URI, Set<Preview>>`．各 `Preview` は panel・文書・種別（専用エディタかサイドか）・`sentVersion` を持つ．変更リスナーは「この URI にプレビューがあるか」を，`flush` は「誰に何版を送ったか」をここで引く．専用エディタが既に表示している文書に `autoOpen` でサイドプレビューを重ねない判定（`hasEditorPreview`）にも使う．

## ソース

- [`src/extension.ts`](../../../../src/extension.ts) — `previews`，`Preview`，`attachPreview`，`hasEditorPreview`
