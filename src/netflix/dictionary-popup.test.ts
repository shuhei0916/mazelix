// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { createDictionaryPopup, popupPosition, showDefinitions } from "./dictionary-popup";

describe("showDefinitions", () => {
  it("見出し語と、意味の一覧を表示する", () => {
    const popup = createDictionaryPopup(document, { onClose: () => {} });

    showDefinitions(popup, "Run", [{ headword: "run", senses: ["『走る』,駆ける", "〈人が〉『急ぐ』"] }]);

    expect(popup.hidden).toBe(false);
    expect(popup.querySelector("[data-mazelix-headword]")?.textContent).toBe("run");
    expect([...popup.querySelectorAll("li")].map((li) => li.textContent)).toEqual([
      "『走る』,駆ける",
      "〈人が〉『急ぐ』",
    ]);
  });

  it("辞書にない単語なら、そう伝える", () => {
    const popup = createDictionaryPopup(document, { onClose: () => {} });

    showDefinitions(popup, "Kowalski", []);

    expect(popup.textContent).toContain("「Kowalski」は辞書にありません");
  });

  it("閉じるボタンで閉じる", () => {
    const onClose = vi.fn();
    const popup = createDictionaryPopup(document, { onClose });
    showDefinitions(popup, "Run", []);

    popup.querySelector<HTMLElement>("[data-mazelix-close]")?.click();

    expect(onClose).toHaveBeenCalled();
  });

  it("辞書の操作は Netflix のプレイヤーに伝えない", () => {
    const player = document.createElement("div");
    const popup = createDictionaryPopup(document, { onClose: () => {} });
    player.append(popup);
    const netflix = vi.fn();
    for (const type of ["pointerdown", "mousedown", "click", "dblclick"]) {
      player.addEventListener(type, netflix);
      popup.dispatchEvent(new MouseEvent(type, { bubbles: true }));
    }

    expect(netflix).not.toHaveBeenCalled();
  });
});

describe("popupPosition（辞書を、クリックした単語の上に出す）", () => {
  const player = { left: 0, top: 0, right: 1000, bottom: 600, width: 1000, height: 600 };

  it("単語の真上に、少し間をあけて出す", () => {
    const word = { left: 480, right: 520, top: 500 };

    expect(popupPosition(word, player, 300)).toEqual({ left: 350, bottom: 108 });
  });

  it("画面の端からはみ出さないようにする", () => {
    expect(popupPosition({ left: 10, right: 50, top: 500 }, player, 300).left).toBe(0);
    expect(popupPosition({ left: 950, right: 990, top: 500 }, player, 300).left).toBe(700);
  });
});
