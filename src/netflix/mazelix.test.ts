// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { lookUp } from "../domain/dictionary";
import { setEnglishRatio } from "../settings";
import { startMazelix } from "./mazelix";
import { textTracksMessage } from "./messages";
import { ttml } from "./ttml.fixture";

// セリフは 1〜2 秒、3〜4 秒、…に 1 つずつある。エピソード 1・2 は 1〜2 秒のセリフだけ
const episodes: Record<number, { ja: string[]; en: string[] }> = {
  1: { ja: ["走れ！"], en: ["Run!"] },
  2: { ja: ["止まれ！"], en: ["Stop!"] },
  3: { ja: ["分からない", "可能性はほぼない"], en: ["I don't know.", "The probability is negligible."] },
};

// 英和辞書
const meanings: Record<string, string> = { run: "『走る』,駆ける / 〈人が〉『急ぐ』" };

// Zipf 尺度の英単語の頻度
const zipf: Record<string, number> = {
  i: 6.5,
  "don't": 6.2,
  know: 6.0,
  the: 7.7,
  is: 7.0,
  probability: 4.0,
  negligible: 3.4,
};

function textTracks(movieId: number) {
  return ["ja", "en"].map((language) => ({
    language,
    trackType: "PRIMARY",
    isForcedNarrative: false,
    isNoneTrack: false,
    downloadables: {
      "imsc1.1": { isImage: false, urls: [{ url: `https://cdn/${movieId}/${language}` }] },
    },
  }));
}

async function fetcher(url: string) {
  const [, movieId, language] = /^https:\/\/cdn\/(\d+)\/(ja|en)$/.exec(url) ?? [];
  const lines = episodes[Number(movieId)]?.[language as "ja" | "en"];
  const tick = (seconds: number) => `${seconds * 10000000}t`;
  const body =
    lines &&
    ttml(
      lines
        .map((text, i) => `<p begin="${tick(i * 2 + 1)}" end="${tick(i * 2 + 2)}" style="style0">${text}</p>`)
        .join(""),
    );
  return { ok: body !== undefined, text: async () => body ?? "" };
}

// Netflix のページの代わり。マニフェストを届け、URL を変え、フレームを進める
function netflixPage() {
  let nextFrame: (() => void) | undefined;
  const player = document.createElement("div");
  const video = document.createElement("video");
  Object.defineProperty(video, "currentTime", { value: 1.5, writable: true });
  player.append(video);
  document.body.append(player);
  // jsdom はレイアウトしないので、高さ 612px の動画の位置を決めておく
  vi.spyOn(player, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 1088, 612));
  // テストごとにイベントの待ち受けを外し、前のテストの mazelix が反応しないようにする
  const listening = new AbortController();
  const { signal } = listening;
  const seeks: number[] = [];

  const unwatch = startMazelix({
    window,
    fetcher,
    random: () => 0,
    onMessage: (listener) => window.addEventListener("message", listener, { signal }),
    onKeyDown: (listener) => window.addEventListener("keydown", listener, { capture: true, signal }),
    onAnimationFrame: (callback) => {
      nextFrame = callback;
    },
    seek: (timeMs) => seeks.push(timeMs),
    wordFrequency: (word) => zipf[word],
    lookUpWord: async (word) => lookUp((headword) => meanings[headword], word),
    onPointerDown: (listener) =>
      window.addEventListener("pointerdown", listener, { capture: true, signal }),
  });

  return {
    seeks,
    close() {
      unwatch();
      listening.abort();
    },
    playAt(seconds: number) {
      video.currentTime = seconds;
    },
    // Netflix は、操作パネルが出ている間だけパネルの要素を置く
    showControls(top: number) {
      const controls = document.createElement("div");
      controls.className = "watch-video--bottom-controls-container ltr-1jnlk6v";
      vi.spyOn(controls, "getBoundingClientRect").mockReturnValue(new DOMRect(0, top, 1088, 612 - top));
      player.append(controls);
    },
    hideControls() {
      document.querySelector(".watch-video--bottom-controls-container")?.remove();
    },
    frame() {
      nextFrame?.();
    },
    clickWord(word: string) {
      const element = [...document.querySelectorAll<HTMLElement>("[data-mazelix-word]")].find(
        (element) => element.textContent === word,
      );
      if (!element) throw new Error(`字幕に「${word}」がない`);
      element.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      element.click();
    },
    pointWord(word: string) {
      const element = [...document.querySelectorAll<HTMLElement>("[data-mazelix-word]")].find(
        (element) => element.textContent === word,
      );
      if (!element) throw new Error(`字幕に「${word}」がない`);
      element.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
    },
    clickOutside() {
      player.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      player.click();
    },
    open(pathname: string) {
      history.pushState(null, "", pathname);
    },
    receiveManifest(movieId: number) {
      const data = textTracksMessage(textTracks(movieId), movieId);
      window.dispatchEvent(new MessageEvent("message", { data, source: window }));
    },
    pressKey(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) {
      target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));
    },
    // 字幕の読み込みは非同期なので、表示が期待どおりになるまでフレームを進める
    async expectSubtitle(text: string) {
      await vi.waitFor(() => {
        nextFrame?.();
        expect(subtitle()).toBe(text);
      });
    },
  };
}

function subtitleOverlay(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-mazelix=subtitle]");
}

function subtitle(): string {
  const overlay = document.querySelector<HTMLElement>("[data-mazelix=subtitle]");
  return overlay && !overlay.hidden ? (overlay.textContent ?? "") : "";
}

describe("Netflix の再生ページで字幕を maze する", () => {
  let page: ReturnType<typeof netflixPage>;

  beforeEach(async () => {
    fakeBrowser.reset();
    vi.spyOn(console, "info").mockImplementation(() => {});
    await setEnglishRatio(0);
    page = netflixPage();
  });

  afterEach(() => {
    page.close();
    document.body.replaceChildren();
    document.head.replaceChildren();
    vi.restoreAllMocks();
  });

  it("再生中の作品のマニフェストが届くと、再生位置のセリフを表示する", async () => {
    page.open("/watch/1");
    page.receiveManifest(1);

    await page.expectSubtitle("走れ！");
  });

  it("英語の割合を変えると、表示中の字幕の言語も変わる", async () => {
    page.open("/watch/1");
    page.receiveManifest(1);
    await page.expectSubtitle("走れ！");

    await setEnglishRatio(1);

    await page.expectSubtitle("Run!");
  });

  it("再生中に次のエピソードへ進むと、先読みされていたマニフェストから字幕を読み込み直す", async () => {
    page.open("/watch/1");
    page.receiveManifest(1);
    page.receiveManifest(2);
    await page.expectSubtitle("走れ！");

    page.open("/watch/2");

    await page.expectSubtitle("止まれ！");
  });

  it("英語の割合が 50% なら、簡単な英文のセリフを英語にする", async () => {
    await setEnglishRatio(0.5);
    page.open("/watch/3");
    page.receiveManifest(3);
    await page.expectSubtitle("I don't know.");

    page.playAt(3.5);

    await page.expectSubtitle("可能性はほぼない");
  });

  it("作品一覧に戻ると、字幕を消す", async () => {
    page.open("/watch/1");
    page.receiveManifest(1);
    await page.expectSubtitle("走れ！");

    page.open("/browse");

    await page.expectSubtitle("");
  });
});

describe("w キーで、表示中のセリフの日英を入れ替える", () => {
  let page: ReturnType<typeof netflixPage>;

  beforeEach(async () => {
    fakeBrowser.reset();
    vi.spyOn(console, "info").mockImplementation(() => {});
    await setEnglishRatio(0);
    page = netflixPage();
    page.open("/watch/1");
    page.receiveManifest(1);
    await page.expectSubtitle("走れ！");
  });

  afterEach(() => {
    page.close();
    document.body.replaceChildren();
    document.head.replaceChildren();
    vi.restoreAllMocks();
  });

  it("w キーを押すと英語になり、もう一度押すと日本語に戻る", async () => {
    page.pressKey("w");
    await page.expectSubtitle("Run!");

    page.pressKey("w");
    await page.expectSubtitle("走れ！");
  });

  it("Ctrl などと一緒に押したときは入れ替えない（Ctrl+W でタブを閉じるときなど）", async () => {
    page.pressKey("w", { ctrlKey: true });
    page.pressKey("w", { altKey: true });
    page.pressKey("w", { metaKey: true });

    await page.expectSubtitle("走れ！");
  });

  it("入力欄に文字を打っているときは入れ替えない", async () => {
    const input = document.createElement("input");
    document.body.append(input);

    page.pressKey("w", {}, input);

    await page.expectSubtitle("走れ！");
  });

  it("日本語入力の変換中は入れ替えない", async () => {
    page.pressKey("w", { isComposing: true });

    await page.expectSubtitle("走れ！");
  });
});

describe("a / d キーで、前・次のセリフの先頭に移る", () => {
  let page: ReturnType<typeof netflixPage>;

  beforeEach(async () => {
    fakeBrowser.reset();
    vi.spyOn(console, "info").mockImplementation(() => {});
    await setEnglishRatio(0);
    page = netflixPage();
    page.open("/watch/1");
    page.receiveManifest(1);
    await page.expectSubtitle("走れ！");
  });

  afterEach(() => {
    page.close();
    document.body.replaceChildren();
    document.head.replaceChildren();
    vi.restoreAllMocks();
  });

  it("d キーで、次のセリフの先頭にシークする", () => {
    page.playAt(0.5);

    page.pressKey("d");

    expect(page.seeks).toEqual([1000]);
  });

  it("a キーで、聞き逃したセリフの先頭にシークする", () => {
    page.playAt(2.5);

    page.pressKey("a");

    expect(page.seeks).toEqual([1000]);
  });

  it("移る先のセリフがなければ、シークしない", () => {
    page.playAt(2.5);

    page.pressKey("d");

    expect(page.seeks).toEqual([]);
  });

  it("Ctrl などと一緒に押したときや、入力欄に文字を打っているときはシークしない", () => {
    const input = document.createElement("input");
    document.body.append(input);
    page.playAt(0.5);

    page.pressKey("d", { ctrlKey: true });
    page.pressKey("d", {}, input);

    expect(page.seeks).toEqual([]);
  });
});

describe("再生バーなどの操作パネルが出ているときは、字幕を上げて重ならないようにする", () => {
  let page: ReturnType<typeof netflixPage>;

  beforeEach(async () => {
    fakeBrowser.reset();
    vi.spyOn(console, "info").mockImplementation(() => {});
    await setEnglishRatio(0);
    page = netflixPage();
    page.open("/watch/1");
    page.receiveManifest(1);
    await page.expectSubtitle("走れ！");
  });

  afterEach(() => {
    page.close();
    document.body.replaceChildren();
    document.head.replaceChildren();
    vi.restoreAllMocks();
  });

  it("操作パネルが出ると、パネルの上端より上に字幕を上げる", () => {
    page.showControls(505);
    page.frame();

    expect(parseFloat(subtitleOverlay()?.style.bottom ?? "")).toBeGreaterThan(612 - 505);
  });

  it("単語にマウスを乗せている間は、操作パネルが消えても字幕を下げない（クリックしようとした単語が逃げないように）", async () => {
    await setEnglishRatio(1);
    await page.expectSubtitle("Run!");
    page.showControls(505);
    page.frame();
    const raised = parseFloat(subtitleOverlay()?.style.bottom ?? "");

    page.pointWord("Run");
    page.hideControls();
    page.frame();

    expect(parseFloat(subtitleOverlay()?.style.bottom ?? "")).toBe(raised);
  });

  it("単語にマウスを乗せていても、操作パネルが出たら字幕を上げる（パネルに単語が隠れないように）", async () => {
    await setEnglishRatio(1);
    await page.expectSubtitle("Run!");
    page.pointWord("Run");

    page.showControls(505);
    page.frame();

    expect(parseFloat(subtitleOverlay()?.style.bottom ?? "")).toBeGreaterThan(612 - 505);
  });

  it("操作パネルが消えると、字幕をふだんの位置に戻す", () => {
    page.showControls(505);
    page.frame();

    page.hideControls();
    page.frame();

    expect(parseFloat(subtitleOverlay()?.style.bottom ?? "")).toBeCloseTo(61.2);
  });
});

describe("英語の字幕の単語をクリックすると、その単語の意味を表示する", () => {
  let page: ReturnType<typeof netflixPage>;
  const dictionary = () => {
    const popup = document.querySelector<HTMLElement>("[data-mazelix=dictionary]");
    return popup && !popup.hidden ? (popup.textContent ?? "") : "";
  };

  beforeEach(async () => {
    fakeBrowser.reset();
    vi.spyOn(console, "info").mockImplementation(() => {});
    await setEnglishRatio(1);
    page = netflixPage();
    page.open("/watch/1");
    page.receiveManifest(1);
    await page.expectSubtitle("Run!");
  });

  afterEach(() => {
    page.close();
    document.body.replaceChildren();
    document.head.replaceChildren();
    vi.restoreAllMocks();
  });

  it("単語をクリックすると、辞書を表示する", async () => {
    page.clickWord("Run");

    await vi.waitFor(() => expect(dictionary()).toContain("『走る』,駆ける"));
  });

  it("同じ単語をもう一度クリックすると、辞書を閉じる", async () => {
    page.clickWord("Run");
    await vi.waitFor(() => expect(dictionary()).toContain("走る"));

    page.clickWord("Run");

    await vi.waitFor(() => expect(dictionary()).toBe(""));
  });

  it("辞書の外をクリックすると、辞書を閉じる", async () => {
    page.clickWord("Run");
    await vi.waitFor(() => expect(dictionary()).toContain("走る"));

    page.clickOutside();

    expect(dictionary()).toBe("");
  });

  it("辞書を開いている間は、操作パネルが消えても字幕を下げない", async () => {
    page.showControls(505);
    page.frame();
    const raised = parseFloat(subtitleOverlay()?.style.bottom ?? "");
    page.clickWord("Run");
    await vi.waitFor(() => expect(dictionary()).toContain("走る"));

    page.hideControls();
    page.frame();

    expect(parseFloat(subtitleOverlay()?.style.bottom ?? "")).toBe(raised);
  });

  it("作品一覧に戻ると、辞書も消す", async () => {
    page.clickWord("Run");
    await vi.waitFor(() => expect(dictionary()).toContain("走る"));

    page.open("/browse");
    page.frame();

    expect(dictionary()).toBe("");
  });
});
