type VideoPlayer = { seek(timeMs: number): void };

type NetflixGlobal = {
  appContext: {
    state: {
      playerApp: {
        getAPI(): {
          videoPlayer: {
            getAllPlayerSessionIds(): string[];
            getVideoPlayerBySessionId(id: string): VideoPlayer | undefined;
          };
        };
      };
    };
  };
};

// ページの window.netflix から、再生中のプレイヤーをシークする。
// video.currentTime を直接書き換えると Netflix がエラーを出すことがあるので、プレイヤー自身の API を使う
export function seekNetflixPlayer(netflix: unknown, timeMs: number): boolean {
  try {
    const videoPlayer = (netflix as NetflixGlobal).appContext.state.playerApp.getAPI().videoPlayer;
    const sessionId = videoPlayer.getAllPlayerSessionIds().at(-1);
    const player = sessionId === undefined ? undefined : videoPlayer.getVideoPlayerBySessionId(sessionId);
    if (!player) return false;
    player.seek(timeMs);
    return true;
  } catch {
    // Netflix 側の変更で API の形が変わっていても、Netflix の動作は妨げない
    return false;
  }
}
