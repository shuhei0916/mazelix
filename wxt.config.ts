import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "mazelix - Netflix 日英ミックス字幕",
    // ツールバーなど、長い名前が入らない場所に出す名前
    short_name: "mazelix",
    description: "Netflix の字幕を日英で混ぜて表示し、ドラマを観ながら英語に触れる",
    permissions: ["storage"],
    // content script から英和辞書のファイルを読むため
    web_accessible_resources: [
      { resources: ["dictionary/ejdict.txt"], matches: ["https://www.netflix.com/*"] },
    ],
  },
});
