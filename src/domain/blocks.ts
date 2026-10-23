import type { Cue } from "./cue";
import type { Lang } from "./lang";
import type { TimeRange } from "./time-range";

export type Block = TimeRange & {
  cues: Record<Lang, Cue[]>;
};

// 日英どちらかの字幕が途切れずに表示されている範囲を 1 つのブロックにまとめる。
// ブロックの間は字幕が出ていないので、そこで言語を切り替えても字幕が途中で切れない。
export function groupIntoBlocks(tracks: Record<Lang, Cue[]>): Block[] {
  const tagged = [
    ...tracks.ja.map((cue) => ({ lang: "ja" as const, cue })),
    ...tracks.en.map((cue) => ({ lang: "en" as const, cue })),
  ].sort((a, b) => a.cue.startMs - b.cue.startMs);

  const blocks: Block[] = [];
  for (const { lang, cue } of tagged) {
    const current = blocks.at(-1);
    if (current && cue.startMs < current.endMs) {
      current.endMs = Math.max(current.endMs, cue.endMs);
      current.cues[lang].push(cue);
    } else {
      blocks.push({
        startMs: cue.startMs,
        endMs: cue.endMs,
        cues: { ja: [], en: [], [lang]: [cue] },
      });
    }
  }
  return blocks;
}
