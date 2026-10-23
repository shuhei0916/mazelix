import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "mazelix",
    description: "Netflix の字幕を日英で混ぜて表示し、ドラマを観ながら英語に触れる",
    permissions: ["storage"],
  },
});
