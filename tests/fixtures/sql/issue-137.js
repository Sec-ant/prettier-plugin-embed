// @prettier {"embeddedSqlTags": ["sql.type"]}
sql.type(SESSION)`
  INSERT INTO sessions (account_id, expires_at)
  VALUES (${accountId}, ${expiresAt.toJSON()})
  RETURNING
    id,
    created_at AS "createdAt",
    updated_at AS "updatedAt",
    expires_at AS "expiresAt",
    account_id AS "accountId"
`;
