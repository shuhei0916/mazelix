// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { createOverlay, subtitleBottom, updateOverlay } from "./overlay";

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
