const tagged = astro`
---
const title='Hello';
---
<section><h1>{title}</h1><p>World</p></section>
`;

const commented = /* astro */ `
---
const title='Hello';
---
<section><h1>{title}</h1><p>World</p></section>
`;
