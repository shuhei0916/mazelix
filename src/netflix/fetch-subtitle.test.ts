import { describe, expect, it } from "vitest";
import { fetchFirstAvailable } from "./fetch-subtitle";

function fakeFetch(responses: Record<string, { ok: boolean; body: string } | Error>) {
  const requested: string[] = [];
  const fetcher = async (url: string) => {
    requested.push(url);
    const response = responses[url];
    if (!response || response instanceof Error) throw response ?? new Error("not found");
    return { ok: response.ok, text: async () => response.body };
  };
  return { fetcher, requested };
}

describe("fetchFirstAvailable", () => {
  it("先頭の URL の内容を返す", async () => {
    const { fetcher, requested } = fakeFetch({
      "https://cdn1/ja": { ok: true, body: "<tt>1</tt>" },
      "https://cdn2/ja": { ok: true, body: "<tt>2</tt>" },
    });

    await expect(fetchFirstAvailable(["https://cdn1/ja", "https://cdn2/ja"], fetcher)).resolves.toBe(
      "<tt>1</tt>",
    );
    expect(requested).toEqual(["https://cdn1/ja"]);
  });
});

describe("fetchFirstAvailable（取得に失敗したとき）", () => {
  it("通信エラーやエラー応答なら、次の URL を試す", async () => {
    const { fetcher, requested } = fakeFetch({
      "https://cdn1/ja": new Error("network error"),
      "https://cdn2/ja": { ok: false, body: "Forbidden" },
      "https://cdn3/ja": { ok: true, body: "<tt>3</tt>" },
    });

    await expect(
      fetchFirstAvailable(["https://cdn1/ja", "https://cdn2/ja", "https://cdn3/ja"], fetcher),
    ).resolves.toBe("<tt>3</tt>");
    expect(requested).toEqual(["https://cdn1/ja", "https://cdn2/ja", "https://cdn3/ja"]);
  });

  it("すべて失敗したら、エラーにする", async () => {
    const { fetcher } = fakeFetch({ "https://cdn1/ja": { ok: false, body: "Forbidden" } });

    await expect(fetchFirstAvailable(["https://cdn1/ja"], fetcher)).rejects.toThrow(
      "字幕を取得できませんでした",
    );
  });

  it("URL が 1 つもなければ、エラーにする", async () => {
    const { fetcher } = fakeFetch({});

    await expect(fetchFirstAvailable([], fetcher)).rejects.toThrow("字幕を取得できませんでした");
  });
});
