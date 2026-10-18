// @prettier {"embeddedMarkdownIdentifiers": ["markdown"], "noEmbeddedMultiLineIndentation": ["markdown"]}
const markdown = String.raw;
function getMd() {
  return markdown`
    * Fruit
      * Apple
      * Orange
      * Banana
    * Dairy
      * Milk
      * Cheese

        console.log('indented code block')
      `;
}
