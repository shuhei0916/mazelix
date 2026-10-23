// Netflix の IMSC 1.1 字幕と同じ構造の TTML を組み立てる（文章は自作）
export function ttml(
  body: string,
  { tickRate = 10_000_000, styles = "", regions = "" } = {},
): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<tt xmlns="http://www.w3.org/ns/ttml" xmlns:ttp="http://www.w3.org/ns/ttml#parameter" xmlns:tts="http://www.w3.org/ns/ttml#styling" ttp:tickRate="${tickRate}" ttp:timeBase="media" xml:lang="ja">
<head>
<styling>
<style xml:id="style0" tts:textAlign="center"/>
${styles}
</styling>
<layout>
${regions}
</layout>
</head>
<body>
<div>
${body}
</div>
</body>
</tt>`;
}
