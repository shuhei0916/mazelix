export type Lang = "ja" | "en";

export type Segment = {
  startMs: number;
  endMs: number;
  lang: Lang;
};

export type MazePlanOptions = {
  durationMs: number;
  segmentMs: number;
  englishRatio: number;
  random: () => number;
};

export function createMazePlan({
  durationMs,
  segmentMs,
  englishRatio,
  random,
}: MazePlanOptions): Segment[] {
  const plan: Segment[] = [];
  for (let startMs = 0; startMs < durationMs; startMs += segmentMs) {
    plan.push({
      startMs,
      endMs: Math.min(startMs + segmentMs, durationMs),
      lang: random() < englishRatio ? "en" : "ja",
    });
  }
  return plan;
}
