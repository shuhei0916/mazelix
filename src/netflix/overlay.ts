// Netflix の動画の上に重ねて、maze した字幕を表示する要素
export function createOverlay(doc: Document): HTMLElement {
  const overlay = doc.createElement("div");
  overlay.dataset.mazelix = "subtitle";
  Object.assign(overlay.style, {
    position: "absolute",
    left: "50%",
    bottom: "10%",
    transform: "translateX(-50%)",
    zIndex: "2147483647",
    maxWidth: "80%",
    color: "white",
    textAlign: "center",
    whiteSpace: "pre-line",
    textShadow: "0 0 4px black, 0 0 2px black",
    fontFamily: "sans-serif",
    lineHeight: "1.3",
    pointerEvents: "none",
  });
  overlay.hidden = true;
  return overlay;
}

export function updateOverlay(overlay: HTMLElement, text: string): void {
  if (overlay.textContent === text) return;
  overlay.textContent = text;
  overlay.hidden = text === "";
}
