// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { parseTickTime, parseTtml } from "./ttml";

// Netflix の IMSC 1.1 字幕と同じ構造の TTML を組み立てる（文章は自作）
function ttml(body: string, { tickRate = 10_000_000, styles = "" } = {}): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<tt xmlns="http://www.w3.org/ns/ttml" xmlns:ttp="http://www.w3.org/ns/ttml#parameter" xmlns:tts="http://www.w3.org/ns/ttml#styling" ttp:tickRate="${tickRate}" ttp:timeBase="media" xml:lang="ja">
<head>
<styling>
<style xml:id="style0" tts:textAlign="center"/>
${styles}
</styling>
</head>
<body>
<div>
${body}
</div>
</body>
</tt>`;
}

describe("parseTickTime", () => {
  it("tick 表記の時刻を、tickRate を使ってミリ秒に変換する", () => {
    expect(parseTickTime("64650000t", 10_000_000)).toBe(6465);
  });

  it("ミリ秒未満は四捨五入する", () => {
    expect(parseTickTime("32952502t", 10_000_000)).toBe(3295);
    expect(parseTickTime("32957502t", 10_000_000)).toBe(3296);
  });
});

describe("parseTtml", () => {
  it("<p> をキューに変換する", () => {
    const xml = ttml(
      `<p xml:id="subtitle1" begin="10000000t" end="25000000t" region="region0" style="style0">走れ！</p>`,
    );

    expect(parseTtml(xml)).toEqual([{ startMs: 1000, endMs: 2500, text: "走れ！" }]);
  });

  it("複数の <p> を、出てくる順にキューに変換する", () => {
    const xml = ttml(
      `<p begin="10000000t" end="25000000t" style="style0">走れ！</p>
<p begin="30000000t" end="42000000t" style="style0">待って</p>`,
    );

    expect(parseTtml(xml)).toEqual([
      { startMs: 1000, endMs: 2500, text: "走れ！" },
      { startMs: 3000, endMs: 4200, text: "待って" },
    ]);
  });

  it("<tt> の ttp:tickRate を使って時刻を変換する", () => {
    const xml = ttml(`<p begin="1000t" end="2500t" style="style0">走れ！</p>`, {
      tickRate: 1000,
    });

    expect(parseTtml(xml)).toEqual([{ startMs: 1000, endMs: 2500, text: "走れ！" }]);
  });

  it("&quot; などのエンティティを文字に戻す", () => {
    const xml = ttml(`<p begin="0t" end="10000000t" style="style0">&quot;止まれ&quot;</p>`);

    expect(parseTtml(xml)[0]?.text).toBe('"止まれ"');
  });

  it("<br/> を改行に変換する", () => {
    const xml = ttml(`<p begin="0t" end="10000000t" style="style0">一緒に<br/>来て</p>`);

    expect(parseTtml(xml)[0]?.text).toBe("一緒に\n来て");
  });
});
