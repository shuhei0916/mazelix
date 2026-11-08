// 見出し語（小文字）から意味を引く。意味は「 / 」区切りで複数ある。辞書になければ undefined
export type Dictionary = (headword: string) => string | undefined;

export type Definition = { headword: string; senses: string[] };

// 「goの過去」「child の複数形」のような、不規則変化の説明から元の形を取り出す
const INFLECTION_NOTE = /^([a-z][a-z'-]*)\s*の(?:過去|複数|現在分詞|三人称|比較|最上)/;

const VOWEL = /[aeiou]/;

// 字幕の単語を辞書で引く。見つからなければ空の一覧。
// 辞書（EJDict）には、規則変化した形（keys・watched など）はほとんど載っていないので元の形でも引き、
// 不規則変化した形（went など）は「goの過去」のような説明だけなので、元の形の意味も一緒に返す
export function lookUp(dictionary: Dictionary, word: string): Definition[] {
  const headword = word.toLowerCase().replaceAll("’", "'");
  // 所有格や短縮形の 's（women's、it's）は、辞書にないことが多いので除いて引く
  if (headword.endsWith("'s") && dictionary(headword) === undefined) {
    return lookUp(dictionary, headword.slice(0, -2));
  }
  const definitions: Definition[] = [];
  const add = (headword: string) => {
    if (definitions.some((definition) => definition.headword === headword)) return;
    const meaning = dictionary(headword);
    if (meaning === undefined) return;
    const senses = meaning.split(" / ");
    definitions.push({ headword, senses });
    for (const sense of senses) {
      const base = INFLECTION_NOTE.exec(sense)?.[1];
      if (base !== undefined && dictionary(base) !== undefined) {
        if (!definitions.some((definition) => definition.headword === base)) {
          definitions.push({ headword: base, senses: dictionary(base)?.split(" / ") ?? [] });
        }
      }
    }
  };

  add(headword);
  // その形が辞書にあるときは、名詞の evening → even のような取り違えを減らすため、
  // 動詞の変化（-ed・-ing）だけを元に戻して引く
  const exists = definitions.length > 0;
  const base = baseFormCandidates(headword, { verbOnly: exists }).find(
    (candidate) => dictionary(candidate) !== undefined,
  );
  if (base !== undefined) add(base);
  return definitions;
}

// 規則変化した形から、元の形の候補を、ありそうな順に並べる
export function baseFormCandidates(word: string, { verbOnly = false } = {}): string[] {
  const candidates: string[] = [];
  const strip = (suffix: string) => (word.endsWith(suffix) ? word.slice(0, -suffix.length) : undefined);

  // -ed・-ing・-er・-est: 子音を重ねた形（stopped → stop）、e で終わる形（hoping → hope）、そのまま（watched → watch）
  const suffixes = verbOnly ? ["ed", "ing"] : ["ed", "ing", "er", "est"];
  for (const suffix of suffixes) {
    const stem = strip(suffix);
    if (stem === undefined || stem.length < 2 || !VOWEL.test(stem)) continue;
    const last = stem.at(-1) ?? "";
    // 2 文字の語幹は取り違えやすい（using → us、need → ne）ので、ありそうな形だけにする:
    // doing → do、going → go と、using → use、aged → age、died → die
    if (stem.length === 2) {
      const endsWithVowel = VOWEL.test(last);
      if (suffix === "ing" && endsWithVowel) candidates.push(stem);
      else if (!endsWithVowel || last === "i") candidates.push(`${stem}e`);
      continue;
    }
    if (suffix !== "ing" && last === "i") candidates.push(`${stem.slice(0, -1)}y`); // studied → study、happier → happy
    if (last === stem.at(-2) && !VOWEL.test(last) && !"lsz".includes(last)) {
      // 子音を重ねた形: stopped → stop、putting → put。ただし added → add のように、もともと重なっている語もある
      const single = stem.slice(0, -1);
      if (endsWithConsonantVowelConsonant(single)) candidates.push(single, stem);
      else candidates.push(stem, single);
      continue;
    }
    // 子音・母音・子音で終わる短い語幹（hop）は、重ねていないので e で終わる形（hope）を先に試す
    if (endsWithConsonantVowelConsonant(stem)) candidates.push(`${stem}e`, stem);
    else candidates.push(stem, `${stem}e`);
  }
  if (verbOnly) return candidates;

  // -ly: happily → happy、eventually → eventual、basically → basic
  const ly = strip("ly");
  if (ly !== undefined && ly.length >= 3) {
    if (ly.endsWith("i")) candidates.push(`${ly.slice(0, -1)}y`);
    candidates.push(ly);
    if (ly.endsWith("al")) candidates.push(ly.slice(0, -2));
  }

  // -s・-es・-ies
  const ies = strip("ies");
  if (ies !== undefined && ies.length >= 2) candidates.push(`${ies}y`);
  const es = strip("es");
  // goes → go、boxes → box、watches → watch。uses → us のような短い語は取り違えるので除く
  if (es !== undefined && (/o$/.test(es) || (es.length >= 3 && /(s|x|z|ch|sh)$/.test(es)))) {
    candidates.push(es);
  }
  const s = strip("s");
  if (s !== undefined && s.length >= 3 && !s.endsWith("s")) candidates.push(s);
  return candidates;
}

function endsWithConsonantVowelConsonant(stem: string): boolean {
  return /[^aeiou][aeiou][^aeiouwxy]$/.test(stem);
}
