import { describe, expect, it } from "vitest";
import { type Dictionary, lookUp } from "./dictionary";

const entries: Record<string, string> = {
  run: "『走る』,駆ける / 〈人が〉(…に)『急ぐ』",
  "don't": "do notの短縮形",
};
const dictionary: Dictionary = (headword) => entries[headword];

describe("lookUp", () => {
  it("単語の見出しと、意味の一覧を返す", () => {
    expect(lookUp(dictionary, "run")).toEqual([
      { headword: "run", senses: ["『走る』,駆ける", "〈人が〉(…に)『急ぐ』"] },
    ]);
  });

  it("大文字・小文字や、アポストロフィの種類を区別しない", () => {
    expect(lookUp(dictionary, "Run")).toEqual(lookUp(dictionary, "run"));
    expect(lookUp(dictionary, "Don’t")).toEqual([{ headword: "don't", senses: ["do notの短縮形"] }]);
  });

  it("辞書にない単語なら、空の一覧を返す", () => {
    expect(lookUp(dictionary, "Kowalski")).toEqual([]);
  });
});
