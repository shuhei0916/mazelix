import type { Cue } from "./cue";

const SOUND_DESCRIPTION = /\[[^\]]*\]\s*/g;
const SPEAKER_DASHES_ONLY = /^[-\s]*$/;

// 聴覚障害者向け字幕（CC）の [grunts] のような効果音の説明を取り除き、
// セリフが残らなかったキューは捨てる
export function removeSoundDescriptions(cues: Cue[]): Cue[] {
  return cues
    .map((cue) => ({ ...cue, text: cue.text.replace(SOUND_DESCRIPTION, "").trim() }))
    .filter((cue) => !SPEAKER_DASHES_ONLY.test(cue.text));
}
