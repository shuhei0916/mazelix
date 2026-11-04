import { describe, expect, it } from "vitest";
import { isSeekMessage, isTextTracksMessage, seekMessage, textTracksMessage } from "./messages";

describe("isTextTracksMessage", () => {
  it("textTracksMessage で作ったメッセージなら true を返す", () => {
    expect(isTextTracksMessage(textTracksMessage([{ language: "ja" }], 70151933))).toBe(true);
  });

  it.each([
    ["null", null],
    ["文字列", "hello"],
    ["Netflix 自身のメッセージ", { type: "text-tracks", textTracks: [] }],
    ["textTracks が配列ではない", { source: "mazelix", type: "text-tracks", textTracks: {} }],
  ])("%s なら false を返す", (_, data) => {
    expect(isTextTracksMessage(data)).toBe(false);
  });
});

describe("isSeekMessage", () => {
  it("seekMessage で作ったメッセージなら true を返す", () => {
    expect(isSeekMessage(seekMessage(5000))).toBe(true);
  });

  it.each([
    ["null", null],
    ["字幕トラックのメッセージ", textTracksMessage([], undefined)],
    ["時刻が数値ではない", { source: "mazelix", type: "seek", timeMs: "5000" }],
    ["時刻が負", { source: "mazelix", type: "seek", timeMs: -1 }],
  ])("%s なら false を返す", (_, data) => {
    expect(isSeekMessage(data)).toBe(false);
  });
});
