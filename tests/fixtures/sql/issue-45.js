// Issue #45: Multi-line dollar-quoted strings formatting
// https://github.com/Sec-ant/prettier-plugin-embed/issues/45
sql`
  SELECT $$a
    b$$::text AS val
`;
