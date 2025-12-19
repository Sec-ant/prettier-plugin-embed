// Markdown - Tag `md` test (with formatting issues: inconsistent list markers)
const tagTest = md`
# Title
*  Item 1
*   Item 2
+  Item 3
`;

// Markdown - Comment `/* markdown */` test (with formatting issues)
/* markdown */ `
## Heading
-  First
-   Second
`;
