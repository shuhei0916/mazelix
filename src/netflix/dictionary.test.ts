import { describe, expect, it } from "vitest";
import ejdict from "../../public/dictionary/ejdict.txt?raw";
import { loadOnce, parseDictionary } from "./dictionary";

describe("parseDictionary", () => {
  it("1 行に見出し語（カンマ区切りで複数）とタブ、意味が並ぶ", () => {
    const dictionary = parseDictionary("# credits\ncolor,colour\t『色』,色彩\nRun\t『走る』\n");

    expect(dictionary("color")).toBe("『色』,色彩");
    expect(dictionary("colour")).toBe("『色』,色彩");
    expect(dictionary("run")).toBe("『走る』");
    expect(dictionary("kowalski")).toBeUndefined();
  });

  it("同じ見出し語が複数の行にあれば、意味をつなげる", () => {
    const dictionary = parseDictionary("fine\t罰金\nfine\t『りっぱな』\n");

    expect(dictionary("fine")).toBe("罰金 / 『りっぱな』");
  });
});

describe("同梱した辞書（EJDict）", () => {
  const dictionary = parseDictionary(ejdict);

  it("よく使う単語や、不規則変化の形を引ける", () => {
    expect(dictionary("run")).toContain("走る");
    expect(dictionary("went")).toBe("goの過去");
  });
});

describe("loadOnce（辞書は 4MB あるので、初めて引くときに 1 回だけ読む）", () => {
  it("何度引いても、読み込むのは 1 回だけ", async () => {
    let loads = 0;
    const load = loadOnce(async () => {
      loads++;
      return "run\t『走る』\n";
    });

    await Promise.all([load(), load()]);
    const dictionary = await load();

    expect(loads).toBe(1);
    expect(dictionary("run")).toBe("『走る』");
  });

  it("読み込みに失敗したら、次に引くときに読み込み直す", async () => {
    let loads = 0;
    const load = loadOnce(async () => {
      loads++;
      if (loads === 1) throw new Error("ネットワークエラー");
      return "run\t『走る』\n";
    });

    await expect(load()).rejects.toThrow();
    const dictionary = await load();

    expect(dictionary("run")).toBe("『走る』");
  });
});
