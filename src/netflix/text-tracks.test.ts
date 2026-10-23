import { describe, expect, it } from "vitest";
import { type TextTrack, selectTextTracks } from "./text-tracks";

function track(overrides: Partial<TextTrack>): TextTrack {
  return {
    language: "ja",
    trackType: "PRIMARY",
    isForcedNarrative: false,
    isNoneTrack: false,
    ...overrides,
  };
}

describe("selectTextTracks", () => {
  it("日本語と英語のトラックを選ぶ", () => {
    const ja = track({ language: "ja" });
    const en = track({ language: "en" });
    const ko = track({ language: "ko" });

    expect(selectTextTracks([ko, ja, en])).toEqual({ ja, en });
  });

  it("強制字幕は選ばない", () => {
    const forced = track({ language: "ja", isForcedNarrative: true });
    const ja = track({ language: "ja" });

    expect(selectTextTracks([forced, ja]).ja).toBe(ja);
  });

  it("CC（ASSISTIVE）より普通の字幕（PRIMARY）を優先する", () => {
    const cc = track({ language: "en", trackType: "ASSISTIVE" });
    const en = track({ language: "en", trackType: "PRIMARY" });

    expect(selectTextTracks([cc, en]).en).toBe(en);
  });

  it("CC しかなければ CC を選ぶ", () => {
    const cc = track({ language: "en", trackType: "ASSISTIVE" });

    expect(selectTextTracks([cc]).en).toBe(cc);
  });

  it("その言語のトラックがなければ undefined にする", () => {
    expect(selectTextTracks([track({ language: "ko" })])).toEqual({
      ja: undefined,
      en: undefined,
    });
  });
});
