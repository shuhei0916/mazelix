import type { Lang } from "../domain/lang";

// Netflix のマニフェストの result.textTracks の要素（使うフィールドだけ）
export type TextTrack = {
  language: string | null;
  trackType: string;
  isForcedNarrative: boolean;
  isNoneTrack: boolean;
};

export function selectTextTracks(
  tracks: TextTrack[],
): Record<Lang, TextTrack | undefined> {
  return { ja: selectTrack(tracks, "ja"), en: selectTrack(tracks, "en") };
}

// 強制字幕は除き、CC（ASSISTIVE）より普通の字幕（PRIMARY）を優先する
function selectTrack(tracks: TextTrack[], language: Lang): TextTrack | undefined {
  const candidates = tracks.filter(
    (track) => track.language === language && !track.isForcedNarrative,
  );
  return candidates.find((track) => track.trackType === "PRIMARY") ?? candidates[0];
}
