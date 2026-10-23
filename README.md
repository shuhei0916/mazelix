# mazelix

Netflix の日本語字幕と英語字幕を、文単位で混ぜて（maze して）表示する Chrome 拡張機能です。
画面に出る字幕は常にどちらか一方の言語だけなので、ドラマや映画に集中したまま、自然に英語に触れられます。

Mazelingo の「文章の一部だけを英語にする」アイデアと、Language Reactor の「Netflix の字幕で学ぶ」体験を組み合わせています。

## 仕組み

1. Netflix が読み込む動画情報（マニフェスト）から、日本語と英語の字幕トラックを見つける
2. 日英の字幕ファイル（IMSC 1.1 / TTML）を取得して、字幕の配列に変換する
3. 日英どちらかの字幕が途切れずに続く範囲を「ブロック」にまとめ、ブロックごとに表示する言語を決める（英語の割合は今のところ 50% 固定）
4. 動画の再生位置に合わせて、選ばれた言語の字幕を動画の上に重ねて表示し、Netflix 標準の字幕は隠す

言語が切り替わるのはセリフの間だけなので、字幕が途中で切れたり、2 つの言語が同時に出たりしません。

## 開発

Node.js 22 以上が必要です。

```sh
npm install
npm test            # テスト（Vitest）
npm run test:watch  # 保存するたびにテストを実行
npm run typecheck   # 型チェック
npm run build       # .output/chrome-mv3 に拡張機能をビルド
```

開発は t-wada さんの推奨する TDD（TODO リスト → Red → Green → Refactor）で進めています。TODO リストは [todo.md](todo.md) です。

### Chrome に読み込む

1. `npm run build` を実行する
2. Chrome で `chrome://extensions` を開き、「デベロッパーモード」をオンにする
3. 「パッケージ化されていない拡張機能を読み込む」で `.output/chrome-mv3` を選ぶ
4. コードを変更したら、ビルドし直して `chrome://extensions` の mazelix の再読み込みボタンを押し、Netflix のタブも再読み込みする

### ディレクトリ構成

| パス | 内容 |
|---|---|
| `src/domain/` | 字幕を maze するロジック（Netflix にも Chrome にも依存しない純粋な関数） |
| `src/netflix/` | Netflix の字幕形式やマニフェストの扱い、字幕の表示 |
| `entrypoints/` | Chrome に読み込まれる content script（WXT のエントリーポイント） |
