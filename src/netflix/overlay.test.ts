// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { createOverlay, updateOverlay } from "./overlay";

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
