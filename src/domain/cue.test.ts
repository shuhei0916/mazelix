import { describe, expect, it } from "vitest";
import { type Cue, findActiveCues } from "./cue";

describe("findActiveCues", () => {
  const hello: Cue = { startMs: 1000, endMs: 3000, text: "こんにちは" };
  const howAreYou: Cue = { startMs: 4000, endMs: 6000, text: "元気ですか" };
  const track = [hello, howAreYou];

  it("指定した時刻に表示中のキューを返す", () => {
    expect(findActiveCues(track, 5000)).toEqual([howAreYou]);
    expect(findActiveCues(track, 2000)).toEqual([hello]);
  });

  it("指定した時刻に表示中のキューがなければ空配列を返す", () => {
    expect(findActiveCues(track, 500)).toEqual([]);
    expect(findActiveCues(track, 3500)).toEqual([]);
    expect(findActiveCues(track, 7000)).toEqual([]);
  });

  it("キューの開始時刻ちょうどでは表示する", () => {
    expect(findActiveCues(track, 1000)).toEqual([hello]);
  });

  it("キューの終了時刻ちょうどでは表示しない", () => {
    expect(findActiveCues(track, 3000)).toEqual([]);
  });

  it("同時に表示中のキューが複数あれば、すべて返す", () => {
    const speakerA: Cue = { startMs: 1000, endMs: 4000, text: "-行こう" };
    const speakerB: Cue = { startMs: 2000, endMs: 4000, text: "-待って" };
    const later: Cue = { startMs: 5000, endMs: 6000, text: "どこへ？" };

    expect(findActiveCues([speakerA, speakerB, later], 3000)).toEqual([
      speakerA,
      speakerB,
    ]);
  });
});
