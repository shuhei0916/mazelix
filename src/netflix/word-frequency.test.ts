import { describe, expect, it } from "vitest";
import { englishWordFrequency, parseWordFrequency } from "./word-frequency";

describe("parseWordFrequency", () => {
  it("1 行に「Zipf の 100 倍」と、その頻度の単語が並ぶ", () => {
    const frequency = parseWordFrequency("# credits\n773 the\n505 run went\n");

    expect(frequency("the")).toBe(7.73);
    expect(frequency("went")).toBe(5.05);
    expect(frequency("kowalski")).toBeUndefined();
  });
});

describe("englishWordFrequency（同梱したデータ）", () => {
  it("よく使う単語ほど頻度が高く、変化形も引ける", () => {
    expect(englishWordFrequency("the")).toBeGreaterThan(englishWordFrequency("run") ?? 0);
    expect(englishWordFrequency("run")).toBeGreaterThan(englishWordFrequency("negligible") ?? 0);
    expect(englishWordFrequency("went")).toBeGreaterThan(5);
    expect(englishWordFrequency("don't")).toBeGreaterThan(6);
  });
});
