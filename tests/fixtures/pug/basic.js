// Pug - Tag `pug` test (with formatting issues: inconsistent indentation)
const tagTest = pug`
html
  head
      title Test
  body
    .container
     p Hello
`;

// Pug - Comment `/* pug */` test (with formatting issues)
/* pug */ `
div
  span Text
   a(href="#") Link
`;
