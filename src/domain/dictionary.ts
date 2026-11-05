// 見出し語（小文字）から意味を引く。意味は「 / 」区切りで複数ある。辞書になければ undefined
export type Dictionary = (headword: string) => string | undefined;

export type Definition = { headword: string; senses: string[] };

// 字幕の単語を辞書で引く。見つからなければ空の一覧
export function lookUp(dictionary: Dictionary, word: string): Definition[] {
  const headword = word.toLowerCase().replaceAll("’", "'");
  const meaning = dictionary(headword);
  return meaning === undefined ? [] : [{ headword, senses: meaning.split(" / ") }];
}
