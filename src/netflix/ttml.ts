import type { Cue } from "../domain/cue";

const TTML_PARAMETER_NS = "http://www.w3.org/ns/ttml#parameter";

export function parseTickTime(value: string, tickRate: number): number {
  return Math.round((Number.parseInt(value, 10) / tickRate) * 1000);
}

export function parseTtml(xml: string): Cue[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const tickRate = Number(
    doc.documentElement.getAttributeNS(TTML_PARAMETER_NS, "tickRate"),
  );

  return Array.from(doc.getElementsByTagName("p"), (p) => ({
    startMs: parseTickTime(p.getAttribute("begin") ?? "", tickRate),
    endMs: parseTickTime(p.getAttribute("end") ?? "", tickRate),
    text: textOf(p),
  }));
}

function textOf(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ?? "";
  if (node.nodeName === "br") return "\n";
  return Array.from(node.childNodes, textOf).join("");
}
