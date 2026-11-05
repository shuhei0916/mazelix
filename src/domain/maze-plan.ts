import type { Block } from "./blocks";
import type { Lang } from "./lang";
import type { TimeRange } from "./time-range";

export type Segment = TimeRange & {
  lang: Lang;
};

export type MazePlanOptions = {
  blocks: Block[];
  englishRatio: number;
  random: () => number;
  // ブロックの英文の難しさ（大きいほど難しい）。省略すると、どのブロックも同じ難しさとみなす
  difficulty?: (block: Block) => number;
};

// 英語にするブロックの数は、誤差拡散で決める: ブロックごとに英語の割合を足していき、
// 1 に達したら英語にする（50% なら日英が交互、20% なら 5 ブロックに 1 回）。
// どのブロックを英語にするかは、英文の簡単なブロックから順に選ぶ（初学者でも英語の割合を
// 下げれば、簡単な英文だけが英語になる）。難しさが同じブロックの間では、誤差拡散で選んだ
// ブロックを優先し、英語が均等に散らばるようにする。
// 乱数は、誤差拡散をどのブロックから数え始めるかをずらすためだけに使う。
export function createMazePlan({
  blocks,
  englishRatio,
  random,
  difficulty = () => 0,
}: MazePlanOptions): Segment[] {
  const spread = spreadEvenly(blocks.length, englishRatio, random());
  const count = spread.filter(Boolean).length;
  const english = new Set(
    blocks
      .map((block, index) => ({
        block,
        index,
        difficulty: difficulty(block),
        spread: spread[index] === true,
      }))
      .filter(({ block }) => block.cues.en.length > 0)
      .sort(
        (a, b) =>
          a.difficulty - b.difficulty || Number(b.spread) - Number(a.spread) || a.index - b.index,
      )
      .slice(0, count)
      .map(({ index }) => index),
  );
  return blocks.map(({ startMs, endMs, cues }, index) => {
    const chosen: Lang = english.has(index) ? "en" : "ja";
    const other: Lang = chosen === "en" ? "ja" : "en";
    return { startMs, endMs, lang: cues[chosen].length > 0 ? chosen : other };
  });
}

// 誤差拡散で、count 個のうちどれを英語にするかを返す
function spreadEvenly(count: number, englishRatio: number, start: number): boolean[] {
  let accumulated = start;
  return Array.from({ length: count }, () => {
    accumulated += englishRatio;
    // 0.2 を 5 回足しても浮動小数点の誤差で 1 にわずかに届かないことがあるので、少しだけ余裕を持たせる
    const english = accumulated >= 1 - 1e-9;
    if (english) accumulated -= 1;
    return english;
  });
}
