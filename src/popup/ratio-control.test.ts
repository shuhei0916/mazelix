// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { mountRatioControl } from "./ratio-control";

function fakeSettings(initial: number) {
  const saved: number[] = [];
  return {
    saved,
    settings: {
      get: async () => initial,
      set: async (ratio: number) => {
        saved.push(ratio);
      },
    },
  };
}

describe("mountRatioControl", () => {
  it("保存されている英語の割合を、スライダーと % 表示に反映する", async () => {
    const container = document.createElement("div");
    const { settings } = fakeSettings(0.2);

    await mountRatioControl(container, settings);

    expect(container.querySelector("input")?.value).toBe("20");
    expect(container.querySelector("output")?.textContent).toBe("20%");
  });
});

describe("mountRatioControl（スライダーを動かしたとき）", () => {
  it("英語の割合を保存し、% 表示を更新する", async () => {
    const container = document.createElement("div");
    const { settings, saved } = fakeSettings(0.5);
    await mountRatioControl(container, settings);
    const slider = container.querySelector("input")!;

    slider.value = "70";
    slider.dispatchEvent(new Event("input"));

    expect(saved).toEqual([0.7]);
    expect(container.querySelector("output")?.textContent).toBe("70%");
  });
});
