export type TimeRange = {
  startMs: number;
  endMs: number;
};

// 開始時刻は含み、終了時刻は含まない
export function contains(range: TimeRange, timeMs: number): boolean {
  return range.startMs <= timeMs && timeMs < range.endMs;
}
