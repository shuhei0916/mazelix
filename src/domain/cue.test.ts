import { describe, expect, it } from "vitest";
import { findActiveCue } from "./cue";

describe("findActiveCue", () => {
  it("指定した時刻に表示中のキューを返す", () => {
    const track = [
      { startMs: 1000, endMs: 3000, text: "こんにちは" },
      { startMs: 4000, endMs: 6000, text: "元気ですか" },
    ];

    expect(findActiveCue(track, 5000)).toEqual({
      startMs: 4000,
      endMs: 6000,
      text: "元気ですか",
    });
  });
});