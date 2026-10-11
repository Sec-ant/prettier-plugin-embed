const tagged = xquery`
for $item in (1,2,3) return <item>{$item}</item>
`;

const commented = /* xquery */ `
for $item in (1,2,3) return <item>{$item}</item>
`;
