import { type Maze, type MazeOptions, prepareMaze } from "../domain/maze";
import { type Fetcher, fetchFirstAvailable } from "./fetch-subtitle";
import { selectTextTracks, subtitleUrls, type TextTrack } from "./text-tracks";
import { parseTtml } from "./ttml";

// マニフェストの字幕トラックの一覧から、日英の字幕を取得して maze を作る。
// どちらかの言語の文字の字幕がなければ maze できないので undefined を返す。
export async function loadMaze(
  textTracks: unknown[],
  fetcher: Fetcher,
  options: MazeOptions,
): Promise<Maze | undefined> {
  const { ja, en } = selectTextTracks(textTracks as TextTrack[]);
  const jaUrls = ja ? subtitleUrls(ja) : [];
  const enUrls = en ? subtitleUrls(en) : [];
  if (jaUrls.length === 0 || enUrls.length === 0) return undefined;

  const [jaXml, enXml] = await Promise.all([
    fetchFirstAvailable(jaUrls, fetcher),
    fetchFirstAvailable(enUrls, fetcher),
  ]);
  return prepareMaze({ ja: parseTtml(jaXml), en: parseTtml(enXml) }, options);
}
