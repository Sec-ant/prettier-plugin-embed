// JSONata - Tag `jsonata` test (with formatting issues)
const tagTest = jsonata`
Account.Order.Product{"name":Product,"total":Price*Quantity}
`;

// JSONata - Comment `/* jsonata */` test (with formatting issues)
/* jsonata */ `
$sum(Order.(Price*Quantity))
`;
