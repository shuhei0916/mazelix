import { describe, expect, it } from "vitest";
import { englishDifficulty, type WordFrequency } from "./difficulty";

// Zipf 尺度の頻度（6 ならとてもよく使う、3 なら珍しい）
const zipf: Record<string, number> = {
  i: 6.5,
  "don't": 6.2,
  know: 6.0,
  run: 5.5,
  the: 7.7,
  is: 7.0,
  probability: 4.0,
  negligible: 3.4,
};
const frequency: WordFrequency = (word) => zipf[word];

describe("englishDifficulty", () => {
  it("珍しい単語を含む文ほど難しい", () => {
    expect(englishDifficulty("The probability is negligible.", frequency)).toBeGreaterThan(
      englishDifficulty("I don't know.", frequency),
    );
  });

  it("文の難しさは、いちばん珍しい単語で決まる", () => {
    expect(englishDifficulty("Probability.", frequency)).toBeGreaterThan(
      englishDifficulty("I don't know, I don't know, I don't know.", frequency),
    );
  });

  it("頻度のデータにない単語は、どの単語よりも珍しいものとして扱う", () => {
    expect(englishDifficulty("Kowalski!", frequency)).toBeGreaterThan(
      englishDifficulty("Negligible!", frequency),
    );
  });

  it("珍しさが同じなら、単語の多い文ほど難しい", () => {
    expect(englishDifficulty("I don't know, I know.", frequency)).toBeGreaterThan(
      englishDifficulty("I know.", frequency),
    );
  });

  it("大文字・小文字や、アポストロフィの種類を区別しない", () => {
    expect(englishDifficulty("I DON’T KNOW.", frequency)).toBe(
      englishDifficulty("i don't know.", frequency),
    );
  });

  it("単語がなければ、いちばん簡単", () => {
    expect(englishDifficulty("♪ ♪", frequency)).toBe(0);
    expect(englishDifficulty("Run!", frequency)).toBeGreaterThan(0);
  });
});
