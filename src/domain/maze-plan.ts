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

export function createMazePlan({
  blocks,
  englishRatio,
  random,
}: MazePlanOptions): Segment[] {
  return blocks.map(({ startMs, endMs }) => ({
    startMs,
    endMs,
    lang: random() < englishRatio ? "en" : "ja",
  }));
}
