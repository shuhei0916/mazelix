import type { Definition } from "../domain/dictionary";
import { POINTER_EVENTS } from "./overlay";

// クリックした単語と辞書の間をあける px
const GAP = 8;

// 英語の字幕の単語をクリックしたときに、その単語の意味を表示する要素
export function createDictionaryPopup(doc: Document, { onClose }: { onClose: () => void }): HTMLElement {
  const popup = doc.createElement("div");
  popup.dataset.mazelix = "dictionary";
  Object.assign(popup.style, {
    position: "absolute",
    zIndex: "2147483647",
    boxSizing: "border-box",
    maxWidth: "min(480px, 90%)",
    maxHeight: "45%",
    overflowY: "auto",
    padding: "0.6em 0.9em",
    borderRadius: "6px",
    background: "rgba(20, 20, 20, 0.94)",
    color: "white",
    fontFamily: "sans-serif",
    lineHeight: "1.5",
    textAlign: "left",
  });
  popup.hidden = true;
  // 辞書を読んだりスクロールしたりする操作は、Netflix のプレイヤーに伝えない
  for (const type of POINTER_EVENTS) popup.addEventListener(type, (event) => event.stopPropagation());
  popup.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).closest("[data-mazelix-close]")) onClose();
  });
  return popup;
}

export function showDefinitions(popup: HTMLElement, word: string, definitions: Definition[]): void {
  const doc = popup.ownerDocument;
  const element = (tag: string, style: Partial<CSSStyleDeclaration>, text = "") => {
    const created = doc.createElement(tag);
    Object.assign(created.style, style);
    created.textContent = text;
    return created;
  };
  const close = element("button", {
    float: "right",
    marginLeft: "0.5em",
    border: "none",
    background: "none",
    color: "inherit",
    font: "inherit",
    cursor: "pointer",
  }, "×");
  close.dataset.mazelixClose = "";
  close.setAttribute("aria-label", "閉じる");

  const body =
    definitions.length === 0
      ? [element("p", { margin: "0" }, `「${word}」は辞書にありません`)]
      : definitions.flatMap(({ headword, senses }) => {
          const heading = element("div", { fontWeight: "bold", marginBottom: "0.2em" }, headword);
          heading.dataset.mazelixHeadword = "";
          const list = element("ol", { margin: "0 0 0.4em", paddingLeft: "1.4em" });
          list.append(...senses.map((sense) => element("li", {}, sense)));
          return [heading, list];
        });
  popup.replaceChildren(close, ...body);
  popup.hidden = false;
}

type Rect = { left: number; right: number; top: number };

// 辞書の位置（プレイヤーの左端・下端からの px）。クリックした単語の真上に出し、
// プレイヤーの左右からはみ出さないようにする
export function popupPosition(
  word: Rect,
  player: Rect & { bottom: number; width: number },
  popupWidth: number,
): { left: number; bottom: number } {
  const center = (word.left + word.right) / 2 - player.left;
  const left = Math.min(Math.max(center - popupWidth / 2, 0), player.width - popupWidth);
  return { left, bottom: player.bottom - word.top + GAP };
}
