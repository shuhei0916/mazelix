type EnabledSettings = {
  get(): Promise<boolean>;
  set(enabled: boolean): Promise<void>;
};

// mazelix の ON/OFF を切り替えるチェックボックス。OFF の間は Netflix 標準の字幕に戻る
export async function mountEnabledToggle(
  container: HTMLElement,
  settings: EnabledSettings,
): Promise<void> {
  const doc = container.ownerDocument;
  const label = doc.createElement("label");
  const checkbox = doc.createElement("input");
  checkbox.type = "checkbox";
  label.append(checkbox, "日英を混ぜて表示する");
  container.append(label);

  checkbox.checked = await settings.get();
  checkbox.addEventListener("change", () => {
    void settings.set(checkbox.checked);
  });
}
