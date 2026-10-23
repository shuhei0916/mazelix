import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import {
  getEnabled,
  getEnglishRatio,
  setEnabled,
  setEnglishRatio,
  watchEnabled,
  watchEnglishRatio,
} from "./settings";

describe("英語の割合の設定", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("まだ保存していなければ 50% にする", async () => {
    expect(await getEnglishRatio()).toBe(0.5);
  });
});

describe("英語の割合の設定（保存）", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("保存した割合を読み出せる", async () => {
    await setEnglishRatio(0.2);

    expect(await getEnglishRatio()).toBe(0.2);
  });

  it("0 未満や 1 より大きい値は、0〜1 に収めて保存する", async () => {
    await setEnglishRatio(1.5);
    expect(await getEnglishRatio()).toBe(1);

    await setEnglishRatio(-0.1);
    expect(await getEnglishRatio()).toBe(0);
  });

  it("数値でない値は保存しない", async () => {
    await setEnglishRatio(0.3);

    await setEnglishRatio(Number.NaN);

    expect(await getEnglishRatio()).toBe(0.3);
  });
});

describe("英語の割合の設定（変更の監視）", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("ポップアップで割合を変えたら、再生中の画面に新しい割合を知らせる", async () => {
    const received: number[] = [];
    const unwatch = watchEnglishRatio((ratio) => received.push(ratio));

    await setEnglishRatio(0.8);
    unwatch();
    await setEnglishRatio(0.1);

    expect(received).toEqual([0.8]);
  });
});

describe("mazelix の ON/OFF の設定", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("まだ保存していなければ ON にする", async () => {
    expect(await getEnabled()).toBe(true);
  });

  it("OFF にしたら OFF のまま保存される", async () => {
    await setEnabled(false);

    expect(await getEnabled()).toBe(false);
  });

  it("ポップアップで切り替えたら、再生中の画面に知らせる", async () => {
    const received: boolean[] = [];
    const unwatch = watchEnabled((enabled) => received.push(enabled));

    await setEnabled(false);
    unwatch();
    await setEnabled(true);

    expect(received).toEqual([false]);
  });
});
