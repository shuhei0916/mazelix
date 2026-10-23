import { describe, expect, it } from "vitest";
import { type Cue, findActiveCue } from "./cue";

describe("findActiveCue", () => {
  const hello: Cue = { startMs: 1000, endMs: 3000, text: "こんにちは" };
  const howAreYou: Cue = { startMs: 4000, endMs: 6000, text: "元気ですか" };
  const track = [hello, howAreYou];

  it("指定した時刻に表示中のキューを返す", () => {
    expect(findActiveCue(track, 5000)).toEqual(howAreYou);
    expect(findActiveCue(track, 2000)).toEqual(hello);
  });

  it("指定した時刻に表示中のキューがなければ undefined を返す", () => {
    expect(findActiveCue(track, 500)).toBeUndefined();
    expect(findActiveCue(track, 3500)).toBeUndefined();
    expect(findActiveCue(track, 7000)).toBeUndefined();
  });

  it("キューの開始時刻ちょうどでは表示する", () => {
    expect(findActiveCue(track, 1000)).toEqual(hello);
  });

  it("キューの終了時刻ちょうどでは表示しない", () => {
    expect(findActiveCue(track, 3000)).toBeUndefined();
  });
});
