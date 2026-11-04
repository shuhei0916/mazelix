import { startMazelix } from "../src/netflix/mazelix";
import { seekMessage } from "../src/netflix/messages";

// Netflix はページを再読み込みせずに画面を切り替える（SPA）ため、
// /watch/* だけでなく www.netflix.com 全体で content script を動かす。
// ページ側がマニフェストを渡す前に待ち受けを始めるよう、document_start で動かす
export default defineContentScript({
  matches: ["https://www.netflix.com/*"],
  runAt: "document_start",
  main(ctx) {
    const unwatch = startMazelix({
      window,
      fetcher: (url) => fetch(url),
      random: Math.random,
      onMessage: (listener) => ctx.addEventListener(window, "message", listener),
      // Netflix のプレイヤーがキーを先に受け取って止めてしまわないよう、キャプチャで受け取る
      onKeyDown: (listener) =>
        ctx.addEventListener(window, "keydown", listener, { capture: true }),
      onAnimationFrame: (callback) => ctx.requestAnimationFrame(callback),
      // Netflix プレイヤーの API はページ側からしか呼べないので、player-control に頼む
      seek: (timeMs) => window.postMessage(seekMessage(timeMs), location.origin),
    });
    ctx.onInvalidated(() => {
      try {
        unwatch();
      } catch {
        // 拡張機能の更新・再読み込みで無効になった古い content script からは
        // chrome.storage に触れられない。監視も一緒に無効になっているので無視してよい
      }
    });
  },
});
