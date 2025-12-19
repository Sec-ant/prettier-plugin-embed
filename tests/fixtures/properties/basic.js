// Properties - Tag `properties` test (with formatting issues: inconsistent spacing)
const tagTest = properties`
app.name=MyApp
app.version= 1.0.0
database.url =localhost
`;

// Properties - Comment `/* properties */` test (with formatting issues)
/* properties */ `
server.port=8080
server.timeout= 30000
`;
