import { describe, expect, it } from "vitest";
import { groupIntoBlocks } from "./blocks";
import type { Cue } from "./cue";

describe("groupIntoBlocks", () => {
  it("時刻が重なる日英のキューを、1つのブロックにまとめる", () => {
    const ja: Cue = { startMs: 1000, endMs: 3000, text: "入らない方がいい" };
    const en: Cue = { startMs: 1200, endMs: 2800, text: "We shouldn't go in." };

    expect(groupIntoBlocks({ ja: [ja], en: [en] })).toEqual([
      { startMs: 1000, endMs: 3000, cues: { ja: [ja], en: [en] } },
    ]);
  });

  it("間があいているキューは、別のブロックにする", () => {
    const ja1: Cue = { startMs: 1000, endMs: 3000, text: "入らない方がいい" };
    const en1: Cue = { startMs: 1200, endMs: 2800, text: "We shouldn't go in." };
    const ja2: Cue = { startMs: 4000, endMs: 5000, text: "なぜ？" };
    const en2: Cue = { startMs: 4100, endMs: 4900, text: "Why?" };

    expect(groupIntoBlocks({ ja: [ja1, ja2], en: [en1, en2] })).toEqual([
      { startMs: 1000, endMs: 3000, cues: { ja: [ja1], en: [en1] } },
      { startMs: 4000, endMs: 5000, cues: { ja: [ja2], en: [en2] } },
    ]);
  });
});
