// Netflix の動画の上に重ねて、maze した字幕を表示する要素
export function createOverlay(doc: Document): HTMLElement {
  const overlay = doc.createElement("div");
  overlay.dataset.mazelix = "subtitle";
  Object.assign(overlay.style, {
    position: "absolute",
    left: "50%",
    bottom: "10%",
    // Netflix 標準の字幕のように、操作パネルの出し入れに合わせてなめらかに上下させる
    transition: "bottom 0.2s ease-out",
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

const USUAL_BOTTOM = 0.1;
const GAP_ABOVE_CONTROLS = 0.02;

// 字幕の下端を、動画の下端から何 px 上げるか。
// 再生バーなどの操作パネルが出ているときは、パネルの上端（controlsTop）より上に上げる
export function subtitleBottom(
  player: { bottom: number; height: number },
  controlsTop: number | undefined,
): number {
  const usual = player.height * USUAL_BOTTOM;
  if (controlsTop === undefined) return usual;
  return Math.max(usual, player.bottom - controlsTop + player.height * GAP_ABOVE_CONTROLS);
}
