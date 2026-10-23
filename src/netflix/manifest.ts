// ページの JSON.parse で読まれた値が Netflix のマニフェストなら、字幕トラックの一覧を返す
export function extractTextTracks(value: unknown): unknown[] | undefined {
  const textTracks = (value as { result?: { textTracks?: unknown } } | null)?.result
    ?.textTracks;
  return Array.isArray(textTracks) ? textTracks : undefined;
}

export function extractMovieId(value: unknown): number | undefined {
  const movieId = (value as { result?: { movieId?: unknown } } | null)?.result?.movieId;
  return typeof movieId === "number" ? movieId : undefined;
}

// 再生中に次のエピソードのマニフェストが先読みされることがあるので、URL の作品 ID と照らし合わせる
export function isForCurrentVideo(movieId: number | undefined, pathname: string): boolean {
  if (movieId === undefined) return true;
  return pathname === `/watch/${movieId}`;
}
