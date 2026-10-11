import type { Options } from "prettier";
import { describe, expect, it } from "vitest";
import { embeddedEmbedders } from "../../src/embedded/index.js";

const embedder = embeddedEmbedders.embeddedXml!;

describe("XML fragment embedder recovery", () => {
  it.each([
    { name: "stops without a recovery offset", recovery: undefined, calls: 1 },
    { name: "continues from a start offset", recovery: [2], calls: 2 },
    { name: "continues after a bounded fragment", recovery: [2, 3], calls: 2 },
    { name: "stops at the end of the fragment", recovery: [6], calls: 1 },
  ])("$name", async ({ recovery, calls }) => {
    const recoverIndex: number[] = [];
    const options = {
      parser: "babel",
      printWidth: 80,
      tabWidth: 2,
      __embeddedXmlFragmentRecoverIndex: recoverIndex,
    } as Options;
    const node = {
      quasis: [{ value: { cooked: "abcdef", raw: "abcdef" } }],
      expressions: [],
    };
    const path = { node, map: () => [] };
    let textToDocCalls = 0;
    const textToDoc = async (text: string) => {
      if (textToDocCalls === 0 && recovery) {
        recoverIndex.push(...recovery);
      }
      textToDocCalls++;
      return text;
    };

    await embedder(
      textToDoc as never,
      (() => "expression") as never,
      path as never,
      options,
      {
        commentOrTag: "xml",
        kind: "tag",
        embeddedOverrideOptions: undefined,
      },
    );

    expect(textToDocCalls).toBe(calls);
  });

  it("keeps recovered strict XML fragments contiguous", async () => {
    const recoverIndex: number[] = [];
    const options = {
      parser: "babel",
      printWidth: 80,
      tabWidth: 2,
      xmlWhitespaceSensitivity: "strict",
      __embeddedXmlFragmentRecoverIndex: recoverIndex,
    } as Options;
    const node = {
      quasis: [{ value: { cooked: "abcdef", raw: "abcdef" } }],
      expressions: [],
    };
    const path = { node, map: () => [] };
    let textToDocCalls = 0;
    const textToDoc = async (text: string) => {
      if (textToDocCalls === 0) recoverIndex.push(2);
      textToDocCalls++;
      return text;
    };

    await embedder(
      textToDoc as never,
      (() => "expression") as never,
      path as never,
      options,
      {
        commentOrTag: "xml",
        kind: "tag",
        embeddedOverrideOptions: undefined,
      },
    );

    expect(textToDocCalls).toBe(2);
  });
});
