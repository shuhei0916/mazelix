import { type Maze, remaze, subtitleTextAt } from "../src/domain/maze";
import { loadMaze } from "../src/netflix/load-maze";
import { isForCurrentVideo } from "../src/netflix/manifest";
import { isTextTracksMessage } from "../src/netflix/messages";
import { createOverlay, updateOverlay } from "../src/netflix/overlay";
import { getEnglishRatio, watchEnglishRatio } from "../src/settings";

const HIDE_NETFLIX_SUBTITLES = ".player-timedtext, .image-based-timed-text { display: none !important; }";

// Netflix はページを再読み込みせずに画面を切り替える（SPA）ため、
// /watch/* だけでなく www.netflix.com 全体で content script を動かす。
// ページ側がマニフェストを渡す前に待ち受けを始めるよう、document_start で動かす
export default defineContentScript({
  matches: ["https://www.netflix.com/*"],
  runAt: "document_start",
  main(ctx) {
    let maze: Maze | undefined;
    let latestLoad = 0;
    const overlay = createOverlay(document);
    const hideNetflixSubtitles = document.createElement("style");
    hideNetflixSubtitles.textContent = HIDE_NETFLIX_SUBTITLES;

    // ポップアップで英語の割合が変わったら、再生中の字幕の計画を作り直す
    const unwatch = watchEnglishRatio((englishRatio) => {
      if (maze) maze = remaze(maze, { englishRatio, random: Math.random });
    });
    ctx.onInvalidated(() => {
      try {
        unwatch();
      } catch {
        // 拡張機能の更新・再読み込みで無効になった古い content script からは
        // chrome.storage に触れられない。監視も一緒に無効になっているので無視してよい
      }
    });

    ctx.addEventListener(window, "message", async (event: MessageEvent) => {
      if (event.source !== window || !isTextTracksMessage(event.data)) return;
      const { textTracks, movieId } = event.data;
      if (!isForCurrentVideo(movieId, location.pathname)) {
        console.info("[mazelix] 再生中の作品ではないマニフェストなので無視します", {
          movieId,
          pathname: location.pathname,
        });
        return;
      }
      console.info("[mazelix] 字幕を読み込みます", { movieId, pathname: location.pathname });
      const load = ++latestLoad;
      maze = undefined;
      try {
        const loaded = await loadMaze(textTracks, (url) => fetch(url), {
          englishRatio: await getEnglishRatio(),
          random: Math.random,
        });
        if (load !== latestLoad) return;
        maze = loaded;
        console.info(
          loaded
            ? "[mazelix] 字幕を maze しています"
            : "[mazelix] 日英の文字の字幕がそろわないため、maze しません",
        );
      } catch (error) {
        console.warn("[mazelix] 字幕を読み込めませんでした", error);
      }
    });

    const render = () => {
      const video = location.pathname.startsWith("/watch") ? document.querySelector("video") : null;
      const container = video?.parentElement;
      if (maze && video && container) {
        if (overlay.parentElement !== container) container.append(overlay);
        if (!hideNetflixSubtitles.isConnected) document.head.append(hideNetflixSubtitles);
        overlay.style.fontSize = `${Math.max(16, video.clientHeight * 0.045)}px`;
        updateOverlay(overlay, subtitleTextAt(maze, video.currentTime * 1000));
      } else {
        overlay.remove();
        hideNetflixSubtitles.remove();
      }
      ctx.requestAnimationFrame(render);
    };
    ctx.requestAnimationFrame(render);
  },
});
