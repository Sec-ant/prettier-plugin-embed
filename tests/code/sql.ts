/* eslint-disable @typescript-eslint/no-unused-vars */

/* sql */ `ALTER TABLE t ALTER ${"COLUMN"} ${456} SET DEFAULT ${123};
          ALTER TABLE t ALTER COLUMN foo DROP DEFAULT;
          ALTER TABLE t ALTER COLUMN foo DROP SCOPE CASCADE;
          ALTER TABLE t ALTER COLUMN foo RESTART WITH 10;`;

/* mdb */ `SHOW TABLES WHERE Tables_in_test LIKE 'a%';`;
