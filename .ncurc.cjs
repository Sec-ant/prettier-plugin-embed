module.exports = {
  upgrade: true,
  reject: [
    /^@?prettier(?:\/|$)/,
    /(?:^|@.+?\/)prettier-plugin-/,
    "@xml-tools/parser",
    "chevrotain",
  ],
};
