import type { Dictionary } from "../domain/dictionary";

// 1 行に「見出し語（カンマ区切りで複数）<タブ>意味」が並ぶ。# で始まる行はクレジット。
// 同じ見出し語が複数の行にあれば（名詞と形容詞の fine など）、意味を「 / 」でつなげる
export function parseDictionary(text: string): Dictionary {
  const meanings = new Map<string, string>();
  for (const line of text.split("\n")) {
    const tab = line.indexOf("\t");
    if (tab < 0 || line.startsWith("#")) continue;
    const meaning = line.slice(tab + 1);
    for (const headword of line.slice(0, tab).split(",")) {
      const key = headword.trim().toLowerCase();
      const known = meanings.get(key);
      meanings.set(key, known === undefined ? meaning : `${known} / ${meaning}`);
    }
  }
  return (headword) => meanings.get(headword);
}

// 辞書のファイルを、初めて引くときに 1 回だけ読む。失敗したら、次に引くときに読み込み直す
export function loadOnce(fetchText: () => Promise<string>): () => Promise<Dictionary> {
  let loading: Promise<Dictionary> | undefined;
  return () => {
    loading ??= fetchText()
      .then(parseDictionary)
      .catch((error: unknown) => {
        loading = undefined;
        throw error;
      });
    return loading;
  };
}
