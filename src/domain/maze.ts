import { groupIntoBlocks } from "./blocks";
import { normalizeAllCaps, removeSoundDescriptions } from "./captions";
import { byReadingOrder, byVerticalPosition, type Cue } from "./cue";
import type { Lang } from "./lang";
import { createMazePlan, type Segment } from "./maze-plan";
import { selectCues } from "./select-cues";
import { contains } from "./time-range";

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
  return remaze({ tracks: cleaned, plan: [] }, options);
}

export function subtitleTextAt(maze: Maze, timeMs: number): string {
  return selectCues(maze.plan, maze.tracks, timeMs)
    .toSorted(byVerticalPosition)
    .map((cue) => cue.text)
    .join("\n");
}

// 取得済みの字幕はそのままに、表示する言語の計画だけを作り直す（英語の割合を変えたときなど）
export function remaze(maze: Maze, options: MazeOptions): Maze {
  return {
    tracks: maze.tracks,
    plan: createMazePlan({ blocks: groupIntoBlocks(maze.tracks), ...options }),
  };
}

// 指定した時刻を含むブロックの日英を入れ替える（分からない英文の意味を確かめるときなど）。
// もう一方の言語の字幕がないブロックは、入れ替えると何も出なくなるのでそのままにする
export function toggleLangAt(maze: Maze, timeMs: number): Maze {
  const index = maze.plan.findIndex((segment) => contains(segment, timeMs));
  const segment = maze.plan[index];
  if (!segment) return maze;
  const other: Lang = segment.lang === "en" ? "ja" : "en";
  const hasOther = maze.tracks[other].some(
    (cue) => cue.startMs < segment.endMs && segment.startMs < cue.endMs,
  );
  if (!hasOther) return maze;
  return { tracks: maze.tracks, plan: maze.plan.with(index, { ...segment, lang: other }) };
}
