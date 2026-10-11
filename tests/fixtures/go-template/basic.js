const tagged = goTemplate`
<section>{{if .User}}<h1>{{.User.Name}}</h1>{{else}}<p>Guest</p>{{end}}</section>
`;

const commented = /* goTemplate */ `
<section>{{if .User}}<h1>{{.User.Name}}</h1>{{else}}<p>Guest</p>{{end}}</section>
`;
