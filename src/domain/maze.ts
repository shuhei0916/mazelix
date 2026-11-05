import { type Block, groupIntoBlocks } from "./blocks";
import { normalizeAllCaps, removeSoundDescriptions } from "./captions";
import { byReadingOrder, byVerticalPosition, type Cue } from "./cue";
import type { Lang } from "./lang";
import { englishDifficulty, type WordFrequency } from "./difficulty";
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
  // 英単語の頻度。あれば、簡単な英文のブロックから順に英語にする
  wordFrequency?: WordFrequency;
};

export function prepareMaze(tracks: Record<Lang, Cue[]>, options: MazeOptions): Maze {
  // TTML 内の並び順は読む順とは限らない（CC の 2 行が下の行から並ぶことがある）
  const ja = tracks.ja.toSorted(byReadingOrder);
  const en = tracks.en.toSorted(byReadingOrder);
  const cleaned = { ja, en: normalizeAllCaps(removeSoundDescriptions(en)) };
  return remaze({ tracks: cleaned, plan: [] }, options);
}

// 表示する字幕の文字と、その言語。表示する字幕がなければ空文字
export function subtitleAt(maze: Maze, timeMs: number): { text: string; lang: Lang | undefined } {
  const text = subtitleTextAt(maze, timeMs);
  const lang = maze.plan.find((segment) => contains(segment, timeMs))?.lang;
  return { text, lang: text === "" ? undefined : lang };
}

export function subtitleTextAt(maze: Maze, timeMs: number): string {
  return selectCues(maze.plan, maze.tracks, timeMs)
    .toSorted(byVerticalPosition)
    .map((cue) => cue.text)
    .join("\n");
}

// 取得済みの字幕はそのままに、表示する言語の計画だけを作り直す（英語の割合を変えたときなど）
export function remaze(maze: Maze, { englishRatio, random, wordFrequency }: MazeOptions): Maze {
  const difficulty = wordFrequency
    ? (block: Block) => englishDifficulty(block.cues.en.map((cue) => cue.text).join(" "), wordFrequency)
    : undefined;
  return {
    tracks: maze.tracks,
    plan: createMazePlan({ blocks: groupIntoBlocks(maze.tracks), englishRatio, random, difficulty }),
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

// これより短い間に「前へ」を押したら、今のセリフではなく 1 つ前のセリフへ戻る
const RESTART_GRACE_MS = 1000;

// 「前へ」で移る時刻。今のセリフが始まってしばらくたっていれば、今のセリフの先頭に戻る
export function previousSentenceStart(maze: Maze, timeMs: number): number | undefined {
  return sentenceStarts(maze).findLast((startMs) => startMs <= timeMs - RESTART_GRACE_MS);
}

// 「次へ」で移る時刻
export function nextSentenceStart(maze: Maze, timeMs: number): number | undefined {
  return sentenceStarts(maze).find((startMs) => startMs > timeMs);
}

// 移る先は、表示中の言語の字幕 1 枚ずつの先頭。ブロックは会話が続くと 1 分近くになり、
// ブロック単位では戻りすぎる。同じ時刻に始まる 2 行の字幕は 1 枚として扱う
function sentenceStarts(maze: Maze): number[] {
  const starts = maze.plan.flatMap((segment) =>
    maze.tracks[segment.lang]
      .filter((cue) => contains(segment, cue.startMs))
      .map((cue) => cue.startMs),
  );
  return [...new Set(starts)].sort((a, b) => a - b);
}
