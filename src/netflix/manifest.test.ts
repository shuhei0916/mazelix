import { describe, expect, it } from "vitest";
import { extractTextTracks } from "./manifest";

describe("extractTextTracks", () => {
  it("マニフェストの result.textTracks を返す", () => {
    const textTracks = [{ language: "ja" }, { language: "en" }];

    expect(extractTextTracks({ result: { textTracks, audioTracks: [] } })).toBe(textTracks);
  });
});

describe("extractTextTracks（マニフェスト以外の値）", () => {
  it.each([
    ["null", null],
    ["数値", 42],
    ["文字列", "manifest"],
    ["result がないオブジェクト", { textTracks: [] }],
    ["textTracks が配列ではない", { result: { textTracks: { base64Map: "", size: 0 } } }],
  ])("%s なら undefined を返す", (_, value) => {
    expect(extractTextTracks(value)).toBeUndefined();
  });
});
