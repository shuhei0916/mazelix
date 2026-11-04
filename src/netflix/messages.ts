export type TextTracksMessage = {
  source: "mazelix";
  type: "text-tracks";
  textTracks: unknown[];
  movieId: number | undefined;
};

export function textTracksMessage(
  textTracks: unknown[],
  movieId: number | undefined,
): TextTracksMessage {
  return { source: "mazelix", type: "text-tracks", textTracks, movieId };
}

// ページ側（MAIN world）から拡張側へ window.postMessage で送るので、Netflix 自身のメッセージと区別する
export function isTextTracksMessage(data: unknown): data is TextTracksMessage {
  const message = data as Partial<TextTracksMessage> | null;
  return (
    message?.source === "mazelix" &&
    message.type === "text-tracks" &&
    Array.isArray(message.textTracks)
  );
}

// 拡張側からページ側（MAIN world）へ、Netflix プレイヤーのシークを頼む
export type SeekMessage = {
  source: "mazelix";
  type: "seek";
  timeMs: number;
};

export function seekMessage(timeMs: number): SeekMessage {
  return { source: "mazelix", type: "seek", timeMs };
}

export function isSeekMessage(data: unknown): data is SeekMessage {
  const message = data as Partial<SeekMessage> | null;
  return (
    message?.source === "mazelix" &&
    message.type === "seek" &&
    typeof message.timeMs === "number" &&
    message.timeMs >= 0
  );
}
