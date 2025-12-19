sql`
  SELECT
    *
  FROM
    longer_table_name_with_many_characters
  WHERE
    longer_table_name_with_many_characters.id IN ${sql(
      longerTableNameWithManyCharactersIds,
    )}
`;

sql`
  SELECT
    *
  FROM
    ${sql(
      evenLongerTableNameWithManyCharactersKeepsGoingEvenLongerAndLongerAndLonger,
    )}
`;
