/* eslint-disable @typescript-eslint/no-unused-vars */

/* sql */ `SELECT *
FROM
tbl
WHERE
  foo = 'bar';


  UPDATE a SET id = 1 WHERE name IN (SELECT name FROM b)`;

/* sql */ `
ALTER TABLE ${"table"}
`;

/* mdb */ `SHOW TABLES WHERE Tables_in_test LIKE 'a%';`;
