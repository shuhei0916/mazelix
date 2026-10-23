import type { Cue } from "../domain/cue";

const TTML_PARAMETER_NS = "http://www.w3.org/ns/ttml#parameter";
const TTML_STYLING_NS = "http://www.w3.org/ns/ttml#styling";

export function parseTickTime(value: string, tickRate: number): number {
  return Math.round((Number.parseInt(value, 10) / tickRate) * 1000);
}

export function parseTtml(xml: string): Cue[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const tickRate = Number(
    doc.documentElement.getAttributeNS(TTML_PARAMETER_NS, "tickRate"),
  );
  const rubyTextStyles = new Set(
    Array.from(doc.getElementsByTagName("style"))
      .filter((style) => style.getAttributeNS(TTML_STYLING_NS, "ruby") === "text")
      .map((style) => style.getAttribute("xml:id")),
  );

  const regionPositions = new Map(
    Array.from(doc.getElementsByTagName("region"), (region) => [
      region.getAttribute("xml:id"),
      verticalPositionOf(region.getAttributeNS(TTML_STYLING_NS, "origin")),
    ]),
  );

  function textOf(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ?? "";
    if (node.nodeName === "br") return "\n";
    if (node instanceof Element && rubyTextStyles.has(node.getAttribute("style"))) {
      return "";
    }
    return Array.from(node.childNodes, textOf).join("");
  }

  return Array.from(doc.getElementsByTagName("p"), (p) => {
    const verticalPosition = regionPositions.get(p.getAttribute("region"));
    return {
      startMs: parseTickTime(p.getAttribute("begin") ?? "", tickRate),
      endMs: parseTickTime(p.getAttribute("end") ?? "", tickRate),
      text: textOf(p),
      ...(verticalPosition === undefined ? {} : { verticalPosition }),
    };
  });
}

// tts:origin="25.000% 79.290%" の 2 つ目（縦位置）を取り出す
function verticalPositionOf(origin: string | null): number | undefined {
  const y = origin?.split(/\s+/)[1];
  return y === undefined ? undefined : Number.parseFloat(y);
}
