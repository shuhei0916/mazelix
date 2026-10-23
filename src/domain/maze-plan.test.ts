import { describe, expect, it } from "vitest";
import { createMazePlan } from "./maze-plan";

function sequence(...values: number[]): () => number {
  let i = 0;
  return () => values[i++] ?? 0;
}

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

  it("乱数が英語の比率未満の区間は英語、それ以外は日本語にする", () => {
    const plan = createMazePlan({
      durationMs: 30000,
      segmentMs: 10000,
      englishRatio: 0.5,
      random: sequence(0.1, 0.9, 0.4),
    });

    expect(plan.map((segment) => segment.lang)).toEqual(["en", "ja", "en"]);
  });

  it("動画の長さが区間長で割り切れないときは、最後の区間を動画の終わりで切る", () => {
    const plan = createMazePlan({
      durationMs: 25000,
      segmentMs: 10000,
      englishRatio: 0,
      random: Math.random,
    });

    expect(plan.at(-1)).toEqual({ startMs: 20000, endMs: 25000, lang: "ja" });
  });
});
