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

// CC では 1 つの文が複数のキューに分かれるので、前のキューで文が終わったかを持ち回る
export function normalizeAllCaps(cues: Cue[]): Cue[] {
  let atSentenceStart = true;
  return cues.map((cue) => {
    const isAllCaps = !/[a-z]/.test(cue.text);
    const text = isAllCaps ? toSentenceCase(cue.text, atSentenceStart) : cue.text;
    atSentenceStart = /[.?!]$/.test(cue.text.trim());
    return { ...cue, text };
  });
}

function toSentenceCase(text: string, atSentenceStart: boolean): string {
  return text
    .toLowerCase()
    .replace(/\bi\b/g, "I")
    .replace(/(^-?|[.?!]\s+-?)([a-z])/g, (match, before: string, letter: string) =>
      before === "" && !atSentenceStart ? match : before + letter.toUpperCase(),
    );
}
