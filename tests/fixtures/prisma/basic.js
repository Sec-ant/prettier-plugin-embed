// Prisma - Tag `prisma` test (with formatting issues)
const tagTest = prisma`
datasource db {
provider="postgresql"
url=env("DATABASE_URL")
}
model User {
id Int @id
name String
}
`;

// Prisma - Comment `/* prisma */` test (with formatting issues)
/* prisma */ `
model Post {
id Int @id @default(autoincrement())
title String
userId Int
}
`;
