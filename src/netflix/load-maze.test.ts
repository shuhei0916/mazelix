// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { subtitleTextAt } from "../domain/maze";
import { loadMaze } from "./load-maze";
import { ttml } from "./ttml.fixture";

function textTrack(language: string, url?: string) {
  return {
    language,
    trackType: "PRIMARY",
    isForcedNarrative: false,
    isNoneTrack: false,
    downloadables: url ? { "imsc1.1": { isImage: false, urls: [{ url }] } } : {},
  };
}

const files: Record<string, string> = {
  "https://cdn/ja": ttml(`<p begin="10000000t" end="20000000t" style="style0">走れ！</p>`),
  "https://cdn/en": ttml(`<p begin="10000000t" end="20000000t" style="style0">RUN!</p>`),
};

async function fetcher(url: string) {
  const body = files[url];
  return { ok: body !== undefined, text: async () => body ?? "" };
}

describe("loadMaze", () => {
  it("日英の字幕を取得して、maze を作る", async () => {
    const maze = await loadMaze(
      [textTrack("ko", "https://cdn/ko"), textTrack("ja", "https://cdn/ja"), textTrack("en", "https://cdn/en")],
      fetcher,
      { englishRatio: 1, random: Math.random },
    );

    expect(maze && subtitleTextAt(maze, 1500)).toBe("Run!");
  });

  it("日本語か英語の字幕トラックがなければ、maze を作らない", async () => {
    const maze = await loadMaze([textTrack("ja", "https://cdn/ja")], fetcher, {
      englishRatio: 1,
      random: Math.random,
    });

    expect(maze).toBeUndefined();
  });

  it("文字の字幕（IMSC 1.1）がなければ、maze を作らない", async () => {
    const maze = await loadMaze([textTrack("ja", "https://cdn/ja"), textTrack("en")], fetcher, {
      englishRatio: 1,
      random: Math.random,
    });

    expect(maze).toBeUndefined();
  });
});
