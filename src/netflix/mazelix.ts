import { type Maze, remaze, subtitleTextAt } from "../domain/maze";
import { getEnglishRatio, watchEnglishRatio } from "../settings";
import type { Fetcher } from "./fetch-subtitle";
import { loadMaze } from "./load-maze";
import { isForCurrentVideo, watchedMovieId } from "./manifest";
import { isTextTracksMessage } from "./messages";
import { createOverlay, updateOverlay } from "./overlay";

const HIDE_NETFLIX_SUBTITLES = ".player-timedtext, .image-based-timed-text { display: none !important; }";

// content script が Chrome やページから受け取るもの。テストでは偽物に差し替える
export type MazelixEnv = {
  window: Window;
  fetcher: Fetcher;
  random: () => number;
  onMessage: (listener: (event: MessageEvent) => void) => void;
  onAnimationFrame: (callback: () => void) => void;
};

// マニフェストを受け取って字幕を maze し、動画の再生位置に合わせて描画する。
// 英語の割合の監視をやめる関数を返す
export function startMazelix({ window, fetcher, random, onMessage, onAnimationFrame }: MazelixEnv) {
  const { document, location } = window;
  let maze: Maze | undefined;
  let latestLoad = 0;
  const overlay = createOverlay(document);
  const hideNetflixSubtitles = document.createElement("style");
  hideNetflixSubtitles.textContent = HIDE_NETFLIX_SUBTITLES;

  // ポップアップで英語の割合が変わったら、再生中の字幕の計画を作り直す
  const unwatch = watchEnglishRatio((englishRatio) => {
    if (maze) maze = remaze(maze, { englishRatio, random });
  });

  // 再生中に「次のエピソード」へ進むと、先読みしておいたマニフェストが使い回されて
  // 新しいマニフェストが届かないので、届いたものは作品 ID ごとに覚えておく
  const textTracksByMovieId = new Map<number, unknown[]>();
  let mazeMovieId: number | undefined;

  onMessage((event) => {
    if (event.source !== window || !isTextTracksMessage(event.data)) return;
    const { textTracks, movieId } = event.data;
    if (movieId !== undefined) textTracksByMovieId.set(movieId, textTracks);
    if (!isForCurrentVideo(movieId, location.pathname)) {
      console.info("[mazelix] 再生中の作品ではないマニフェストなので、覚えておきます", {
        movieId,
        pathname: location.pathname,
      });
      return;
    }
    console.info("[mazelix] 字幕を読み込みます", { movieId, pathname: location.pathname });
    mazeMovieId = watchedMovieId(location.pathname);
    void loadSubtitles(textTracks);
  });

  // URL の作品 ID が変わったら前の作品の字幕を捨て、覚えておいた字幕トラックがあれば読み込む
  const followWatchedMovie = () => {
    const movieId = watchedMovieId(location.pathname);
    if (movieId === mazeMovieId) return;
    mazeMovieId = movieId;
    latestLoad++;
    maze = undefined;
    const textTracks = movieId === undefined ? undefined : textTracksByMovieId.get(movieId);
    if (textTracks) {
      console.info("[mazelix] 覚えておいたマニフェストから字幕を読み込みます", { movieId });
      void loadSubtitles(textTracks);
    }
  };

  const loadSubtitles = async (textTracks: unknown[]) => {
    const load = ++latestLoad;
    maze = undefined;
    try {
      const loaded = await loadMaze(textTracks, fetcher, {
        englishRatio: await getEnglishRatio(),
        random,
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
  };

  const render = () => {
    followWatchedMovie();
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
    onAnimationFrame(render);
  };
  onAnimationFrame(render);

  return unwatch;
}
