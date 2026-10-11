import { expectTypeOf, it } from "vitest";
import type { NormalizeOptions } from "../src/embedded/utils.js";
import type {
  LiteralUnion,
  OmitIndexSignature,
  UnionToIntersection,
} from "../src/type-utils.js";

it("accepts built-in and consumer-defined string identifiers", () => {
  expectTypeOf<"html">().toExtend<LiteralUnion<"html", string>>();
  expectTypeOf<"customTag">().toExtend<LiteralUnion<"html", string>>();
  expectTypeOf<LiteralUnion<"html", string>>().toExtend<string>();
});

it("retains explicit option keys and their modifiers", () => {
  type Input = {
    [key: string]: unknown;
    readonly enabled?: boolean;
    count: number;
  };
  expectTypeOf<OmitIndexSignature<Input>>().toEqualTypeOf<{
    readonly enabled?: boolean;
    count: number;
  }>();
});

it("combines option variants and makes their named keys optional", () => {
  type Input =
    | { enabled: boolean; shared: string }
    | { count: number; shared: string };
  expectTypeOf<UnionToIntersection<Input>>().toExtend<{
    enabled: boolean;
    count: number;
    shared: string;
  }>();
  expectTypeOf<NormalizeOptions<Input>>().toEqualTypeOf<{
    enabled?: boolean;
    count?: number;
    shared?: string;
  }>();
});
