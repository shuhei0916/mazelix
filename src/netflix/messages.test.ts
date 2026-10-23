import { describe, expect, it } from "vitest";
import { isTextTracksMessage, textTracksMessage } from "./messages";

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
