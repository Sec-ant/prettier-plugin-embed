const tagged = marko`
<section><h1>Hello \${input.name}</h1><p>World</p></section>
`;

const commented = /* marko */ `
<section><h1>Hello \${input.name}</h1><p>World</p></section>
`;
