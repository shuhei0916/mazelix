import type { Lang } from "../domain/lang";
import { splitWords } from "../domain/words";

export type OverlayOptions = {
  // 英語の字幕の単語がクリックされたとき
  onWordClick?: (word: string, element: HTMLElement) => void;
};

// Netflix のプレイヤーは、クリックで再生・一時停止、ダブルクリックで全画面を切り替える
export const POINTER_EVENTS = ["pointerdown", "pointerup", "mousedown", "mouseup", "click", "dblclick"];

// マウスが単語に乗っているオーバーレイ
const pointerOnWord = new WeakSet<HTMLElement>();

const wordOf = (target: EventTarget | null) =>
  target instanceof Element ? target.closest<HTMLElement>("[data-mazelix-word]") : null;

const isWord = (target: EventTarget | null) => wordOf(target) !== null;

// マウスが乗っている単語を目立たせ、どの単語を引くのか分かるようにする
function highlight(word: HTMLElement, on: boolean): void {
  if (on) {
    word.dataset.mazelixHover = "";
    Object.assign(word.style, { background: "rgba(255, 255, 255, 0.3)", borderRadius: "0.15em" });
  } else {
    delete word.dataset.mazelixHover;
    Object.assign(word.style, { background: "", borderRadius: "" });
  }
}

// マウスが英語の字幕の単語に乗っているか（クリックしようとしている単語を動かさないため）
export function isPointerOnWord(overlay: HTMLElement): boolean {
  return pointerOnWord.has(overlay);
}

// Netflix の動画の上に重ねて、maze した字幕を表示する要素
export function createOverlay(doc: Document, { onWordClick }: OverlayOptions = {}): HTMLElement {
  const overlay = doc.createElement("div");
  overlay.dataset.mazelix = "subtitle";
  Object.assign(overlay.style, {
    // 位置（left・bottom・maxWidth）は、動画の位置に合わせて毎フレーム決める
    position: "fixed",
    // Netflix 標準の字幕のように、操作パネルの出し入れに合わせてなめらかに上下させる
    transition: "bottom 0.2s ease-out",
    transform: "translateX(-50%)",
    zIndex: "2147483647",
    color: "white",
    textAlign: "center",
    whiteSpace: "pre-line",
    textShadow: "0 0 4px black, 0 0 2px black",
    fontFamily: "sans-serif",
    lineHeight: "1.3",
    // 単語以外の場所の操作は、下の Netflix のプレイヤーに届ける
    pointerEvents: "none",
  });
  overlay.hidden = true;
  // 単語の操作は Netflix のプレイヤーに伝えない
  for (const type of POINTER_EVENTS) {
    overlay.addEventListener(type, (event) => {
      event.stopPropagation();
      const word = (event.target as HTMLElement).closest<HTMLElement>("[data-mazelix-word]");
      if (type === "click" && word?.textContent) onWordClick?.(word.textContent, word);
    });
  }
  overlay.addEventListener("pointerover", (event) => {
    const word = wordOf(event.target);
    if (!word) return;
    pointerOnWord.add(overlay);
    highlight(word, true);
  });
  overlay.addEventListener("pointerout", (event) => {
    const word = wordOf(event.target);
    if (word && wordOf(event.relatedTarget) !== word) highlight(word, false);
    if (!isWord(event.relatedTarget)) pointerOnWord.delete(overlay);
  });
  return overlay;
}

export function updateOverlay(overlay: HTMLElement, text: string, lang?: Lang): void {
  const rendered = `${lang}:${text}`;
  if (overlay.dataset.rendered === rendered) return;
  overlay.dataset.rendered = rendered;
  // 描き直すと、マウスが乗っていた単語の要素はなくなる
  pointerOnWord.delete(overlay);
  overlay.hidden = text === "";
  if (lang !== "en") {
    overlay.textContent = text;
    return;
  }
  const doc = overlay.ownerDocument;
  overlay.replaceChildren(
    ...splitWords(text).map(({ text, isWord }) => {
      if (!isWord) return doc.createTextNode(text);
      const word = doc.createElement("span");
      word.dataset.mazelixWord = "";
      word.textContent = text;
      Object.assign(word.style, { pointerEvents: "auto", cursor: "pointer" });
      return word;
    }),
  );
}

const USUAL_BOTTOM = 0.1;
const GAP_ABOVE_CONTROLS = 0.02;

// 字幕の下端を、動画の下端から何 px 上げるか。
// 再生バーなどの操作パネルが出ているときは、パネルの上端（controlsTop）より上に上げる
export function subtitleBottom(
  player: { bottom: number; height: number },
  controlsTop: number | undefined,
): number {
  const usual = player.height * USUAL_BOTTOM;
  if (controlsTop === undefined) return usual;
  return Math.max(usual, player.bottom - controlsTop + player.height * GAP_ABOVE_CONTROLS);
}
