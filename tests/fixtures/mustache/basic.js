const tagged = mustache`
<section>{{#user}}<h1>{{name}}</h1>{{/user}}{{^user}}<p>Guest</p>{{/user}}</section>
`;

const commented = /* mustache */ `
<section>{{#user}}<h1>{{name}}</h1>{{/user}}{{^user}}<p>Guest</p>{{/user}}</section>
`;
