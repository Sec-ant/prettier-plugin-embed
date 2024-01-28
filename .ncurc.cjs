module.exports = {
  upgrade: true,
  filterVersion: /^[~^]/,
  reject: [
    /^@?prettier(?:\/|$)/,
    /(?:^|@.+?\/)prettier-plugin-/,
    "@xml-tools/parser",
    "chevrotain",
    "@biomejs/biome",
  ],
};
