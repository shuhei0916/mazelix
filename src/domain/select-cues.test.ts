import { describe, expect, it } from "vitest";
import type { Cue } from "./cue";
import type { Segment } from "./maze-plan";
import { selectCues } from "./select-cues";

describe("selectCues", () => {
  const jaCue: Cue = { startMs: 1000, endMs: 3000, text: "こんにちは" };
  const enCue: Cue = { startMs: 1200, endMs: 2800, text: "Hello" };
  const tracks = { ja: [jaCue], en: [enCue] };

  it("英語の区間では、英語の字幕を表示する", () => {
    const plan: Segment[] = [{ startMs: 0, endMs: 10000, lang: "en" }];

    expect(selectCues(plan, tracks, 2000)).toEqual([enCue]);
  });

  it("日本語の区間では、日本語の字幕を表示する", () => {
    const plan: Segment[] = [{ startMs: 0, endMs: 10000, lang: "ja" }];

    expect(selectCues(plan, tracks, 2000)).toEqual([jaCue]);
  });

  it("プランのどの区間にも入らない時刻では、何も表示しない", () => {
    const plan: Segment[] = [{ startMs: 0, endMs: 1500, lang: "ja" }];

    expect(selectCues(plan, tracks, 2000)).toEqual([]);
  });
});
