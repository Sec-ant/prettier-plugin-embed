// GraphQL - Tag `graphql` test (with formatting issues)
const tagTest = graphql`
query GetUser($id:ID!){user(id:$id){id name email}}
`;

// GraphQL - Comment `/* graphql */` test (with formatting issues)
/* graphql */ `
mutation CreateUser($name:String!,$email:String!){createUser(name:$name,email:$email){id}}
`;
