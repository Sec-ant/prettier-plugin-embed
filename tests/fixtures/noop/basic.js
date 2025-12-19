// Noop - Tag `noop` test (content should NOT be formatted, spaces preserved)
const tagTest = noop`
This   text   will   NOT   be   formatted.   Spaces   preserved.
`;

// Noop - Comment `/* noop */` test (content should NOT be formatted)
/* noop */ `
Multiple    spaces    and    irregular    formatting    kept.
`;
