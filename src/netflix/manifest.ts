// ページの JSON.parse で読まれた値が Netflix のマニフェストなら、字幕トラックの一覧を返す
export function extractTextTracks(value: unknown): unknown[] | undefined {
  const textTracks = (value as { result?: { textTracks?: unknown } } | null)?.result
    ?.textTracks;
  return Array.isArray(textTracks) ? textTracks : undefined;
}
