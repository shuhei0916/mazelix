export type Cue = {
  startMs: number;
  endMs: number;
  text: string;
};

export function findActiveCue(track: Cue[], timeMs: number): Cue | undefined {
  return track.find((cue) => cue.startMs <= timeMs && timeMs < cue.endMs);
}
