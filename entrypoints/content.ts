// Netflix はページを再読み込みせずに画面を切り替える（SPA）ため、
// /watch/* だけでなく netflix.com 全体で content script を動かす
export default defineContentScript({
  matches: ["*://*.netflix.com/*"],
  main() {
    const badge = document.createElement("div");
    badge.textContent = "mazelix が動いています";
    Object.assign(badge.style, {
      position: "fixed",
      top: "8px",
      right: "8px",
      zIndex: "2147483647",
      padding: "4px 8px",
      background: "rgba(0, 0, 0, 0.7)",
      color: "white",
      font: "12px sans-serif",
      borderRadius: "4px",
      pointerEvents: "none",
    });
    document.body.append(badge);
  },
});
