// INI - Tag `ini` test (with formatting issues: inconsistent spacing)
const tagTest = ini`
[database]
host=localhost
port =5432
user= admin
`;

// INI - Comment `/* ini */` test (with formatting issues)
/* ini */ `
[server]
address=0.0.0.0
timeout= 30
`;
