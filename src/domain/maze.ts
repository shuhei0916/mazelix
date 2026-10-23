import { groupIntoBlocks } from "./blocks";
import { normalizeAllCaps, removeSoundDescriptions } from "./captions";
import type { Cue } from "./cue";
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
  const cleaned = {
    ja: tracks.ja,
    en: normalizeAllCaps(removeSoundDescriptions(tracks.en)),
  };
  return {
    tracks: cleaned,
    plan: createMazePlan({ blocks: groupIntoBlocks(cleaned), ...options }),
  };
}

export function subtitleTextAt(maze: Maze, timeMs: number): string {
  return selectCues(maze.plan, maze.tracks, timeMs)
    .map((cue) => cue.text)
    .join("\n");
}
