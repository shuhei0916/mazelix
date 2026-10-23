import { storage } from "wxt/utils/storage";

const englishRatio = storage.defineItem<number>("local:englishRatio", { fallback: 0.5 });
const enabled = storage.defineItem<boolean>("local:enabled", { fallback: true });

export async function getEnglishRatio(): Promise<number> {
  return englishRatio.getValue();
}

export async function setEnglishRatio(ratio: number): Promise<void> {
  if (Number.isNaN(ratio)) return;
  await englishRatio.setValue(Math.min(1, Math.max(0, ratio)));
}

export function watchEnglishRatio(callback: (ratio: number) => void): () => void {
  return englishRatio.watch((ratio) => callback(ratio));
}

export async function getEnabled(): Promise<boolean> {
  return enabled.getValue();
}

export async function setEnabled(value: boolean): Promise<void> {
  await enabled.setValue(value);
}

export function watchEnabled(callback: (enabled: boolean) => void): () => void {
  return enabled.watch((value) => callback(value));
}
