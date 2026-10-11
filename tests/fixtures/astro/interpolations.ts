const generated: string = astro`
---
const title=${getFirstValue({ items: [1, 2], enabled: true })};
---
<section class="${getSecondValue(/* label */ { value: input })}"><h1>{title}</h1></section>
`;
