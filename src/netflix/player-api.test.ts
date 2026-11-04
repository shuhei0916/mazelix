import { describe, expect, it, vi } from "vitest";
import { seekNetflixPlayer } from "./player-api";

// ページの window.netflix のうち、シークに使う部分だけを再現する
function fakeNetflix(sessionIds: string[]) {
  const seek = vi.fn();
  const netflix = {
    appContext: {
      state: {
        playerApp: {
          getAPI: () => ({
            videoPlayer: {
              getAllPlayerSessionIds: () => sessionIds,
              getVideoPlayerBySessionId: (id: string) => (sessionIds.includes(id) ? { seek } : undefined),
            },
          }),
        },
      },
    },
  };
  return { netflix, seek };
}

describe("seekNetflixPlayer", () => {
  it("再生中のプレイヤーを、指定したミリ秒の位置にシークする", () => {
    const { netflix, seek } = fakeNetflix(["watch-1"]);

    expect(seekNetflixPlayer(netflix, 5000)).toBe(true);
    expect(seek).toHaveBeenCalledWith(5000);
  });

  it("再生中のプレイヤーがなければ、何もせず false を返す", () => {
    expect(seekNetflixPlayer(fakeNetflix([]).netflix, 5000)).toBe(false);
  });

  it("Netflix の API の形が変わっていたら、例外を投げずに false を返す", () => {
    expect(seekNetflixPlayer(undefined, 5000)).toBe(false);
    expect(seekNetflixPlayer({ appContext: {} }, 5000)).toBe(false);
  });
});
