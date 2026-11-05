import { describe, expect, it } from "vitest";
import { splitWords } from "./words";

describe("splitWords", () => {
  it("英文を、単語とそれ以外（空白や句読点）に分ける", () => {
    expect(splitWords("Run, Jim!")).toEqual([
      { text: "Run", isWord: true },
      { text: ", ", isWord: false },
      { text: "Jim", isWord: true },
      { text: "!", isWord: false },
    ]);
  });

  it("短縮形は 1 つの単語にする", () => {
    expect(splitWords("I don't know").filter((token) => token.isWord).map((token) => token.text)).toEqual([
      "I",
      "don't",
      "know",
    ]);
  });

  it("改行や話者の切り替わりの - は、単語以外として残す", () => {
    expect(splitWords("-Wait.\n-What?")).toEqual([
      { text: "-", isWord: false },
      { text: "Wait", isWord: true },
      { text: ".\n-", isWord: false },
      { text: "What", isWord: true },
      { text: "?", isWord: false },
    ]);
  });

  it("つなげると元の文に戻る", () => {
    const text = "He's been acting weird since the funeral... Right?";

    expect(splitWords(text).map((token) => token.text).join("")).toBe(text);
  });
});
