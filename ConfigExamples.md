# Config Examples

## SQL

Format SQL-in-JS with [`prettier-plugin-sql`](https://github.com/un-ts/prettier/tree/master/packages/sql#readme) ([options](https://github.com/un-ts/prettier/tree/master/packages/sql#parser-options)).

### Installation

Install the formatter and both plugins:

```sh
npm install --save-dev prettier prettier-plugin-embed prettier-plugin-sql
```

### Configuration

`prettier.config.mjs`

```js
/** @type {import("prettier").Config & import("prettier-plugin-embed").PluginEmbedOptions & import("prettier-plugin-sql").SqlBaseOptions} */
export default {
  plugins: ["prettier-plugin-embed", "prettier-plugin-sql"],
  embeddedSqlTags: ["sql"],
  language: "postgresql",
  keywordCase: "upper",
};
```

### Input

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

### Formatted output

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

## Liquid

Format Liquid-in-JS with [`@shopify/prettier-plugin-liquid`](https://github.com/Shopify/theme-tools/tree/main/packages/prettier-plugin-liquid#readme).

### Installation

Install the formatter and both plugins:

```sh
npm install --save-dev prettier prettier-plugin-embed @shopify/prettier-plugin-liquid
```

### Configuration

`prettier.config.mjs`

```js
export default {
  plugins: ["prettier-plugin-embed", "@shopify/prettier-plugin-liquid"],
  embeddedLiquidTags: ["liquid"],
};
```

### Input

```ts
const greeting = liquid`<p>{{user.name|escape}}</p>`;
```

### Formatted output

```ts
const greeting = liquid`<p>{{ user.name | escape }}</p>`;
```

## Dockerfile and Shell

Format Dockerfile and Shell-in-JS with [`prettier-plugin-sh`](https://github.com/un-ts/prettier/tree/master/packages/sh#readme). Each tag selects the language's parser from the same plugin.

### Installation

Install the formatter and both plugins:

```sh
npm install --save-dev prettier prettier-plugin-embed prettier-plugin-sh
```

### Configuration

`prettier.config.mjs`

```js
export default {
  plugins: ["prettier-plugin-embed", "prettier-plugin-sh"],
  embeddedDockerfileTags: ["dockerfile", "containerfile"],
  embeddedShTags: ["sh"],
};
```

### Input

```ts
const image = dockerfile`FROM node:24-alpine
RUN echo ready&&echo done`;
const command = sh`echo ready&&echo done`;
```

### Formatted output

```ts
const image = dockerfile`
  FROM node:24-alpine
  RUN echo ready && echo done
`;
const command = sh`echo ready && echo done`;
```
