import { describe, expect, it } from "vitest";
import { extractMovieId, extractTextTracks, isForCurrentVideo } from "./manifest";

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

describe("isForCurrentVideo", () => {
  it("マニフェストの作品 ID が、再生ページの URL の ID と同じなら true を返す", () => {
    expect(isForCurrentVideo(70151933, "/watch/70151933")).toBe(true);
  });

  it("作品 ID が違えば false を返す（次のエピソードの先読みなど）", () => {
    expect(isForCurrentVideo(70151934, "/watch/70151933")).toBe(false);
  });

  it("マニフェストに作品 ID がなければ、判断できないので true を返す", () => {
    expect(isForCurrentVideo(undefined, "/watch/70151933")).toBe(true);
  });
});

describe("extractMovieId", () => {
  it("マニフェストの result.movieId を返す", () => {
    expect(extractMovieId({ result: { movieId: 70151933 } })).toBe(70151933);
  });

  it("数値でなければ undefined を返す", () => {
    expect(extractMovieId({ result: {} })).toBeUndefined();
    expect(extractMovieId(null)).toBeUndefined();
  });
});
