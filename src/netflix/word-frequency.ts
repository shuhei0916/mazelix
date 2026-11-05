import type { WordFrequency } from "../domain/difficulty";
import data from "../data/en-word-frequency.txt?raw";

// 1 行に「Zipf の 100 倍」と、その頻度の単語が空白区切りで並ぶ。# で始まる行はクレジット
export function parseWordFrequency(text: string): WordFrequency {
  const zipf = new Map<string, number>();
  for (const line of text.split("\n")) {
    if (line === "" || line.startsWith("#")) continue;
    const [value, ...words] = line.split(" ");
    for (const word of words) zipf.set(word, Number(value) / 100);
  }
  return (word) => zipf.get(word);
}

let bundled: WordFrequency | undefined;

// 同梱した英単語の頻度（wordfreq より、CC BY-SA 4.0）。約 29,000 語あるので、初めて使うときに読む
export const englishWordFrequency: WordFrequency = (word) => {
  bundled ??= parseWordFrequency(data);
  return bundled(word);
};
