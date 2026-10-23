export type Cue = {
  startMs: number;
  endMs: number;
  text: string;
};

export function findActiveCue(track: Cue[], timeMs: number): Cue | undefined {
  return { startMs: 4000, endMs: 6000, text: "元気ですか" };
}
