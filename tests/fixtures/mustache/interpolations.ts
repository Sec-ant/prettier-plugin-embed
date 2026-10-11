const generated: string = mustache`
<section class="${getFirstValue({ items: [1, 2], enabled: true })}">{{#user}}<h1>${getSecondValue(/* label */ { value: input })} {{name}}</h1>{{/user}}</section>
`;
