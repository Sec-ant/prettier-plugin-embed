// Issue #161: match Prisma raw SQL tags by method suffix.
// @prettier {"embeddedSqlTags":["/\\.\\$(?:query|execute)Raw$/"]}
const query = ctx.prisma.$queryRaw`select id,name from users where active=true`;
const command = transaction.$executeRaw`delete from users where inactive=true`;
