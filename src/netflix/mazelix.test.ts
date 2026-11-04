// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { setEnglishRatio } from "../settings";
import { startMazelix } from "./mazelix";
import { textTracksMessage } from "./messages";
import { ttml } from "./ttml.fixture";

// 1〜2 秒にセリフが 1 つだけあるエピソード
const episodes: Record<number, { ja: string; en: string }> = {
  1: { ja: "走れ！", en: "Run!" },
  2: { ja: "止まれ！", en: "Stop!" },
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
  const text = episodes[Number(movieId)]?.[language as "ja" | "en"];
  const body = text && ttml(`<p begin="10000000t" end="20000000t" style="style0">${text}</p>`);
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

  const unwatch = startMazelix({
    window,
    fetcher,
    random: () => 0,
    onMessage: (listener) => window.addEventListener("message", listener),
    onKeyDown: (listener) => window.addEventListener("keydown", listener, { capture: true }),
    onAnimationFrame: (callback) => {
      nextFrame = callback;
    },
  });

  return {
    unwatch,
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
    page.unwatch();
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
    page.unwatch();
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
