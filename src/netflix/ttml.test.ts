import { describe, expect, it } from "vitest";
import { parseTickTime } from "./ttml";

describe("parseTickTime", () => {
  it("tick 表記の時刻を、tickRate を使ってミリ秒に変換する", () => {
    expect(parseTickTime("64650000t", 10_000_000)).toBe(6465);
  });

  it("ミリ秒未満は四捨五入する", () => {
    expect(parseTickTime("32952502t", 10_000_000)).toBe(3295);
    expect(parseTickTime("32957502t", 10_000_000)).toBe(3296);
  });
});
