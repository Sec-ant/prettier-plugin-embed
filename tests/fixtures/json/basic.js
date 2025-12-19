// JSON - Tag `json` test (with formatting issues)
const tagTest = json`
{"name":"test","version":"1.0.0","dependencies":{"lodash":"^4.0"}}
`;

// JSON - Comment `/* json */` test (with formatting issues)
/* json */ `
{"users":[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]}
`;
