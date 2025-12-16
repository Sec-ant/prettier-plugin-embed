// Issue #64: Object properties as identifiers
// https://github.com/Sec-ant/prettier-plugin-embed/issues/64
// @prettier {"embeddedSqlTags": ["db.sql"]}
db.sql`
  SELECT   *   FROM users   WHERE id = ${userId}
`;
