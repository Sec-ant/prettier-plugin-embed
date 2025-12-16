// Issue #120: noEmbeddedMultiLineIndentation not working for markdown
// https://github.com/Sec-ant/prettier-plugin-embed/issues/120
// @prettier {"embeddedMarkdownIdentifiers": ["markdown"], "noEmbeddedMultiLineIndentation": ["markdown"]}
const markdown = String.raw;
function getMd() {
  if (true) {
    if (true) {
      return markdown`
#   Hello



**This is some bold text**
      `;
    }
  }
}
