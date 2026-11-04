import { isSeekMessage } from "../src/netflix/messages";
import { seekNetflixPlayer } from "../src/netflix/player-api";

// ページ側（MAIN world）で動き、拡張側の content script に頼まれた操作を Netflix プレイヤーで行う。
// 拡張側（ISOLATED world）からはページの window.netflix に触れられない
export default defineContentScript({
  matches: ["https://www.netflix.com/*"],
  world: "MAIN",
  main() {
    window.addEventListener("message", (event) => {
      if (event.source !== window || !isSeekMessage(event.data)) return;
      if (!seekNetflixPlayer((window as { netflix?: unknown }).netflix, event.data.timeMs)) {
        console.warn("[mazelix] Netflix プレイヤーをシークできませんでした");
      }
    });
  },
});
