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
};

// 誤差拡散: ブロックごとに英語の割合を足していき、1 に達したら英語にする。
// 割合どおりに英語が均等に散らばる（50% なら日英が交互、20% なら 5 ブロックに 1 回）。
// 乱数は、どのブロックから数え始めるかをずらすためだけに使う。
export function createMazePlan({
  blocks,
  englishRatio,
  random,
}: MazePlanOptions): Segment[] {
  let accumulated = random();
  return blocks.map(({ startMs, endMs, cues }) => {
    accumulated += englishRatio;
    // 0.2 を 5 回足しても浮動小数点の誤差で 1 にわずかに届かないことがあるので、少しだけ余裕を持たせる
    const chosen: Lang = accumulated >= 1 - 1e-9 ? "en" : "ja";
    if (chosen === "en") accumulated -= 1;
    const other: Lang = chosen === "en" ? "ja" : "en";
    return { startMs, endMs, lang: cues[chosen].length > 0 ? chosen : other };
  });
}
