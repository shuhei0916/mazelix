export type Cue = {
  startMs: number;
  endMs: number;
  text: string;
};

// 開始時刻は含み、終了時刻は含まない
function isActiveAt(cue: Cue, timeMs: number): boolean {
  return cue.startMs <= timeMs && timeMs < cue.endMs;
}

export function findActiveCues(track: Cue[], timeMs: number): Cue[] {
  return track.filter((cue) => isActiveAt(cue, timeMs));
}
