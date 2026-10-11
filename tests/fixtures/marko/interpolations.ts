const generated: string = marko`
<section class="${getFirstValue({ items: [1, 2], enabled: true })}"><h1>${getSecondValue(/* label */ { value: input })} \${input.name}</h1></section>
`;
