import { describe, expect, it } from "vitest";
import { type Dictionary, lookUp } from "./dictionary";

const entries: Record<string, string> = {
  run: "『走る』,駆ける / 〈人が〉(…に)『急ぐ』",
  "don't": "do notの短縮形",
  key: "『かぎ』",
  watch: "『じっと見る』",
  study: "『勉強』",
  studied: "熟慮した",
  stop: "『止める』",
  hope: "『望む』",
  make: "『作る』",
  big: "『大きい』",
  happy: "『幸福な』",
  large: "『大きい』",
  box: "『箱』",
  go: "『行く』",
  went: "goの過去",
  child: "『子供』",
  children: "child の複数形",
  saw: "seeの過去 / 『のこぎり』",
  see: "『見る』",
  eventual: "『結果として起こる』",
  basic: "『基本の』",
  woman: "『女性』",
  women: "woman の複数形",
  it: "『それは』",
  today: "『今日』",
  // 取り違えやすい短い語
  hop: "ぴょんと跳ぶ",
  us: "『私たちを』",
  use: "『使う』",
  ad: "広告",
  add: "『加える』",
  put: "『置く』",
  putt: "パットする",
  dy: "（取り違えの例）",
  die: "『死ぬ』",
  ag: "（取り違えの例）",
  age: "『年齢』",
  do: "『する』",
  ne: "（取り違えの例）",
  need: "『必要』",
  fee: "『料金』",
  feed: "『食物を与える』",
};
const dictionary: Dictionary = (headword) => entries[headword];
const headwords = (word: string) => lookUp(dictionary, word).map(({ headword }) => headword);

describe("lookUp", () => {
  it("単語の見出しと、意味の一覧を返す", () => {
    expect(lookUp(dictionary, "run")).toEqual([
      { headword: "run", senses: ["『走る』,駆ける", "〈人が〉(…に)『急ぐ』"] },
    ]);
  });

  it("大文字・小文字や、アポストロフィの種類を区別しない", () => {
    expect(lookUp(dictionary, "Run")).toEqual(lookUp(dictionary, "run"));
    expect(lookUp(dictionary, "Don’t")).toEqual([{ headword: "don't", senses: ["do notの短縮形"] }]);
  });

  it("辞書にない単語なら、空の一覧を返す", () => {
    expect(lookUp(dictionary, "Kowalski")).toEqual([]);
  });
});

describe("lookUp（規則変化した単語は、元の形で引く）", () => {
  it.each([
    ["keys", "key"],
    ["boxes", "box"],
    ["studies", "study"],
    ["watches", "watch"],
    ["watched", "watch"],
    ["hoped", "hope"],
    ["stopped", "stop"],
    ["watching", "watch"],
    ["hoping", "hope"],
    ["stopping", "stop"],
    ["bigger", "big"],
    ["biggest", "big"],
    ["happier", "happy"],
    ["happiest", "happy"],
    ["larger", "large"],
    ["hoping", "hope"],
    ["using", "use"],
    ["aged", "age"],
    ["added", "add"],
    ["putting", "put"],
    ["died", "die"],
    ["doing", "do"],
    ["eventually", "eventual"],
    ["happily", "happy"],
    ["basically", "basic"],
  ])("%s → %s", (word, base) => {
    expect(headwords(word)).toEqual([base]);
  });

  it("変化した形も辞書にあれば、その形の意味と元の形の意味を両方返す", () => {
    expect(headwords("studied")).toEqual(["studied", "study"]);
  });

  it.each([
    ["need", "ne"],
    ["feed", "fee"],
  ])("-ed で終わるだけの単語（%s）を、%s の変化とみなさない", (word) => {
    expect(headwords(word)).toEqual([word]);
  });

  it("元の形として辞書にない語幹は返さない", () => {
    expect(headwords("Kowalskis")).toEqual([]);
  });
});

describe("lookUp（'s が付いた単語は、's を除いて引く）", () => {
  it.each([
    ["it's", ["it"]],
    ["Today’s", ["today"]],
    ["women's", ["women", "woman"]],
  ])("%s", (word, expected) => {
    expect(headwords(word)).toEqual(expected);
  });
});

describe("lookUp（不規則変化の説明が出たら、元の形の意味も返す）", () => {
  it("「goの過去」なら、go の意味も返す", () => {
    expect(headwords("went")).toEqual(["went", "go"]);
  });

  it("「child の複数形」のように、間に空白があっても元の形を引く", () => {
    expect(headwords("children")).toEqual(["children", "child"]);
  });

  it("説明のほかに意味がある単語でも、元の形の意味を返す", () => {
    expect(headwords("saw")).toEqual(["saw", "see"]);
  });
});
