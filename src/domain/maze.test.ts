import { describe, expect, it } from "vitest";
import { groupIntoBlocks } from "./blocks";
import type { Cue } from "./cue";
import { createMazePlan } from "./maze-plan";
import { selectCues } from "./select-cues";

describe("字幕を maze する（シナリオ）", () => {
  // 日英で字幕の区切り方もタイミングも異なる、実際の字幕に近い例
  const en1: Cue = { startMs: 1000, endMs: 2000, text: "I don't think we should" };
  const en2: Cue = { startMs: 2000, endMs: 3200, text: "go in there." };
  const en3: Cue = { startMs: 4000, endMs: 5000, text: "Why not?" };
  const ja1: Cue = { startMs: 1100, endMs: 3000, text: "入らない方がいい" };
  const ja2: Cue = { startMs: 4100, endMs: 5200, text: "どうして？" };
  const tracks = { ja: [ja1, ja2], en: [en1, en2, en3] };

  const plan = createMazePlan({
    blocks: groupIntoBlocks(tracks),
    englishRatio: 0.5,
    random: (() => {
      const values = [0.1, 0.9];
      let i = 0;
      return () => values[i++] ?? 0;
    })(),
  });

  const textAt = (timeMs: number) =>
    selectCues(plan, tracks, timeMs).map((cue) => cue.text);

  it("1 つ目のセリフは、英語の字幕だけを最後まで表示する", () => {
    expect(textAt(1050)).toEqual(["I don't think we should"]);
    expect(textAt(2500)).toEqual(["go in there."]);
    expect(textAt(3100)).toEqual(["go in there."]);
  });

  it("2 つ目のセリフは、日本語の字幕だけを最後まで表示する", () => {
    expect(textAt(4050)).toEqual([]);
    expect(textAt(4500)).toEqual(["どうして？"]);
    expect(textAt(5100)).toEqual(["どうして？"]);
  });

  it("セリフの間では、何も表示しない", () => {
    expect(textAt(3500)).toEqual([]);
  });
});
