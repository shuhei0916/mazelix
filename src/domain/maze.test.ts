import { describe, expect, it } from "vitest";
import type { Cue } from "./cue";
import { prepareMaze, remaze, subtitleTextAt } from "./maze";

describe("字幕を maze する（シナリオ）", () => {
  // 日英で字幕の区切り方もタイミングも異なる、実際の字幕に近い例
  const en1: Cue = { startMs: 1000, endMs: 2000, text: "I don't think we should" };
  const en2: Cue = { startMs: 2000, endMs: 3200, text: "go in there." };
  const en3: Cue = { startMs: 4000, endMs: 5000, text: "Why not?" };
  const ja1: Cue = { startMs: 1100, endMs: 3000, text: "入らない方がいい" };
  const ja2: Cue = { startMs: 4100, endMs: 5200, text: "どうして？" };

  const maze = prepareMaze(
    { ja: [ja1, ja2], en: [en1, en2, en3] },
    // 英語の割合 50% で、1 つ目のブロックが英語になるように起点をずらす
    { englishRatio: 0.5, random: () => 0.5 },
  );
  const textAt = (timeMs: number) => subtitleTextAt(maze, timeMs);

  it("1 つ目のセリフは、英語の字幕だけを最後まで表示する", () => {
    expect(textAt(1050)).toBe("I don't think we should");
    expect(textAt(2500)).toBe("go in there.");
    expect(textAt(3100)).toBe("go in there.");
  });

  it("2 つ目のセリフは、日本語の字幕だけを最後まで表示する", () => {
    expect(textAt(4050)).toBe("");
    expect(textAt(4500)).toBe("どうして？");
    expect(textAt(5100)).toBe("どうして？");
  });

  it("セリフの間では、何も表示しない", () => {
    expect(textAt(3500)).toBe("");
  });
});

describe("prepareMaze", () => {
  it("英語 CC の効果音の説明を取り除き、大文字だけの英文を整える", () => {
    const maze = prepareMaze(
      {
        ja: [],
        en: [
          { startMs: 0, endMs: 1000, text: "[grunts]" },
          { startMs: 2000, endMs: 3000, text: "PARKOUR!" },
        ],
      },
      { englishRatio: 1, random: Math.random },
    );

    expect(subtitleTextAt(maze, 500)).toBe("");
    expect(subtitleTextAt(maze, 2500)).toBe("Parkour!");
  });

  it("ファイル内で 2 行の順番が逆でも、上の行から文が続くものとして大文字を整える", () => {
    const maze = prepareMaze(
      {
        ja: [],
        en: [
          { startMs: 0, endMs: 1000, text: "GOING?", verticalPosition: 84.62 },
          { startMs: 0, endMs: 1000, text: "WHERE ARE YOU", verticalPosition: 79.29 },
        ],
      },
      { englishRatio: 1, random: Math.random },
    );

    expect(subtitleTextAt(maze, 500)).toBe("Where are you\ngoing?");
  });
});

describe("subtitleTextAt", () => {
  it("同時に表示中の字幕が複数あれば、改行でつなぐ", () => {
    const maze = prepareMaze(
      {
        ja: [],
        en: [
          { startMs: 0, endMs: 1000, text: "Where are you" },
          { startMs: 0, endMs: 1000, text: "going?" },
        ],
      },
      { englishRatio: 1, random: Math.random },
    );

    expect(subtitleTextAt(maze, 500)).toBe("Where are you\ngoing?");
  });

  it("同時に表示中の字幕は、画面の上にある行から順に並べる", () => {
    const maze = prepareMaze(
      {
        ja: [],
        en: [
          { startMs: 0, endMs: 1000, text: "going?", verticalPosition: 84.62 },
          { startMs: 0, endMs: 1000, text: "Where are you", verticalPosition: 79.29 },
        ],
      },
      { englishRatio: 1, random: Math.random },
    );

    expect(subtitleTextAt(maze, 500)).toBe("Where are you\ngoing?");
  });
});

describe("remaze", () => {
  it("取得済みの字幕はそのままに、新しい英語の割合で計画を作り直す", () => {
    const tracks = {
      ja: [{ startMs: 0, endMs: 1000, text: "走れ！" }],
      en: [{ startMs: 0, endMs: 1000, text: "Run!" }],
    };
    const japaneseOnly = prepareMaze(tracks, { englishRatio: 0, random: Math.random });

    const englishOnly = remaze(japaneseOnly, { englishRatio: 1, random: Math.random });

    expect(subtitleTextAt(japaneseOnly, 500)).toBe("走れ！");
    expect(subtitleTextAt(englishOnly, 500)).toBe("Run!");
  });
});
