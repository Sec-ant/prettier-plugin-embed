import * as prettier from "prettier";
const code = "const a=1;";
console.log(
  await prettier.format(code, {
    parser: "babel",
    plugins: ["./dist/index.js"],
  }),
);
