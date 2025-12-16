// Issue #35: SQL casts, tilde, square brackets, $$ delimiter
// https://github.com/Sec-ant/prettier-plugin-embed/issues/35
sql`
  SELECT ($$abc$$)::text AS val, [col]::int, $do$ select 1 $do$;
`;
