import { contains, type TimeRange } from "./time-range";

export type Cue = TimeRange & {
  text: string;
};

export function findActiveCues(track: Cue[], timeMs: number): Cue[] {
  return track.filter((cue) => contains(cue, timeMs));
}
