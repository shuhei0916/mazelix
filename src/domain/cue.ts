import { contains, type TimeRange } from "./time-range";

export type Cue = TimeRange & {
  text: string;
  // 画面上の縦位置（上端からの %）。同時に表示する複数行を上から並べるのに使う
  verticalPosition?: number;
};

export function findActiveCues(track: Cue[], timeMs: number): Cue[] {
  return track.filter((cue) => contains(cue, timeMs));
}

// 画面の上にある行が先。縦位置が分からなければ順番を変えない
export function byVerticalPosition(a: Cue, b: Cue): number {
  if (a.verticalPosition === undefined || b.verticalPosition === undefined) return 0;
  return a.verticalPosition - b.verticalPosition;
}

// 読む順（開始時刻順、同時に始まるなら上の行が先）
export function byReadingOrder(a: Cue, b: Cue): number {
  return a.startMs - b.startMs || byVerticalPosition(a, b);
}
