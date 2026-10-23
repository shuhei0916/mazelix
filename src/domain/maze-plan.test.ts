import { describe, expect, it } from "vitest";
import type { Block } from "./blocks";
import type { Cue } from "./cue";
import { createMazePlan } from "./maze-plan";

function sequence(...values: number[]): () => number {
  let i = 0;
  return () => values[i++] ?? 0;
}

function bilingualBlock(startMs: number, endMs: number): Block {
  const cue = (text: string): Cue => ({ startMs, endMs, text });
  return { startMs, endMs, cues: { ja: [cue("日本語")], en: [cue("English")] } };
}

describe("createMazePlan", () => {
  const blocks = [
    bilingualBlock(1000, 3000),
    bilingualBlock(4000, 6000),
    bilingualBlock(7000, 9000),
  ];

  it("英語の割合が 0 なら、すべてのブロックを日本語で表示する", () => {
    const plan = createMazePlan({ blocks, englishRatio: 0, random: Math.random });

    expect(plan).toEqual([
      { startMs: 1000, endMs: 3000, lang: "ja" },
      { startMs: 4000, endMs: 6000, lang: "ja" },
      { startMs: 7000, endMs: 9000, lang: "ja" },
    ]);
  });

  it("英語の割合が 1 なら、すべてのブロックを英語で表示する", () => {
    const plan = createMazePlan({ blocks, englishRatio: 1, random: Math.random });

    expect(plan.map((segment) => segment.lang)).toEqual(["en", "en", "en"]);
  });

  it("乱数が英語の割合未満のブロックは英語、それ以外は日本語にする", () => {
    const plan = createMazePlan({
      blocks,
      englishRatio: 0.2,
      random: sequence(0.1, 0.5, 0.19),
    });

    expect(plan.map((segment) => segment.lang)).toEqual(["en", "ja", "en"]);
  });
});
