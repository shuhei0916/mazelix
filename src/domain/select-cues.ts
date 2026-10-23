import { type Cue, findActiveCues } from "./cue";
import type { Lang } from "./lang";
import type { Segment } from "./maze-plan";
import { contains } from "./time-range";

export function selectCues(
  plan: Segment[],
  tracks: Record<Lang, Cue[]>,
  timeMs: number,
): Cue[] {
  const segment = plan.find((segment) => contains(segment, timeMs));
  if (!segment) return [];
  return findActiveCues(tracks[segment.lang], timeMs);
}
