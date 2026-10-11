import prettier from "prettier";
import { expect, it } from "vitest";
import * as embed from "../../src";

it.each(["typescript", "babel-ts"])(
  "formats embedded JSX with %s inside a TypeScript host file",
  async (embeddedTsParser) => {
    const options = {
      filepath: "consumer.ts",
      plugins: [embed],
      embeddedTsParser: embeddedTsParser as "typescript" | "babel-ts",
    };
    const formatted = await prettier.format(
      "const view: string = ts`const View=()=> <Button label={'ready'}/>;`;",
      options,
    );
    expect(formatted).toContain('label={"ready"}');
    expect(formatted).toContain("const View = () => <Button");
    expect(await prettier.format(formatted, options)).toBe(formatted);
  },
);
