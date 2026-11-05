// 英単語の頻度（Zipf 尺度。7 なら the のようにとてもよく使い、3 なら珍しい）。
// データにない単語は undefined
export type WordFrequency = (word: string) => number | undefined;

const WORD = /[a-z]+(?:'[a-z]+)*/g;
// データにない単語（人名や、とても珍しい単語）の頻度
const UNKNOWN_ZIPF = 0;
// Zipf 尺度の上限の目安。これから頻度を引いて、珍しいほど大きな値にする
const MAX_ZIPF = 8;
// 単語の数は、珍しさが同じ文の間の順番を決めるだけに使う
const PER_WORD = 0.001;

// 英文の難しさ。いちばん珍しい単語の珍しさで決まり、珍しさが同じなら単語の多い文ほど難しい。
// 単語がなければ 0（いちばん簡単）
export function englishDifficulty(text: string, frequency: WordFrequency): number {
  const words = text.toLowerCase().replaceAll("’", "'").match(WORD) ?? [];
  if (words.length === 0) return 0;
  const rarest = Math.min(...words.map((word) => frequency(word) ?? UNKNOWN_ZIPF));
  return MAX_ZIPF - rarest + words.length * PER_WORD;
}
