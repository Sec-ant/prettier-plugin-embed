// Issue #152: preserve line breaks before SQL template expressions.
function test() {
  const myId = 123;
  const otherClause = myId === 123 ? sql`AND id2 = 1234` : empty;

  const query = sql`
    SELECT *
    FROM table_name
    WHERE
      id = ${myId}
      ${otherClause}
  `;
}
