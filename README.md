# mazelix

Netflix の日本語字幕と英語字幕を、文単位で混ぜて（maze して）表示する Chrome 拡張機能です。
画面に出る字幕は常にどちらか一方の言語だけなので、ドラマや映画に集中したまま、自然に英語に触れられます。

Mazelingo の「文章の一部だけを英語にする」アイデアと、Language Reactor の「Netflix の字幕で学ぶ」体験を組み合わせています。

Chrome ウェブストアで審査中です（v0.1.0、2026-10-23 提出）。

## 仕組み

1. Netflix が読み込む動画情報（マニフェスト）から、日本語と英語の字幕トラックを見つける
2. 日英の字幕ファイル（IMSC 1.1 / TTML）を取得して、字幕の配列に変換する
3. 日英どちらかの字幕が途切れずに続く範囲を「ブロック」にまとめ、ブロックごとに表示する言語を決める。英語の割合（ツールバーのアイコンから設定できる。初期値は 50%）の数だけ、英文の簡単なブロックから順に英語にする。英文の難しさは、いちばん珍しい単語の頻度で測る
4. 動画の再生位置に合わせて、選ばれた言語の字幕を動画の上に重ねて表示し、Netflix 標準の字幕は隠す

言語が切り替わるのはセリフの間だけなので、字幕が途中で切れたり、2 つの言語が同時に出たりしません。

再生中は、次のキーで操作できます。

| キー | 操作 |
|---|---|
| `a` | 今のセリフの先頭に戻る（セリフが始まってすぐなら、1 つ前のセリフの先頭へ） |
| `d` | 次のセリフの先頭に進む |
| `w` | 表示中のセリフの日英を入れ替える（英文の意味が分からないときに、日本語で確かめられる） |

## 開発

Node.js 22 以上が必要です。

```sh
npm install
npm test            # テスト（Vitest）
npm run test:watch  # 保存するたびにテストを実行
npm run typecheck   # 型チェック
npm run build       # .output/chrome-mv3 に拡張機能をビルド
npm run zip         # Chrome ウェブストアに提出する zip を作る
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
| `src/data/` | 同梱するデータ（英単語の頻度。`scripts/build-word-frequency.py` で作る） |
| `src/popup/` | 英語の割合を設定するポップアップの部品 |
| `src/settings.ts` | 設定（英語の割合）の保存と監視 |
| `entrypoints/` | Chrome に読み込まれる content script とポップアップ（WXT のエントリーポイント） |
| `public/icon/` | 拡張機能のアイコン |
| `docs/chrome-web-store.md` | Chrome ウェブストアの掲載情報の下書き |

## クレジット

英文の難しさを測るための英単語の頻度（`src/data/en-word-frequency.txt`）は、Robyn Speer さんの [wordfreq](https://github.com/rspeer/wordfreq) のデータから作ったもので、[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) で配布します。
wordfreq には [SUBTLEX](https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexus)（Brysbaert ほか。SUBTLEX は自由に使えるデータです）、[OpenSubtitles](http://www.opensubtitles.org/)（OPUS OpenSubtitles 2018 経由）、[Google Books Ngrams](http://books.google.com/ngrams)、Wikipedia などのデータが含まれています。
