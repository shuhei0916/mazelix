import { extractMovieId, extractTextTracks } from "../src/netflix/manifest";
import { textTracksMessage } from "../src/netflix/messages";

// ページ側（MAIN world）で動き、Netflix がマニフェストを JSON.parse したときに
// 字幕トラックの一覧を拡張側の content script へ渡す。リクエストは書き換えない。
export default defineContentScript({
  matches: ["https://www.netflix.com/*"],
  world: "MAIN",
  runAt: "document_start",
  main() {
    const originalParse = JSON.parse;
    JSON.parse = function (this: unknown, text: string, reviver?: Parameters<typeof JSON.parse>[1]) {
      const value = originalParse.call(this, text, reviver);
      try {
        const textTracks = extractTextTracks(value);
        if (textTracks) {
          window.postMessage(
            textTracksMessage(textTracks, extractMovieId(value)),
            window.location.origin,
          );
        }
      } catch {
        // Netflix の動作を妨げないよう、mazelix 側の失敗は握りつぶす
      }
      return value;
    } as typeof JSON.parse;
  },
});
