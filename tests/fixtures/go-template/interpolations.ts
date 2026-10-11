const generated: string = goTemplate`
<section class="${getFirstValue({ items: [1, 2], enabled: true })}">{{if .User}}<h1>${getSecondValue(/* label */ { value: input })} {{.User.Name}}</h1>{{end}}</section>
`;
