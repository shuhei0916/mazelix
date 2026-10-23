import { describe, expect, it } from "vitest";
import type { Block } from "./blocks";
import type { Cue } from "./cue";
import { createMazePlan } from "./maze-plan";

function bilingualBlock(startMs: number, endMs: number): Block {
  const cue = (text: string): Cue => ({ startMs, endMs, text });
  return { startMs, endMs, cues: { ja: [cue("日本語")], en: [cue("English")] } };
}

function manyBlocks(count: number): Block[] {
  return Array.from({ length: count }, (_, i) => bilingualBlock(i * 2000, i * 2000 + 1000));
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

  it("英語の割合が 50% なら、日本語と英語を交互に表示する", () => {
    const plan = createMazePlan({
      blocks: manyBlocks(6),
      englishRatio: 0.5,
      random: () => 0,
    });

    expect(plan.map((segment) => segment.lang)).toEqual(["ja", "en", "ja", "en", "ja", "en"]);
  });

  it("英語の割合が 20% なら、5 ブロックに 1 回だけ英語にする", () => {
    const plan = createMazePlan({
      blocks: manyBlocks(10),
      englishRatio: 0.2,
      random: () => 0,
    });

    expect(plan.map((segment) => segment.lang)).toEqual([
      "ja", "ja", "ja", "ja", "en",
      "ja", "ja", "ja", "ja", "en",
    ]);
  });

  it("どのブロックから英語にするかは、乱数で毎回ずらす", () => {
    const plan = createMazePlan({
      blocks: manyBlocks(5),
      englishRatio: 0.2,
      random: () => 0.5,
    });

    expect(plan.map((segment) => segment.lang)).toEqual(["ja", "ja", "en", "ja", "ja"]);
  });

  it("選んだ言語の字幕がないブロックは、もう一方の言語で表示する", () => {
    const hey: Cue = { startMs: 1000, endMs: 1500, text: "Hey!" };
    const sign: Cue = { startMs: 2000, endMs: 3000, text: "立入禁止" };
    const englishOnly: Block = { startMs: 1000, endMs: 1500, cues: { ja: [], en: [hey] } };
    const japaneseOnly: Block = { startMs: 2000, endMs: 3000, cues: { ja: [sign], en: [] } };

    expect(
      createMazePlan({ blocks: [englishOnly], englishRatio: 0, random: Math.random }),
    ).toEqual([{ startMs: 1000, endMs: 1500, lang: "en" }]);
    expect(
      createMazePlan({ blocks: [japaneseOnly], englishRatio: 1, random: Math.random }),
    ).toEqual([{ startMs: 2000, endMs: 3000, lang: "ja" }]);
  });
});
