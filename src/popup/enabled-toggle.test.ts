// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { mountEnabledToggle } from "./enabled-toggle";

function fakeSettings(initial: boolean) {
  const saved: boolean[] = [];
  return {
    saved,
    settings: {
      get: async () => initial,
      set: async (enabled: boolean) => {
        saved.push(enabled);
      },
    },
  };
}

describe("mountEnabledToggle", () => {
  it("保存されている ON/OFF を、チェックボックスに反映する", async () => {
    const container = document.createElement("div");

    await mountEnabledToggle(container, fakeSettings(false).settings);

    expect(container.querySelector("input")?.checked).toBe(false);
  });

  it("チェックボックスを切り替えたら保存する", async () => {
    const container = document.createElement("div");
    const { settings, saved } = fakeSettings(true);
    await mountEnabledToggle(container, settings);
    const checkbox = container.querySelector("input")!;

    checkbox.checked = false;
    checkbox.dispatchEvent(new Event("change"));

    expect(saved).toEqual([false]);
  });
});
