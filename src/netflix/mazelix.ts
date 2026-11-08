import type { WordFrequency } from "../domain/difficulty";
import type { Definition } from "../domain/dictionary";
import {
  type Maze,
  nextSentenceStart,
  previousSentenceStart,
  remaze,
  subtitleAt,
  toggleLangAt,
} from "../domain/maze";
import { getEnglishRatio, watchEnglishRatio } from "../settings";
import type { Fetcher } from "./fetch-subtitle";
import { createDictionaryPopup, popupPosition, showDefinitions } from "./dictionary-popup";
import { loadMaze } from "./load-maze";
import { isForCurrentVideo, watchedMovieId } from "./manifest";
import { isTextTracksMessage } from "./messages";
import { createOverlay, isPointerOnWord, subtitleBottom, updateOverlay } from "./overlay";

// 操作パネル（再生バーなど）が出ている間だけ DOM にある要素
const BOTTOM_CONTROLS = ".watch-video--bottom-controls-container";

const HIDE_NETFLIX_SUBTITLES = ".player-timedtext, .image-based-timed-text { display: none !important; }";

// content script が Chrome やページから受け取るもの。テストでは偽物に差し替える
export type MazelixEnv = {
  window: Window;
  fetcher: Fetcher;
  random: () => number;
  onMessage: (listener: (event: MessageEvent) => void) => void;
  onKeyDown: (listener: (event: KeyboardEvent) => void) => void;
  onAnimationFrame: (callback: () => void) => void;
  // Netflix プレイヤーを指定したミリ秒の位置にシークする
  seek: (timeMs: number) => void;
  // 英単語の頻度。簡単な英文のセリフから順に英語にするのに使う
  wordFrequency: WordFrequency;
  // 英単語を英和辞書で引く
  lookUpWord: (word: string) => Promise<Definition[]>;
  // 辞書の外をクリックしたら閉じるために、ページのどこかが押されたことを受け取る
  onPointerDown: (listener: (event: PointerEvent) => void) => void;
};

const SHORTCUTS = { a: "previous", d: "next", w: "toggle-lang" } as const;
type Shortcut = (typeof SHORTCUTS)[keyof typeof SHORTCUTS];

// Ctrl+W（タブを閉じる）などの組み合わせや、文字の入力中は奪わない
function shortcutOf(event: KeyboardEvent): Shortcut | undefined {
  if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return undefined;
  const target = event.target as HTMLElement | null;
  if (target?.closest?.("input, textarea, select, [contenteditable]")) return undefined;
  return SHORTCUTS[event.key.toLowerCase() as keyof typeof SHORTCUTS];
}

// マニフェストを受け取って字幕を maze し、動画の再生位置に合わせて描画する。
// 英語の割合の監視をやめる関数を返す
export function startMazelix({
  window,
  fetcher,
  random,
  onMessage,
  onKeyDown,
  onAnimationFrame,
  seek,
  wordFrequency,
  lookUpWord,
  onPointerDown,
}: MazelixEnv) {
  const { document, location } = window;
  let maze: Maze | undefined;
  let latestLoad = 0;
  // 辞書を開いている単語の要素
  let lookedUpWord: HTMLElement | undefined;
  // 動画を包む要素（字幕と辞書の位置の基準）
  let player: HTMLElement | undefined;
  const closeDictionary = () => {
    lookedUpWord = undefined;
    dictionary.hidden = true;
  };
  const dictionary = createDictionaryPopup(document, { onClose: closeDictionary });

  const openDictionary = async (word: string, element: HTMLElement) => {
    // 同じ単語をもう一度クリックしたら閉じる
    if (lookedUpWord === element) return closeDictionary();
    lookedUpWord = element;
    let definitions: Definition[];
    try {
      definitions = await lookUpWord(word);
    } catch (error) {
      console.warn("[mazelix] 辞書を読み込めませんでした", error);
      return;
    }
    // 引いている間に、別の単語をクリックしたり閉じたりしていたら表示しない
    if (lookedUpWord !== element) return;
    showDefinitions(dictionary, word, definitions);
    if (!player) return;
    const playerRect = player.getBoundingClientRect();
    const { left, bottom } = popupPosition(
      element.getBoundingClientRect(),
      playerRect,
      dictionary.offsetWidth,
    );
    // 辞書は画面に固定して置くので、動画からの位置を画面からの位置に直す
    Object.assign(dictionary.style, {
      left: `${playerRect.left + left}px`,
      bottom: `${window.innerHeight - playerRect.bottom + bottom}px`,
    });
  };
  const overlay = createOverlay(document, {
    onWordClick: (word, element) => void openDictionary(word, element),
  });

  onPointerDown((event) => {
    const target = event.target as Node | null;
    if (!lookedUpWord || dictionary.contains(target) || overlay.contains(target)) return;
    closeDictionary();
  });
  const hideNetflixSubtitles = document.createElement("style");
  hideNetflixSubtitles.textContent = HIDE_NETFLIX_SUBTITLES;

  // ポップアップで英語の割合が変わったら、再生中の字幕の計画を作り直す
  const unwatch = watchEnglishRatio((englishRatio) => {
    if (maze) maze = remaze(maze, { englishRatio, random, wordFrequency });
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
        wordFrequency,
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

  const watchedVideo = () =>
    location.pathname.startsWith("/watch") ? document.querySelector("video") : null;

  onKeyDown((event) => {
    const video = watchedVideo();
    const shortcut = shortcutOf(event);
    if (!maze || !video || !shortcut) return;
    const timeMs = video.currentTime * 1000;
    if (shortcut === "toggle-lang") {
      // 分からない英文の意味を確かめられるよう、再生位置のセリフの日英を入れ替える
      maze = toggleLangAt(maze, timeMs);
      return;
    }
    const target =
      shortcut === "previous" ? previousSentenceStart(maze, timeMs) : nextSentenceStart(maze, timeMs);
    if (target !== undefined) seek(target);
  });

  const render = () => {
    followWatchedMovie();
    const video = watchedVideo();
    const container = video?.parentElement;
    if (maze && video && container) {
      player = container;
      // Netflix は動画の上に操作用の透明な要素を重ねている。動画の親の中に字幕を置くと、
      // 単語へのマウス操作がその要素に奪われるので、ページ（全画面なら全画面の要素）の
      // 最後に置いて、いちばん手前に出す
      const host = document.fullscreenElement ?? document.body;
      if (host.lastElementChild !== dictionary || overlay.nextElementSibling !== dictionary) {
        host.append(overlay, dictionary);
      }
      if (!hideNetflixSubtitles.isConnected) document.head.append(hideNetflixSubtitles);
      overlay.style.fontSize = `${Math.max(16, video.clientHeight * 0.045)}px`;
      const playerRect = container.getBoundingClientRect();
      overlay.style.left = `${playerRect.left + playerRect.width / 2}px`;
      overlay.style.maxWidth = `${playerRect.width * 0.8}px`;
      const controls = document.querySelector(BOTTOM_CONTROLS);
      // 字幕は画面に固定して置くので、動画の下端からの高さを画面の下端からの高さに直す
      const bottom =
        window.innerHeight -
        playerRect.bottom +
        subtitleBottom(playerRect, controls?.getBoundingClientRect().top);
      // 単語にマウスを乗せている間や辞書を開いている間は、操作パネルが消えても字幕を下げない。
      // 下げると、クリックしようとした単語がカーソルの下から逃げてしまう。
      // 上げるのは止めない（下のままだと、操作パネルが単語を覆ってクリックを奪う）
      const holding = isPointerOnWord(overlay) || !dictionary.hidden;
      const current = Number.parseFloat(overlay.style.bottom);
      overlay.style.bottom = `${holding && current > bottom ? current : bottom}px`;
      dictionary.style.fontSize = `${Math.max(14, video.clientHeight * 0.026)}px`;
      const { text, lang } = subtitleAt(maze, video.currentTime * 1000);
      updateOverlay(overlay, text, lang);
    } else {
      player = undefined;
      overlay.remove();
      closeDictionary();
      dictionary.remove();
      hideNetflixSubtitles.remove();
    }
    onAnimationFrame(render);
  };
  onAnimationFrame(render);

  return unwatch;
}

