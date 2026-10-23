import { describe, expect, it } from "vitest";
import { createMazePlan } from "./maze-plan";

describe("createMazePlan", () => {
  it("英語の比率が 0 なら、全区間で日本語を表示する", () => {
    const plan = createMazePlan({
      durationMs: 30000,
      segmentMs: 10000,
      englishRatio: 0,
      random: Math.random,
    });

    expect(plan).toEqual([
      { startMs: 0, endMs: 10000, lang: "ja" },
      { startMs: 10000, endMs: 20000, lang: "ja" },
      { startMs: 20000, endMs: 30000, lang: "ja" },
    ]);
  });

  it("英語の比率が 1 なら、全区間で英語を表示する", () => {
    const plan = createMazePlan({
      durationMs: 20000,
      segmentMs: 10000,
      englishRatio: 1,
      random: Math.random,
    });

    expect(plan).toEqual([
      { startMs: 0, endMs: 10000, lang: "en" },
      { startMs: 10000, endMs: 20000, lang: "en" },
    ]);
  });
});
