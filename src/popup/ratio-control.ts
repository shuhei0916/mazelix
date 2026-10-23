type RatioSettings = {
  get(): Promise<number>;
  set(ratio: number): Promise<void>;
};

// 英語の割合を 0〜100% のスライダーで設定する
export async function mountRatioControl(
  container: HTMLElement,
  settings: RatioSettings,
): Promise<void> {
  const doc = container.ownerDocument;
  const label = doc.createElement("label");
  label.textContent = "英語の割合";
  const slider = doc.createElement("input");
  Object.assign(slider, { type: "range", min: "0", max: "100", step: "5" });
  const output = doc.createElement("output");
  label.append(slider, output);
  container.append(label);

  const show = (percent: number) => {
    slider.value = String(percent);
    output.textContent = `${percent}%`;
  };
  show(Math.round((await settings.get()) * 100));

  slider.addEventListener("input", () => {
    const percent = Number(slider.value);
    show(percent);
    void settings.set(percent / 100);
  });
}
