import { describe, expect, it } from "vitest";
import { removeSoundDescriptions } from "./captions";

const cue = (text: string) => ({ startMs: 0, endMs: 1000, text });

describe("removeSoundDescriptions", () => {
  it("効果音の説明（[...]）だけのキューを取り除く", () => {
    expect(removeSoundDescriptions([cue("[grunts]"), cue("RUN!")])).toEqual([cue("RUN!")]);
  });

  it("セリフの前にある効果音の説明を取り除く", () => {
    expect(removeSoundDescriptions([cue("[sighs] LET'S GO.")])).toEqual([cue("LET'S GO.")]);
  });

  it("話者を示す先頭の - は残し、その後ろの効果音の説明を取り除く", () => {
    expect(removeSoundDescriptions([cue("-[gasps] NO WAY!")])).toEqual([cue("-NO WAY!")]);
  });

  it("効果音の説明を除いて - だけになったキューも取り除く", () => {
    expect(removeSoundDescriptions([cue("-[laughs]")])).toEqual([]);
  });
});
