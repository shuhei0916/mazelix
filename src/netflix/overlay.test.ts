// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { createOverlay, isPointerOnWord, subtitleBottom, updateOverlay } from "./overlay";

describe("updateOverlay", () => {
  it("字幕の文字を表示する", () => {
    const overlay = createOverlay(document);

    updateOverlay(overlay, "走れ！");

    expect(overlay.textContent).toBe("走れ！");
    expect(overlay.hidden).toBe(false);
  });
});

describe("updateOverlay（表示する字幕がないとき）", () => {
  it("空文字なら、オーバーレイを隠す", () => {
    const overlay = createOverlay(document);
    updateOverlay(overlay, "走れ！");

    updateOverlay(overlay, "");

    expect(overlay.hidden).toBe(true);
  });

  it("隠したあとに字幕が来たら、また表示する", () => {
    const overlay = createOverlay(document);
    updateOverlay(overlay, "");

    updateOverlay(overlay, "待って");

    expect(overlay.hidden).toBe(false);
    expect(overlay.textContent).toBe("待って");
  });
});

describe("updateOverlay（毎フレーム呼ばれるため）", () => {
  it("同じ字幕のままなら、DOM を書き換えない", () => {
    const overlay = createOverlay(document);
    updateOverlay(overlay, "走れ！");
    const textNode = overlay.firstChild;

    updateOverlay(overlay, "走れ！");

    expect(overlay.firstChild).toBe(textNode);
  });
});

describe("subtitleBottom（字幕の下端を、動画の下端から何 px 上げるか）", () => {
  const player = { bottom: 612, height: 612 };

  it("操作パネルが出ていなければ、動画の高さの 10% 上に表示する", () => {
    expect(subtitleBottom(player, undefined)).toBeCloseTo(61.2);
  });

  it("操作パネルが出ていれば、パネルの上端より少し上に表示する", () => {
    // パネルの上端が 505px なら、動画の下端から 107px。そこから動画の高さの 2% あける
    expect(subtitleBottom(player, 505)).toBeCloseTo(107 + 12.24);
  });

  it("操作パネルが低く、ふだんの位置と重ならないなら、ふだんの位置のまま", () => {
    expect(subtitleBottom(player, 600)).toBeCloseTo(61.2);
  });
});

describe("updateOverlay（英語の字幕の単語）", () => {
  const words = (overlay: HTMLElement) =>
    [...overlay.querySelectorAll<HTMLElement>("[data-mazelix-word]")].map((word) => word.textContent);

  it("英語の字幕は、単語ごとの要素に分けて描画する", () => {
    const overlay = createOverlay(document);

    updateOverlay(overlay, "Run, Jim!", "en");

    expect(words(overlay)).toEqual(["Run", "Jim"]);
    expect(overlay.textContent).toBe("Run, Jim!");
  });

  it("日本語の字幕は、単語に分けない", () => {
    const overlay = createOverlay(document);

    updateOverlay(overlay, "走れ、ジム！", "ja");

    expect(words(overlay)).toEqual([]);
    expect(overlay.textContent).toBe("走れ、ジム！");
  });

  it("同じ文字でも言語が変われば、描画し直す", () => {
    const overlay = createOverlay(document);
    updateOverlay(overlay, "OK", "ja");

    updateOverlay(overlay, "OK", "en");

    expect(words(overlay)).toEqual(["OK"]);
  });
});

describe("単語のクリック", () => {
  function setUp() {
    const onWordClick = vi.fn();
    const player = document.createElement("div");
    const overlay = createOverlay(document, { onWordClick });
    player.append(overlay);
    document.body.append(player);
    updateOverlay(overlay, "Run, Jim!", "en");
    const jim = overlay.querySelectorAll<HTMLElement>("[data-mazelix-word]")[1];
    if (!jim) throw new Error("単語の要素がない");
    return { onWordClick, player, jim };
  }

  it("単語をクリックすると、その単語を知らせる", () => {
    const { onWordClick, jim } = setUp();

    jim.click();

    expect(onWordClick).toHaveBeenCalledWith("Jim", jim);
  });

  it("単語の操作は Netflix のプレイヤーに伝えない（再生・一時停止や全画面が切り替わらないように）", () => {
    const { player, jim } = setUp();
    const netflix = vi.fn();
    for (const type of ["pointerdown", "pointerup", "mousedown", "mouseup", "click", "dblclick"]) {
      player.addEventListener(type, netflix);
      jim.dispatchEvent(new MouseEvent(type, { bubbles: true }));
    }

    expect(netflix).not.toHaveBeenCalled();
  });
});

describe("isPointerOnWord（単語を狙っている間は、字幕を動かさないため）", () => {
  it("マウスが単語に乗っている間だけ true", () => {
    const player = document.createElement("div");
    const overlay = createOverlay(document);
    player.append(overlay);
    updateOverlay(overlay, "Run, Jim!", "en");
    const jim = overlay.querySelectorAll<HTMLElement>("[data-mazelix-word]")[1];
    if (!jim) throw new Error("単語の要素がない");

    jim.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
    expect(isPointerOnWord(overlay)).toBe(true);

    jim.dispatchEvent(new MouseEvent("pointerout", { bubbles: true, relatedTarget: player }));
    expect(isPointerOnWord(overlay)).toBe(false);
  });
});

describe("単語のハイライト（どの単語を引くのか分かるように）", () => {
  function setUp() {
    const player = document.createElement("div");
    const overlay = createOverlay(document);
    player.append(overlay);
    updateOverlay(overlay, "Run, Jim!", "en");
    const [run, jim] = overlay.querySelectorAll<HTMLElement>("[data-mazelix-word]");
    if (!run || !jim) throw new Error("単語の要素がない");
    return { player, run, jim };
  }

  it("マウスが乗っている単語だけをハイライトする", () => {
    const { run, jim } = setUp();

    jim.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));

    expect(jim.dataset.mazelixHover).toBe("");
    expect(jim.style.background).not.toBe("");
    expect(run.dataset.mazelixHover).toBeUndefined();
    expect(run.style.background).toBe("");
  });

  it("マウスが単語から離れたら、ハイライトを消す", () => {
    const { player, jim } = setUp();
    jim.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));

    jim.dispatchEvent(new MouseEvent("pointerout", { bubbles: true, relatedTarget: player }));

    expect(jim.dataset.mazelixHover).toBeUndefined();
    expect(jim.style.background).toBe("");
  });

  it("隣の単語に移ったら、ハイライトも移る", () => {
    const { run, jim } = setUp();
    run.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));

    run.dispatchEvent(new MouseEvent("pointerout", { bubbles: true, relatedTarget: jim }));
    jim.dispatchEvent(new MouseEvent("pointerover", { bubbles: true, relatedTarget: run }));

    expect(run.dataset.mazelixHover).toBeUndefined();
    expect(jim.dataset.mazelixHover).toBe("");
  });
});
