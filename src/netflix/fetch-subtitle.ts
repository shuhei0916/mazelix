export type Fetcher = (url: string) => Promise<{ ok: boolean; text(): Promise<string> }>;

// 同じ字幕ファイルが配信元ごとに複数の URL で提供されるので、取得できるまで順に試す
export async function fetchFirstAvailable(urls: string[], fetcher: Fetcher): Promise<string> {
  for (const url of urls) {
    try {
      const response = await fetcher(url);
      if (response.ok) return await response.text();
    } catch {
      // 次の配信元を試す
    }
  }
  throw new Error(`字幕を取得できませんでした（${urls.length} 件の URL を試しました）`);
}
