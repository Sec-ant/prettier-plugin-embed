# Config Examples

## `prettier-plugin-sql`

Format SQL-in-JS with [`prettier-plugin-sql`](https://github.com/un-ts/prettier/tree/master/packages/sql) ([options](https://github.com/un-ts/prettier/tree/master/packages/sql#parser-options))

`prettier.config.mjs`

```js
/**
 * @type {import("prettier").Config}
 */
const prettierConfig = {
  plugins: ["prettier-plugin-embed", "prettier-plugin-sql"],
};

/**
 * @type {import("prettier-plugin-embed").PrettierPluginEmbedOptions}
 */
const prettierPluginEmbedConfig = {
  embeddedSqlIdentifiers: ["sql"],
};

/**
 * @type {import("prettier-plugin-sql").SqlBaseOptions}
 */
const prettierPluginSqlConfig = {
  language: "postgresql",
  keywordCase: "upper",
};

const config = {
  ...prettierConfig,
  ...prettierPluginEmbedConfig,
  ...prettierPluginSqlConfig,
};

export default config;
```

Before formatting:

```ts
const users = await sql`
        sELect       users.first_name,
users.email        ,
          companies.id 
as    employer_company_id
            froM  users
LefT JOIn
    employers ON
      users.id
  = employers.user_id
    LefT JOIn
      companies ON
employers.company_id = companies.id WHERE users.id = ${userId}
`;
```

After formatting:

```ts
const users = await sql`
  SELECT
    users.first_name,
    users.email,
    companies.id AS employer_company_id
  FROM
    users
    LEFT JOIN employers ON users.id = employers.user_id
    LEFT JOIN companies ON employers.company_id = companies.id
  WHERE
    users.id = ${userId}
`;
```
