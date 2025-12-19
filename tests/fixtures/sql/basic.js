// SQL - Tag `sql` test (with formatting issues)
const tagTest = sql`
SELECT id,name,email FROM users WHERE status='active' ORDER BY id
`;

// SQL - Comment `/* sql */` test (with formatting issues)
/* sql */ `
INSERT INTO users(name,email)VALUES('John','john@test.com')
`;
