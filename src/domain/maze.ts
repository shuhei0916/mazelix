import { groupIntoBlocks } from "./blocks";
import { normalizeAllCaps, removeSoundDescriptions } from "./captions";
import { byReadingOrder, byVerticalPosition, type Cue } from "./cue";
import type { Lang } from "./lang";
import { createMazePlan, type Segment } from "./maze-plan";
import { selectCues } from "./select-cues";

export type Maze = {
  tracks: Record<Lang, Cue[]>;
  plan: Segment[];
};

export type MazeOptions = {
  englishRatio: number;
  random: () => number;
};

export function prepareMaze(tracks: Record<Lang, Cue[]>, options: MazeOptions): Maze {
  // TTML 内の並び順は読む順とは限らない（CC の 2 行が下の行から並ぶことがある）
  const ja = tracks.ja.toSorted(byReadingOrder);
  const en = tracks.en.toSorted(byReadingOrder);
  const cleaned = { ja, en: normalizeAllCaps(removeSoundDescriptions(en)) };
  return {
    tracks: cleaned,
    plan: createMazePlan({ blocks: groupIntoBlocks(cleaned), ...options }),
  };
}

export function subtitleTextAt(maze: Maze, timeMs: number): string {
  return selectCues(maze.plan, maze.tracks, timeMs)
    .toSorted(byVerticalPosition)
    .map((cue) => cue.text)
    .join("\n");
}
