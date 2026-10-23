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
