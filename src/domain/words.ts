export type Token = { text: string; isWord: boolean };

const segmenter = new Intl.Segmenter("en", { granularity: "word" });

// 英文を単語とそれ以外（空白・句読点・改行）に分ける。単語以外が続くときは 1 つにまとめる。
// 短縮形（don't）は 1 つの単語になる
export function splitWords(text: string): Token[] {
  const tokens: Token[] = [];
  for (const { segment, isWordLike } of segmenter.segment(text)) {
    const isWord = isWordLike === true;
    const last = tokens.at(-1);
    if (last && !isWord && !last.isWord) last.text += segment;
    else tokens.push({ text: segment, isWord });
  }
  return tokens;
}
