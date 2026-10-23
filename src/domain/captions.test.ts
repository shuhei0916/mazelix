import { describe, expect, it } from "vitest";
import { normalizeAllCaps, removeSoundDescriptions } from "./captions";

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

describe("normalizeAllCaps", () => {
  it("大文字だけのキューを、文頭だけ大文字にする", () => {
    expect(normalizeAllCaps([cue("PARKOUR!")])).toEqual([cue("Parkour!")]);
  });

  it("一人称の I は大文字のままにする", () => {
    expect(normalizeAllCaps([cue("NOW I KNOW WHAT I'M DOING.")])).toEqual([
      cue("Now I know what I'm doing."),
    ]);
  });

  it("1 つのキューに複数の文があれば、それぞれの文頭を大文字にする", () => {
    expect(normalizeAllCaps([cue("STOP. WHERE ARE YOU GOING? COME BACK!")])).toEqual([
      cue("Stop. Where are you going? Come back!"),
    ]);
  });

  it("前のキューが文の途中で終わっていれば、次のキューは小文字で始める", () => {
    expect(normalizeAllCaps([cue("I DON'T THINK WE SHOULD"), cue("GO IN THERE.")])).toEqual([
      cue("I don't think we should"),
      cue("go in there."),
    ]);
  });

  it("話者を示す - の後ろは、新しい文として大文字で始める", () => {
    expect(normalizeAllCaps([cue("WHERE ARE YOU"), cue("-WAIT!")])).toEqual([
      cue("Where are you"),
      cue("-Wait!"),
    ]);
  });

  it("小文字を含むキューは、大文字だけではないので変更しない", () => {
    expect(normalizeAllCaps([cue("Hello, Megamind.")])).toEqual([cue("Hello, Megamind.")]);
  });
});
